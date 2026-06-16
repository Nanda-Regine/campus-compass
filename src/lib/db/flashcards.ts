// ─────────────────────────────────────────────────────────────────────────────
// src/lib/db/flashcards.ts
// Data-access layer for flashcard decks + cards (Supabase, client-side).
//
// Tables
//   flashcard_decks  — id, user_id, name, module_id, module_name, color,
//                       created_at, updated_at
//   flashcard_cards  — id, deck_id, user_id, front, back,
//                       interval_days (→ scheduled_days), ease_factor (→ difficulty),
//                       repetitions (→ reps), next_review (→ due), last_review,
//                       stability, lapses, state,
//                       created_at, updated_at
//
// DB columns keep their original names; FSRS field names live in-app only.
// Cards are deleted via ON DELETE CASCADE when the parent deck is deleted.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/client'

// ── App-level types (FSRS-5 fields) ──────────────────────────────────────────

export interface Card {
  id:             string
  front:          string
  back:           string
  due:            string        // ISO date YYYY-MM-DD  (← next_review)
  stability:      number        //                      (← stability)
  difficulty:     number        // FSRS difficulty 1–10 (← ease_factor)
  elapsed_days:   number        // always 0 on DB load; computed live by FSRS
  scheduled_days: number        // interval in days     (← interval_days)
  reps:           number        // review count         (← repetitions)
  lapses:         number        //                      (← lapses)
  learning_steps: number        // position in learning step sequence; not stored in DB
  state:          0 | 1 | 2 | 3 // New/Learning/Review/Relearning (← state)
  last_review:    string | null //                      (← last_review)
}

export interface Deck {
  id:         string
  name:       string
  moduleId:   string | null  // (← module_id)
  moduleName: string         // (← module_name)
  color:      string
  cards:      Card[]
  createdAt:  string         // (← created_at)
}

// ── DB row shapes (snake_case) ────────────────────────────────────────────────

interface DeckRow {
  id:          string
  user_id:     string
  name:        string
  module_id:   string | null
  module_name: string
  color:       string
  created_at:  string
  updated_at:  string
}

