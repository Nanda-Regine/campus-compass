import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function makeSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

// POST /api/tutors/verify — upload student card, set is_verified_pending = true
export async function POST(req: NextRequest) {
  const supabase = makeSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('card') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const maxBytes = 5 * 1024 * 1024 // 5 MB
  if (file.size > maxBytes) return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 })

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP or PDF accepted' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const storagePath = `${user.id}/student-card.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('student-cards')
    .upload(storagePath, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { error: updateError } = await supabase
    .from('tutor_profiles')
    .update({ is_verified_pending: true, student_card_url: storagePath })
    .eq('user_id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
