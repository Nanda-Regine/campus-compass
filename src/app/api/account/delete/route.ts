import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkRateLimitAsync } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POPIA-compliant account deletion — purges all personal data in dependency order
export async function DELETE() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit: 1 deletion attempt per hour per user
    const rateCheck = await checkRateLimitAsync(user.id, 'account_delete', 1, 60 * 60 * 1000)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const userId = user.id
    const service = createServiceRoleClient()

    // Track per-table purge failures. POPIA requires we do NOT report success
    // if any personal-data table failed to purge.
    const failedTables: string[] = []

    // Tables keyed by a plain user_id column — delete in dependency order
    // (children before parents).
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
      'group_members',
      'payment_logs',
      'subscriptions',
      'budgets',
      'streaks',
    ]

    for (const table of tables) {
      const { error } = await service.from(table).delete().eq('user_id', userId)
      if (error) {
        console.error(`[account/delete] Failed to purge ${table}:`, error)
        failedTables.push(table)
      }
    }

    // referrals has no user_id column — the user may be either party.
    {
      const { error } = await service
        .from('referrals')
        .delete()
        .or(`referrer_id.eq.${userId},referred_id.eq.${userId}`)
      if (error) {
        console.error('[account/delete] Failed to purge referrals:', error)
        failedTables.push('referrals')
      }
    }

    // group_tasks has no user_id column — delete rows the user created or was assigned.
    {
      const { error } = await service
        .from('group_tasks')
        .delete()
        .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
      if (error) {
        console.error('[account/delete] Failed to purge group_tasks:', error)
        failedTables.push('group_tasks')
      }
    }

    // Delete group assignments created by this user
    {
      const { error } = await service.from('group_assignments').delete().eq('created_by', userId)
      if (error) {
        console.error('[account/delete] Failed to purge group_assignments:', error)
        failedTables.push('group_assignments')
      }
    }

    // Delete the profile row
    {
      const { error } = await service.from('profiles').delete().eq('id', userId)
      if (error) {
        console.error('[account/delete] Failed to purge profiles:', error)
        failedTables.push('profiles')
      }
    }

    // If any personal-data table failed to purge, do NOT delete the auth user and
    // do NOT report success — POPIA compliance requires a complete purge.
    if (failedTables.length > 0) {
      return NextResponse.json(
        { error: 'Account deletion incomplete', failedTables },
        { status: 500 }
      )
    }

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
