'use client'

import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type GuideSection = 'starter' | 'skills' | 'spices' | 'benefits' | 'airfryer'

interface StarterItem { name: string; qty: string; cost: number; cat: string; catColor: string }
interface CookingSkill { title: string; emoji: string; steps: string[]; tip: string }
interface SpiceEntry   { name: string; emoji: string; flavour: string; pairsWidth: string; saUse: string }
interface FoodBenefit  { food: string; emoji: string; nutrients: string; benefit: string; study: string }
interface AirfryerRecipe {
  name: string; emoji: string; time: string; temp: string
  cost: string; ingredients: string[]; steps: string[]; tip: string
}

// ── Data ──────────────────────────────────────────────────────────────────────

const STARTER_KIT: StarterItem[] = [
  // Protein
  { name: 'Eggs ×12',         qty: '1 box',  cost: 35, cat: 'Protein',  catColor: '#FB7185' },
  { name: 'Tinned tuna ×2',   qty: '2 cans', cost: 30, cat: 'Protein',  catColor: '#FB7185' },
  { name: 'Peanut butter',    qty: '400g',   cost: 28, cat: 'Protein',  catColor: '#FB7185' },
  { name: 'Red lentils',      qty: '500g',   cost: 16, cat: 'Protein',  catColor: '#FB7185' },
  // Carbs
  { name: 'Bread (brown)',    qty: '700g',   cost: 20, cat: 'Carbs',    catColor: '#f59e0b' },
  { name: 'Rice',             qty: '1kg',    cost: 18, cat: 'Carbs',    catColor: '#f59e0b' },
  { name: 'Oats',             qty: '500g',   cost: 22, cat: 'Carbs',    catColor: '#f59e0b' },
  { name: 'Maize meal (pap)', qty: '1kg',    cost: 14, cat: 'Carbs',    catColor: '#f59e0b' },
  { name: 'Pasta',            qty: '500g',   cost: 12, cat: 'Carbs',    catColor: '#f59e0b' },
  // Veg & Fruit
  { name: 'Onions ×4',        qty: '~500g',  cost: 10, cat: 'Veg',      catColor: '#4ecf9e' },
  { name: 'Tomatoes ×4',      qty: 'medium', cost: 14, cat: 'Veg',      catColor: '#4ecf9e' },
  { name: 'Spinach',          qty: '1 bunch',cost:  9, cat: 'Veg',      catColor: '#4ecf9e' },
  { name: 'Bananas ×5',       qty: '~500g',  cost: 12, cat: 'Veg',      catColor: '#4ecf9e' },
  { name: 'Tinned chakalaka', qty: '×2',     cost: 18, cat: 'Veg',      catColor: '#4ecf9e' },
  { name: 'Frozen mixed veg', qty: '500g',   cost: 25, cat: 'Veg',      catColor: '#4ecf9e' },
  // Dairy
  { name: 'Milk',             qty: '1L',     cost: 22, cat: 'Dairy',    catColor: '#38BDF8' },
  { name: 'Amasi',            qty: '500ml',  cost: 15, cat: 'Dairy',    catColor: '#38BDF8' },
  // Pantry
  { name: 'Sunflower oil',    qty: '750ml',  cost: 38, cat: 'Pantry',   catColor: '#818CF8' },
  { name: 'Salt',             qty: '500g',   cost:  6, cat: 'Pantry',   catColor: '#818CF8' },
  { name: 'Tinned tomatoes ×2',qty: '2 cans',cost: 16, cat: 'Pantry',  catColor: '#818CF8' },
  { name: 'Chicken stock cubes',qty: '1 box',cost:  9, cat: 'Pantry',  catColor: '#818CF8' },
  { name: 'Curry powder',     qty: '50g',    cost:  9, cat: 'Pantry',   catColor: '#818CF8' },
  { name: 'Soy sauce',        qty: '200ml',  cost: 16, cat: 'Pantry',   catColor: '#818CF8' },
]

