import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const VALID_STATUS = ['active', 'sold', 'deleted'] as const
type ListingStatus = typeof VALID_STATUS[number]

// PATCH /api/marketplace/[id] — update listing status (owner only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params
  if (!id || !UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid listing id' }, { status: 400 })
  }

  // Fetch listing to verify ownership
  const { data: listing, error: fetchError } = await supabase
    .from('marketplace_listings')
    .select('id, user_id, status')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) return NextResponse.json({ error: 'Database error' }, { status: 500 })
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  if (listing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const statusRaw = typeof body.status === 'string' ? body.status : ''
  if (!(VALID_STATUS as readonly string[]).includes(statusRaw)) {
    return NextResponse.json({ error: `status must be one of: ${VALID_STATUS.join(', ')}` }, { status: 400 })
  }
  const status = statusRaw as ListingStatus

  const { data, error } = await supabase
    .from('marketplace_listings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })

  return NextResponse.json({ data })
}