interface CardRow {
  id:            string
  deck_id:       string
  user_id:       string
  front:         string
  back:          string
  interval_days: number
  ease_factor:   number
  repetitions:   number
  next_review:   string
  last_review:   string | null
  stability:     number
  lapses:        number
  state:         number
  created_at:    string
  updated_at:    string
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function cardFromRow(row: CardRow): Card {
  return {
    id:             row.id,
    front:          row.front,
    back:           row.back,
    due:            row.next_review,
    stability:      row.stability      ?? Math.max(1, (row.interval_days ?? 0) * 0.5),
    difficulty:     row.ease_factor    ?? 5.0,
    elapsed_days:   0,
    scheduled_days: row.interval_days  ?? 0,
    reps:           row.repetitions    ?? 0,
    lapses:         row.lapses         ?? 0,
    learning_steps: 0,
    state:          (row.state ?? (row.repetitions === 0 ? 0 : 2)) as 0 | 1 | 2 | 3,
    last_review:    row.last_review    ?? null,
  }
}

function deckFromRow(row: DeckRow, cards: Card[]): Deck {
  return {
    id:         row.id,
    name:       row.name,
    moduleId:   row.module_id,
    moduleName: row.module_name,
    color:      row.color,
    cards,
    createdAt:  row.created_at,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. loadDecksFromDB
//    Loads every deck that belongs to the current user, plus all their cards.
//    Returns [] on any error so the UI can fall back to localStorage gracefully.
// ─────────────────────────────────────────────────────────────────────────────

export async function loadDecksFromDB(): Promise<Deck[]> {
  try {
    const supabase = createClient()

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return []

    const { data: deckRows, error: deckErr } = await supabase
      .from('flashcard_decks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (deckErr || !deckRows) {
      console.error('[flashcards] loadDecksFromDB deck fetch error:', deckErr)
      return []
    }

    if (deckRows.length === 0) return []

    const deckIds = deckRows.map((d: DeckRow) => d.id)

    const { data: cardRows, error: cardErr } = await supabase
      .from('flashcard_cards')
      .select('*')
      .in('deck_id', deckIds)
      .order('created_at', { ascending: true })

    if (cardErr) {
      console.error('[flashcards] loadDecksFromDB card fetch error:', cardErr)
      return []
    }

    const cardsByDeck = new Map<string, Card[]>()
    for (const row of (cardRows ?? []) as CardRow[]) {
      const list = cardsByDeck.get(row.deck_id) ?? []
      list.push(cardFromRow(row))
      cardsByDeck.set(row.deck_id, list)
    }

    return (deckRows as DeckRow[]).map(row =>
      deckFromRow(row, cardsByDeck.get(row.id) ?? [])
    )
  } catch (err) {
    console.error('[flashcards] loadDecksFromDB unexpected error:', err)
    return []
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. saveDeckToDB
//    Upserts the deck row, upserts all current card rows, then deletes any
//    cards that were removed from the deck (i.e. not in the new array).
// ─────────────────────────────────────────────────────────────────────────────

export async function saveDeckToDB(deck: Deck): Promise<void> {
  try {
    const supabase = createClient()

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      console.error('[flashcards] saveDeckToDB: no authenticated user')
      return
    }

    const now = new Date().toISOString()

    const { error: deckErr } = await supabase
      .from('flashcard_decks')
      .upsert(
        {
          id:          deck.id,
          user_id:     user.id,
          name:        deck.name,
          module_id:   deck.moduleId ?? null,
          module_name: deck.moduleName,
          color:       deck.color,
          created_at:  deck.createdAt,
          updated_at:  now,
        },
        { onConflict: 'id' }
      )

    if (deckErr) {
      console.error('[flashcards] saveDeckToDB deck upsert error:', deckErr)
      return
    }

    if (deck.cards.length > 0) {
      const cardUpserts = deck.cards.map(card => ({
        id:            card.id,
        deck_id:       deck.id,
        user_id:       user.id,
        front:         card.front,
        back:          card.back,
        interval_days: card.scheduled_days,
        ease_factor:   card.difficulty,
        repetitions:   card.reps,
        next_review:   card.due,
        last_review:   card.last_review ?? null,
        stability:     card.stability,
        lapses:        card.lapses,
        state:         card.state,
        updated_at:    now,
      }))

      const { error: cardsErr } = await supabase
        .from('flashcard_cards')
        .upsert(cardUpserts, { onConflict: 'id' })

      if (cardsErr) {
        console.error('[flashcards] saveDeckToDB card upsert error:', cardsErr)
        return
      }
    }

    const currentCardIds = deck.cards.map(c => c.id)

    if (currentCardIds.length > 0) {
      const { error: deleteErr } = await supabase
        .from('flashcard_cards')
        .delete()
        .eq('deck_id', deck.id)
        .eq('user_id', user.id)
        .not('id', 'in', `(${currentCardIds.map(id => `"${id}"`).join(',')})`)

      if (deleteErr) {
        console.error('[flashcards] saveDeckToDB card delete error:', deleteErr)
      }
    } else {
      const { error: deleteAllErr } = await supabase
        .from('flashcard_cards')
        .delete()
        .eq('deck_id', deck.id)
        .eq('user_id', user.id)

      if (deleteAllErr) {
        console.error('[flashcards] saveDeckToDB delete all cards error:', deleteAllErr)
      }
    }
  } catch (err) {
    console.error('[flashcards] saveDeckToDB unexpected error:', err)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. deleteDeckFromDB
//    Deletes the deck row. Cards are removed automatically via ON DELETE CASCADE
//    on the flashcard_cards.deck_id foreign key.
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteDeckFromDB(deckId: string): Promise<void> {
  try {
    const supabase = createClient()

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      console.error('[flashcards] deleteDeckFromDB: no authenticated user')
      return
    }

    const { error } = await supabase
      .from('flashcard_decks')
      .delete()
      .eq('id', deckId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[flashcards] deleteDeckFromDB error:', error)
    }
  } catch (err) {
    console.error('[flashcards] deleteDeckFromDB unexpected error:', err)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. updateCardInDB
//    Persists FSRS scheduling fields after a review session without a full
//    deck re-save.
// ─────────────────────────────────────────────────────────────────────────────

export async function updateCardInDB(card: Card, deckId: string): Promise<void> {
  try {
    const supabase = createClient()

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      console.error('[flashcards] updateCardInDB: no authenticated user')
      return
    }

    const { error } = await supabase
      .from('flashcard_cards')
      .update({
        interval_days: card.scheduled_days,
        ease_factor:   card.difficulty,
        repetitions:   card.reps,
        next_review:   card.due,
        last_review:   card.last_review ?? null,
        stability:     card.stability,
        lapses:        card.lapses,
        state:         card.state,
        updated_at:    new Date().toISOString(),
      })
      .eq('id', card.id)
      .eq('deck_id', deckId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[flashcards] updateCardInDB error:', error)
    }
  } catch (err) {
    console.error('[flashcards] updateCardInDB unexpected error:', err)
  }
}
