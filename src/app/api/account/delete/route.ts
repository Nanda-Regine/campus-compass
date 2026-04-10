import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

// POPIA-compliant account deletion — purges all personal data in dependency order
export async function DELETE() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit: 1 deletion attempt per hour per user
    const rateCheck = checkRateLimit(user.id, 'account_delete', 1, 60 * 60 * 1000)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const userId = user.id
    const service = createServiceRoleClient()

    // Delete in dependency order (children before parents)
    const tables = [
      'nova_messages',
      'nova_usage',
      'nova_insights',
      'nova_abuse_flags',
      'push_subscriptions',
      'study_sessions',
      'expenses',
      'tasks',
      'timetable_slots',
      'exams',
      'modules',
      'meal_plans',
      'grocery_items',
      'group_tasks',
      'group_members',
      'referrals',
      'payment_logs',
      'subscriptions',
      'budgets',
      'streaks',
    ]

    for (const table of tables) {
      await service.from(table).delete().eq('user_id', userId)
    }

    // Delete group assignments created by this user
    await service.from('group_assignments').delete().eq('created_by', userId)

    // Delete the profile row
    await service.from('profiles').delete().eq('id', userId)

    // Delete the auth user (permanent)
    const { error: authError } = await service.auth.admin.deleteUser(userId)
    if (authError) {
      console.error('Auth user deletion error:', authError)
      return NextResponse.json({ error: 'Failed to delete auth user' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ error: 'Account deletion failed' }, { status: 500 })
  }
}