const COOKING_SKILLS: CookingSkill[] = [
  {
    title: 'How to boil eggs', emoji: '🥚',
    steps: [
      'Fill a pot with enough water to cover the eggs.',
      'Bring to a full boil over high heat.',
      'Gently lower eggs into water using a spoon.',
      'Soft: 6 min. Medium: 8 min. Hard: 10 min.',
      'Transfer immediately to cold water to stop cooking.',
    ],
    tip: 'Cold eggs directly from the fridge may crack — let them sit out for 5 minutes first.',
  },
  {
    title: 'Perfect rice every time', emoji: '🍚',
    steps: [
      'Rinse rice under cold water until water runs clear.',
      'Use a 1:2 ratio — 1 cup rice to 2 cups water.',
      'Bring to boil, then reduce to lowest heat.',
      'Cover with a lid and cook for 12 minutes. DON\'T LIFT THE LID.',
      'Remove from heat. Rest 5 minutes, then fluff with a fork.',
    ],
    tip: 'The biggest mistake is stirring rice while it cooks — this releases starch and makes it sticky.',
  },
  {
    title: 'Smooth lump-free pap', emoji: '🌽',
    steps: [
      'For soft pap: 3 cups water. Stiff pap: 2.5 cups water.',
      'Bring salted water to a full boil.',
      'Reduce heat to medium-low FIRST, then add maize meal.',
      'Stir continuously in a circular motion for 2 minutes.',
      'Cover, cook 10 min on low, stirring every 3 min.',
    ],
    tip: 'Add the maize meal to SIMMERING water, not boiling — adding to a full boil causes instant lumps.',
  },
  {
    title: 'Frying an egg', emoji: '🍳',
    steps: [
      'Heat pan over medium heat (not high — eggs burn easily).',
      'Add a small drizzle of oil or a tiny piece of butter.',
      'Crack egg on the flat edge of the pan, open away from you.',
      'For sunny-side-up: cook until white is set (~3 min), don\'t flip.',
      'For over-easy: flip once after white sets, cook 30 seconds.',
    ],
    tip: 'If your egg whites are rubbery, the pan was too hot. Medium heat is key.',
  },
  {
    title: 'Cutting an onion (no tears)', emoji: '🧅',
    steps: [
      'Use a sharp knife — dull blades crush the onion and release MORE chemicals.',
      'Cut off the top, leave the root end on (it holds it together).',
      'Cut in half through the root. Peel the skin back.',
      'Make horizontal then vertical cuts, then slice down.',
      'Refrigerate the onion for 30 min before cutting to reduce tears.',
    ],
    tip: 'Light a candle nearby — the flame absorbs the sulphur compounds that make you cry.',
  },
  {
    title: 'Seasoning food properly', emoji: '🧂',
    steps: [
      'Always season in layers — add salt at each stage, not just at the end.',
      'Taste before adding more salt — you can\'t take it out once it\'s in.',
      'Start with less than you think you need.',
      'Pepper goes in after cooking (it can turn bitter when overheated).',
      'A squeeze of lemon or a dash of vinegar can "fix" bland food without salt.',
    ],
    tip: 'Most homemade food tastes bland because it\'s underseasoned, not because the recipe is bad.',
  },
  {
    title: 'Basic pasta cooking', emoji: '🍝',
    steps: [
      'Use a BIG pot with lots of water — pasta needs room to move.',
      'Add a generous amount of salt when water boils (should taste like the sea).',
      'Add pasta, stir immediately and again after 2 minutes.',
      'Cook 1–2 minutes LESS than the packet says (it finishes cooking in the sauce).',
      'SAVE a cup of pasta water before draining — it thickens sauces.',
    ],
    tip: 'Never add oil to pasta water — it coats the pasta and stops sauce from sticking.',
  },
  {
    title: 'Sunday meal prep', emoji: '📦',
    steps: [
      'Pick 2 proteins (e.g., boiled eggs + cooked lentils).',
      'Cook a big batch of rice or pap.',
      'Chop raw veg and store in containers.',
      'Make one sauce or soup that can go with multiple meals.',
      'Portion into containers for Mon–Wed. Make fresh again Thu.',
    ],
    tip: 'Meal prep doesn\'t have to mean cooking 7 meals. Even just pre-washing veg saves 15 minutes each day.',
  },
]

