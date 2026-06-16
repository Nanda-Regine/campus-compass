export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      name?: string
      domain?: string
      contact_name?: string
      contact_email?: string
      city?: string
      student_count_est?: number
    }

    const { name, domain, contact_name, contact_email, city, student_count_est } = body

    if (!name || !domain || !contact_name || !contact_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Normalise domain: strip protocol/www, lowercase
    const cleanDomain = domain.toLowerCase()
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .trim()

    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(cleanDomain)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
    }

    const { error } = await supabase.from('institutions').insert({
      name:              name.trim(),
      domain:            cleanDomain,
      contact_name:      contact_name.trim(),
      contact_email:     contact_email.trim().toLowerCase(),
      city:              city?.trim() || null,
      student_count_est: student_count_est ?? null,
      status:            'pending',
    })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'An application for this domain already exists.' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ submitted: true })
  } catch (err) {
    console.error('[institutions/apply]', err)
    return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 })
  }
}
