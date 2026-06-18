import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET /api/marketplace/messages — fetch all messages where user is sender or recipient
export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('marketplace_messages')
    .select('*')
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })

  return NextResponse.json({ data })
}

// POST /api/marketplace/messages — send a message about a listing
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as Record<string, unknown>

  const listing_id   = typeof body.listing_id   === 'string' ? body.listing_id.trim()   : ''
  const recipient_id = typeof body.recipient_id === 'string' ? body.recipient_id.trim() : ''
  const messageBody  = typeof body.body         === 'string' ? body.body.trim().slice(0, 500) : ''

  if (!listing_id || !UUID_RE.test(listing_id)) {
    return NextResponse.json({ error: 'listing_id must be a valid UUID' }, { status: 400 })
  }
  if (!recipient_id || !UUID_RE.test(recipient_id)) {
    return NextResponse.json({ error: 'recipient_id must be a valid UUID' }, { status: 400 })
  }
  if (messageBody.length < 1 || messageBody.length > 500) {
    return NextResponse.json({ error: 'body must be 1–500 characters' }, { status: 400 })
  }
  if (recipient_id === user.id) {
    return NextResponse.json({ error: 'Cannot send a message to yourself' }, { status: 400 })
  }

  // Verify listing exists and is active
  const { data: listing, error: listingError } = await supabase
    .from('marketplace_listings')
    .select('id, status')
    .eq('id', listing_id)
    .maybeSingle()

  if (listingError) return NextResponse.json({ error: 'Database error' }, { status: 500 })
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  if (listing.status !== 'active') {
    return NextResponse.json({ error: 'Listing is no longer active' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('marketplace_messages')
    .insert({
      listing_id,
      sender_id: user.id,
      recipient_id,
      body: messageBody,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