const SPICES: SpiceEntry[] = [
  { name: 'Salt',        emoji: '🧂', flavour: 'Enhances all flavours',                pairsWidth: 'Everything',           saUse: 'The single most important ingredient. Use it.' },
  { name: 'Black pepper',emoji: '🫙', flavour: 'Mild heat, earthy depth',              pairsWidth: 'Eggs, meat, pasta',    saUse: 'Always paired with salt. Add AFTER cooking.' },
  { name: 'Cumin',       emoji: '🟤', flavour: 'Earthy, warm, slightly nutty',         pairsWidth: 'Lentils, beans, curry',saUse: 'Essential in SA Indian cooking and chakalaka.' },
  { name: 'Paprika',     emoji: '🔴', flavour: 'Mild, slightly sweet, adds red colour',pairsWidth: 'Chicken, potatoes, rice',saUse: 'Smoked paprika adds depth. Sweet paprika adds colour without heat.' },
  { name: 'Turmeric',    emoji: '🟡', flavour: 'Mild, slightly bitter, earthy yellow', pairsWidth: 'Rice, curry, eggs',    saUse: 'The anti-inflammatory spice. Turns everything golden. Don\'t use too much.' },
  { name: 'Coriander',   emoji: '🟢', flavour: 'Citrusy, warm, slightly floral',       pairsWidth: 'Curry, lentils, veg',  saUse: 'Pairs perfectly with cumin — use together. Ground, not the leaf.' },
  { name: 'Chilli flakes',emoji: '🌶️',flavour: 'Heat, on demand',                      pairsWidth: 'Pasta, stir-fry, eggs',saUse: 'Add at the end for heat, or cook in oil first for deeper flavour.' },
  { name: 'Garlic powder',emoji: '🧄', flavour: 'Savoury, pungent, rich',              pairsWidth: 'Almost everything',    saUse: 'Use when you don\'t have fresh garlic or need quick flavour.' },
  { name: 'Curry powder', emoji: '🍛', flavour: 'Complex, warm, aromatic blend',       pairsWidth: 'Chicken, lentils, eggs',saUse: 'SA Cape Malay curry powder is a full spice blend in one. The student\'s shortcut.' },
  { name: 'Mixed herbs',  emoji: '🌿', flavour: 'Herby, green, Mediterranean',         pairsWidth: 'Pasta, tomato dishes', saUse: 'Italian seasoning or mixed herbs = instant pasta upgrade.' },
  { name: 'Cinnamon',     emoji: '🟫', flavour: 'Sweet, warm, woody',                  pairsWidth: 'Oats, sweet potato, curry',saUse: 'Used in Malay cooking WITH savoury food. Also great in oats and rooibos.' },
  { name: 'Braai spice',  emoji: '🔥', flavour: 'Smoky, herby, aromatic all-in-one',  pairsWidth: 'Meat, veggies, eggs',  saUse: 'Distinctly South African. Works on almost anything that goes on the braai or airfryer.' },
]

