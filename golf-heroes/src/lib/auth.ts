import { createClient } from '@/lib/supabase/server'
import type { UserWithSubscription } from '@/types'

/**
 * Get the currently authenticated user with their profile and subscription.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<UserWithSubscription | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  // Fetch subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, plan, status, current_period_end')
    .eq('user_id', user.id)
    .single()

  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    role: profile.role as 'subscriber' | 'admin',
    selected_charity_id: profile.selected_charity_id,
    charity_contribution_percent: profile.charity_contribution_percent,
    subscription: subscription
      ? {
          id: subscription.id,
          plan: subscription.plan as 'monthly' | 'yearly',
          status: subscription.status as 'active' | 'inactive' | 'cancelled' | 'lapsed',
          current_period_end: subscription.current_period_end,
        }
      : null,
  }
}

/**
 * Check if the current user has an active subscription.
 */
export async function hasActiveSubscription(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.subscription?.status === 'active'
}

/**
 * Check if the current user is an admin.
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'admin'
}
