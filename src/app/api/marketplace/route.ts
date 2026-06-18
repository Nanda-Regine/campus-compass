import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const VALID_CATEGORIES = ['textbooks', 'electronics', 'clothing', 'furniture', 'food', 'transport', 'other'] as const
type Category = typeof VALID_CATEGORIES[number]

const VALID_CONDITIONS = ['new', 'like_new', 'good', 'fair'] as const
type Condition = typeof VALID_CONDITIONS[number]

// GET /api/marketplace
// Returns active listings for the authenticated user's university.
// Optional query params: ?category= and ?search=
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('university')
    .eq('id', user.id)
    .maybeSingle()

  const university = profile?.university ?? ''

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') ?? ''
  const search = searchParams.get('search') ?? ''

  let query = supabase
    .from('marketplace_listings')
    .select('*')
    .eq('university', university)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(40)

  if (category && (VALID_CATEGORIES as readonly string[]).includes(category)) {
    query = query.eq('category', category as Category)
  }

  if (search.trim()) {
    query = query.ilike('title', `%${search.trim()}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })

  return NextResponse.json({ data })
}

// POST /api/marketplace — create a new listing
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as Record<string, unknown>

  // Extract and validate each field individually
  const titleRaw = typeof body.title === 'string' ? body.title.trim() : ''
  if (titleRaw.length < 3 || titleRaw.length > 120) {
    return NextResponse.json({ error: 'title must be 3–120 characters' }, { status: 400 })
  }

  const descriptionRaw = typeof body.description === 'string' ? body.description.trim().slice(0, 1000) : null
  const description = descriptionRaw && descriptionRaw.length > 0 ? descriptionRaw : null

  const isFree = body.is_free === true

  let price_rands: number | null = null
  if (!isFree) {
    if (body.price_rands !== null && body.price_rands !== undefined) {
      const p = Number(body.price_rands)
      if (!Number.isFinite(p) || p < 0) {
        return NextResponse.json({ error: 'price_rands must be a non-negative number' }, { status: 400 })
      }
      price_rands = p
    }
  }

  const categoryRaw = typeof body.category === 'string' ? body.category : ''
  if (!(VALID_CATEGORIES as readonly string[]).includes(categoryRaw)) {
    return NextResponse.json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 })
  }
  const category = categoryRaw as Category

  const conditionRaw = typeof body.condition === 'string' ? body.condition : null
  const condition: Condition | null = conditionRaw && (VALID_CONDITIONS as readonly string[]).includes(conditionRaw)
    ? conditionRaw as Condition
    : null

  const pickupRaw = typeof body.pickup_location === 'string' ? body.pickup_location.trim() : null
  const pickup_location = pickupRaw && pickupRaw.length <= 200 ? pickupRaw : null

  const waRaw = typeof body.contact_whatsapp === 'string' ? body.contact_whatsapp.trim() : null
  const contact_whatsapp = waRaw && waRaw.length <= 20 ? waRaw : null

  // Fetch the user's university
  const { data: profile } = await supabase
    .from('profiles')
    .select('university')
    .eq('id', user.id)
    .maybeSingle()

  const university = profile?.university ?? ''

  const { data, error } = await supabase
    .from('marketplace_listings')
    .insert({
      user_id: user.id,
      university,
      title: titleRaw,
      description: description ?? null,
      price_rands,
      is_free: isFree,
      category,
      condition,
      pickup_location,
      contact_whatsapp,
      image_urls: [],
      status: 'active',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