const FOOD_BENEFITS: FoodBenefit[] = [
  { food: 'Eggs',          emoji: '🥚', nutrients: 'Complete protein, B12, choline, vitamin D', benefit: 'Build muscle, support brain function, prevent fatigue', study: 'Choline in eggs is essential for memory formation and focus. One egg = a real study boost.' },
  { food: 'Spinach/Morogo',emoji: '🥬', nutrients: 'Iron, calcium, folate, vitamin K',          benefit: 'Prevent anaemia, strengthen bones, support cell division', study: 'Iron deficiency is the #1 cause of fatigue in female students. Spinach combats this directly.' },
  { food: 'Bananas',       emoji: '🍌', nutrients: 'Potassium, B6, tryptophan, magnesium',       benefit: 'Quick energy, regulate mood, improve sleep quality', study: 'B6 and tryptophan convert to serotonin. A banana before bed genuinely improves sleep.' },
  { food: 'Oats',          emoji: '🌾', nutrients: 'Beta-glucan fibre, B vitamins, manganese',   benefit: 'Sustained energy release, lower cholesterol, gut health', study: 'Slow-release carbs prevent the 10am energy crash. Better than sugar-laden cereals by far.' },
  { food: 'Peanut butter', emoji: '🥜', nutrients: 'Protein, healthy fats, vitamin E, magnesium',benefit: 'Sustained energy, heart health, muscle support', study: 'Fat slows digestion — keeps you fuller longer than toast alone. Add to oats for best results.' },
  { food: 'Lentils/Beans', emoji: '🫘', nutrients: 'Plant protein, iron, fibre, folate',         benefit: 'Gut health, prevent anaemia, sustained energy', study: 'Cheapest protein source per rand. Folate is critical during high-stress academic periods.' },
  { food: 'Amasi',         emoji: '🥛', nutrients: 'Probiotics, calcium, protein, B12',          benefit: 'Gut microbiome, bone strength, immune support', study: 'A healthy gut improves mood and cognitive function via the gut-brain axis. Amasi does this cheaply.' },
  { food: 'Sweet potato',  emoji: '🍠', nutrients: 'Beta-carotene, vitamin C, potassium, fibre', benefit: 'Eye health, immune support, slow-release energy, skin', study: 'Beta-carotene converts to vitamin A. Critical for eye health during late-night study sessions.' },
  { food: 'Tinned tuna',   emoji: '🐟', nutrients: 'Omega-3, complete protein, selenium, B12',  benefit: 'Brain function, anti-inflammation, heart health', study: 'DHA (a type of Omega-3) is literally what your brain is made of. Eat tuna before big exams.' },
  { food: 'Ginger',        emoji: '🫚', nutrients: 'Gingerols, magnesium, vitamin B6',           benefit: 'Anti-inflammatory, reduces nausea and period pain, digestion', study: 'Clinically shown to reduce dysmenorrhea (period pain) when taken regularly. Make ginger tea.' },
  { food: 'Rooibos tea',   emoji: '🫖', nutrients: 'Antioxidants (aspalathin), calcium, iron',  benefit: 'Anti-oxidant, calming, no caffeine, improves sleep', study: 'SA\'s superpower drink. Naturally caffeine-free — ideal for evening wind-down before sleep.' },
  { food: 'Dark chocolate', emoji: '🍫', nutrients: 'Magnesium, iron, flavonoids, theobromine',  benefit: 'Mood boost, reduce PMS, focus, cardiovascular health', study: 'Magnesium in dark chocolate reduces PMS cramps. Theobromine gives gentle focus without crash.' },
]

const AIRFRYER_RECIPES: AirfryerRecipe[] = [
  {
    name: 'Crispy Chicken Wings', emoji: '🍗',
    time: '25 min', temp: '200°C', cost: 'R35/2 servings',
    ingredients: ['500g chicken wings (~R30)', 'Braai spice or paprika (R1)', 'Salt, pepper', 'A drizzle of oil'],
    steps: [
      'Pat chicken wings DRY with paper towel — moisture is the enemy of crispiness.',
      'Toss in braai spice, salt, and a tiny drizzle of oil.',
      'Arrange in ONE LAYER in the airfryer basket.',
      'Cook at 200°C for 12 min, flip, cook another 10–13 min until golden.',
      'Rest for 2 minutes before eating.',
    ],
    tip: 'Dry wings = crispy skin. This is the secret. Pat them dry even if they look dry already.',
  },
  {
    name: 'Sweet Potato Fries', emoji: '🍠',
    time: '22 min', temp: '190°C', cost: 'R15/2 servings',
    ingredients: ['1 large sweet potato (R8)', 'Oil (2 tsp)', 'Salt, paprika, garlic powder'],
    steps: [
      'Peel and cut sweet potato into even sticks (about 1cm thick).',
      'Soak in cold water for 10 min (removes starch = crispier fries).',
      'Pat completely dry. Toss with oil and seasoning.',
      'Cook at 190°C for 10 min, shake basket, cook 8–10 more min.',
      'They crisp up as they cool — don\'t eat straight from the basket.',
    ],
    tip: 'Don\'t overcrowd! Cook in 2 batches if needed. Crowded fries = steamed, not crispy.',
  },
  {
    name: 'Egg & Cheese Toast Cup', emoji: '🍳',
    time: '12 min', temp: '175°C', cost: 'R10/serving',
    ingredients: ['2 slices bread (R2)', '2 eggs (R8)', 'Salt, pepper', 'Optional: grated cheese, chilli'],
    steps: [
      'Press bread slices into an oven-safe muffin-tin shape, or fold to fit airfryer basket.',
      'Crack one egg into each bread "cup".',
      'Season with salt and pepper.',
      'Cook at 175°C for 10–12 min until egg white is set.',
      'Optional: add grated cheese in the last 2 minutes.',
    ],
    tip: 'Check at 10 min — different airfryers vary. You want a set white but runny yolk.',
  },
  {
    name: 'Boerewors in the Airfryer', emoji: '🌭',
    time: '18 min', temp: '180°C', cost: 'R30/serving',
    ingredients: ['250g boerewors coil (R28)', 'No oil needed'],
    steps: [
      'Coil the boerewors in the basket as is — no cutting needed.',
      'Cook at 180°C for 9 min.',
      'Flip or move the coil, cook another 7–9 min until browned.',
      'Internal temperature should reach 70°C.',
      'Serve with pap, chakalaka, or in a roll.',
    ],
    tip: 'The airfryer renders out the fat naturally — you get the braai flavour without the braai.',
  },
  {
    name: 'Chakalaka Toastie', emoji: '🫙',
    time: '8 min', temp: '180°C', cost: 'R12/serving',
    ingredients: ['2 slices bread (R2)', '3 tbsp chakalaka (R3)', 'Grated cheese (optional, R4)', 'Butter (thin spread)'],
    steps: [
      'Spread butter thinly on the OUTSIDE of both bread slices.',
      'Fill with chakalaka (and cheese if using).',
      'Press together and place in airfryer.',
      'Cook at 180°C for 4 min, flip, cook 3–4 more min.',
      'Rest 1 min before cutting — filling is very hot.',
    ],
    tip: 'Buttered outside is essential for the golden crunch. No butter = pale, sad toastie.',
  },
  {
    name: 'Crispy Butternut Chips', emoji: '🟧',
    time: '28 min', temp: '185°C', cost: 'R18/2 servings',
    ingredients: ['½ butternut (R10)', 'Oil (2 tsp)', 'Cinnamon + salt, OR braai spice'],
    steps: [
      'Peel butternut and slice into thin chips (3–4mm).',
      'Toss in oil and seasoning — cinnamon for sweet, braai spice for savoury.',
      'Cook at 185°C for 12 min, shake, cook 12–14 more min until crispy.',
      'Watch carefully in the last 5 min — they can go from perfect to burnt quickly.',
      'Serve immediately for maximum crunch.',
    ],
    tip: 'Thinner slices = crispier result. Use a vegetable peeler for the thinnest chips.',
  },
]

// ── Section constants ─────────────────────────────────────────────────────────

const SECTIONS: { id: GuideSection; emoji: string; label: string; desc: string; color: string }[] = [
  { id: 'starter',  emoji: '🛒', label: 'Starter Kit',   desc: 'First-time grocery list',    color: '#4ecf9e' },
  { id: 'skills',   emoji: '👨‍🍳', label: 'Skills 101',   desc: 'Basic cooking techniques',   color: '#f59e0b' },
  { id: 'airfryer', emoji: '💨', label: 'Airfryer',      desc: '6 zero-skill airfryer meals', color: '#fb923c' },
  { id: 'spices',   emoji: '🫙', label: 'Spices',        desc: 'What each spice does',        color: '#a78bfa' },
  { id: 'benefits', emoji: '💚', label: 'Food Science',  desc: 'What foods do for your body', color: '#34d399' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function KitchenGuide() {
  const [section, setSection]       = useState<GuideSection>('starter')
  const [expandedSkill, setExpSkill]= useState<number | null>(null)
  const [expandedAF, setExpandedAF] = useState<number | null>(null)
  const [expandedBen, setExpandedBen] = useState<number | null>(null)
  const [showAllItems, setShowAllItems] = useState(false)

  const starterTotal = STARTER_KIT.reduce((s, i) => s + i.cost, 0)
  const cats = Array.from(new Set(STARTER_KIT.map(i => i.cat)))

  return (
    <div style={{ padding: '12px 0 60px' }}>

      {/* Section nav */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 20, scrollbarWidth: 'none' }}>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            style={{
              flexShrink: 0, padding: '10px 16px', borderRadius: 14,
              border: section === s.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
              background: section === s.id ? s.color : 'rgba(255,255,255,0.04)',
              color: section === s.id ? '#000' : 'rgba(255,255,255,0.55)',
              fontFamily: 'Sora,sans-serif', fontWeight: section === s.id ? 700 : 500, fontSize: 12.5,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>{s.emoji}</span> {s.label}
          </button>
        ))}
      </div>

      {/* ── Starter Kit ── */}
      {section === 'starter' && (
        <div>
          <div style={{
            background: 'linear-gradient(135deg, rgba(78,207,158,0.1) 0%, rgba(0,0,0,0) 70%)',
            border: '1px solid rgba(78,207,158,0.2)', borderRadius: 16, padding: '18px 20px', marginBottom: 20,
          }}>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#4ecf9e', letterSpacing: '0.14em', marginBottom: 6 }}>
              FIRST-TIMER GROCERY KIT
            </div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', marginBottom: 6 }}>
              Week 1 Starter Basket
            </div>
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 14, lineHeight: 1.6 }}>
              These {STARTER_KIT.length} items will feed you for a week, cover breakfast + lunch + dinner, and work in
              dozens of recipe combinations — even if you've never cooked before.
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'baseline', gap: 6,
              background: 'rgba(78,207,158,0.12)', border: '1px solid rgba(78,207,158,0.25)',
              borderRadius: 20, padding: '6px 14px',
            }}>
              <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 900, fontSize: 18, color: '#4ecf9e' }}>~R{starterTotal}</span>
              <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(78,207,158,0.6)' }}>total for the week</span>
            </div>
          </div>

          {cats.map(cat => {
            const catItems = STARTER_KIT.filter(i => i.cat === cat)
            const catColor = catItems[0].catColor
            return (
              <div key={cat} style={{ marginBottom: 18 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                  fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: catColor,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: catColor }} />
                  {cat} · R{catItems.reduce((s, i) => s + i.cost, 0)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {catItems.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div>
                        <div style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: 13.5, color: 'var(--text-secondary)' }}>{item.name}</div>
                        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{item.qty}</div>
                      </div>
                      <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, color: catColor }}>R{item.cost}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          <div style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '14px 16px',
            border: '1px dashed rgba(255,255,255,0.1)', marginTop: 8,
          }}>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
              💡 MONEY TIPS
            </div>
            {[
              'Buy store brand (Pick n Pay, Shoprite own brand) — same quality, 20–40% cheaper.',
              'Visit the reduced section at Shoprite/Checkers in the late afternoon for markdown deals.',
              'Dry goods (rice, lentils, oats, maize meal) are always cheaper per kg in larger sizes.',
              'Frozen veg is JUST as nutritious as fresh — and won\'t go off before you use it.',
            ].map((tip, i) => (
              <div key={i} style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 4 }}>
                • {tip}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Cooking Skills 101 ── */}
      {section === 'skills' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', marginBottom: 6 }}>Cooking Skills 101</div>
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              8 essential techniques that cover 90% of what you'll ever need to cook as a student.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {COOKING_SKILLS.map((skill, idx) => {
              const open = expandedSkill === idx
              return (
                <div
                  key={idx}
                  style={{
                    background: open ? 'rgba(245,158,11,0.07)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${open ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 14, overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => setExpSkill(open ? null : idx)}
                    style={{
                      width: '100%', padding: '14px 16px', background: 'transparent', border: 'none',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 20 }}>{skill.emoji}</span>
                      <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text-secondary)' }}>{skill.title}</span>
                    </div>
                    <span style={{ color: open ? '#f59e0b' : 'rgba(255,255,255,0.3)', fontSize: 12, flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
                  </button>
                  {open && (
                    <div style={{ padding: '0 16px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                        {skill.steps.map((step, si) => (
                          <div key={si} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <div style={{
                              flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                              background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#f59e0b',
                            }}>{si + 1}</div>
                            <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, paddingTop: 2 }}>{step}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{
                        padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                        fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#f59e0b', lineHeight: 1.65,
                      }}>
                        💡 {skill.tip}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Airfryer Recipes ── */}
      {section === 'airfryer' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', marginBottom: 6 }}>Airfryer Meals</div>
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              No oil, no fuss, no watching the stove. These 6 recipes are designed for students with an airfryer and zero patience.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {['Tip: always preheat 3 min', 'Never overlap food', 'Shake basket halfway'].map((t, i) => (
                <div key={i} style={{
                  padding: '5px 10px', borderRadius: 20,
                  background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)',
                  fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#fb923c',
                }}>{t}</div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {AIRFRYER_RECIPES.map((r, idx) => {
              const open = expandedAF === idx
              return (
                <div key={idx} style={{
                  background: open ? 'rgba(251,146,60,0.06)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${open ? 'rgba(251,146,60,0.25)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 16, overflow: 'hidden',
                }}>
                  <button
                    onClick={() => setExpandedAF(open ? null : idx)}
                    style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 26 }}>{r.emoji}</span>
                        <div>
                          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text-secondary)', marginBottom: 3 }}>{r.name}</div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {[{ l: '⏱️', v: r.time }, { l: '🌡️', v: r.temp }, { l: '💰', v: r.cost }].map(item => (
                              <span key={item.l} style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>
                                {item.l} {item.v}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <span style={{ color: open ? '#fb923c' : 'rgba(255,255,255,0.3)', fontSize: 12, flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
                    </div>
                  </button>
                  {open && (
                    <div style={{ padding: '0 16px 16px' }}>
                      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 6, letterSpacing: '0.12em' }}>INGREDIENTS</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                        {r.ingredients.map((ing, i) => (
                          <div key={i} style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <span style={{ color: '#fb923c', flexShrink: 0 }}>·</span> {ing}
                          </div>
                        ))}
                      </div>
                      <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 6, letterSpacing: '0.12em' }}>STEPS</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                        {r.steps.map((step, si) => (
                          <div key={si} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <div style={{
                              flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                              background: 'rgba(251,146,60,0.15)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#fb923c',
                            }}>{si + 1}</div>
                            <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, paddingTop: 2 }}>{step}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{
                        padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)',
                        fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#fb923c', lineHeight: 1.65,
                      }}>
                        🔑 {r.tip}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Spices Index ── */}
      {section === 'spices' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', marginBottom: 6 }}>Spices Index</div>
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              These 12 spices cover everything from a student kitchen. Start with salt, curry powder, and paprika.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SPICES.map((spice, i) => (
              <div key={i} style={{
                padding: '14px 16px', borderRadius: 14,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(167,139,250,0.12)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{spice.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>{spice.name}</div>
                    <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginBottom: 6, lineHeight: 1.5 }}>
                      <span style={{ color: '#a78bfa' }}>Flavour: </span>{spice.flavour}
                    </div>
                    <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginBottom: 6, lineHeight: 1.5 }}>
                      <span style={{ color: '#a78bfa' }}>Pairs with: </span>{spice.pairsWidth}
                    </div>
                    <div style={{
                      padding: '7px 10px', borderRadius: 8,
                      background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.15)',
                      fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(167,139,250,0.8)', lineHeight: 1.65,
                    }}>
                      🇿🇦 {spice.saUse}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Food Benefits ── */}
      {section === 'benefits' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', marginBottom: 6 }}>Food & Your Body</div>
            <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              What SA student staple foods actually do for your brain, body, and study performance.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FOOD_BENEFITS.map((f, idx) => {
              const open = expandedBen === idx
              return (
                <div key={idx} style={{
                  background: open ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${open ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 14, overflow: 'hidden',
                }}>
                  <button
                    onClick={() => setExpandedBen(open ? null : idx)}
                    style={{ width: '100%', padding: '13px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22 }}>{f.emoji}</span>
                        <div>
                          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text-secondary)' }}>{f.food}</div>
                          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8.5, color: 'rgba(52,211,153,0.6)', marginTop: 2 }}>{f.nutrients}</div>
                        </div>
                      </div>
                      <span style={{ color: open ? '#34d399' : 'rgba(255,255,255,0.3)', fontSize: 12, flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
                    </div>
                  </button>
                  {open && (
                    <div style={{ padding: '0 16px 16px' }}>
                      <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65, marginBottom: 10 }}>
                        <strong style={{ color: '#34d399' }}>Benefits:</strong> {f.benefit}
                      </div>
                      <div style={{
                        padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)',
                        fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#34d399', lineHeight: 1.7,
                      }}>
                        📚 Study angle: {f.study}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
