export type { Database, Tables, InsertTables, UpdateTables } from './database'

export type UserRole = 'subscriber' | 'admin'
export type PaymentStatus = 'pending' | 'paid' | 'rejected'
export type DrawStatus = 'pending' | 'simulated' | 'published'
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'lapsed'
export type SubscriptionPlan = 'monthly' | 'yearly'
export type DrawMatchType = 'three_match' | 'four_match' | 'five_match'
export type DrawType = 'random' | 'algorithmic'
export type VerificationStatus = 'pending' | 'approved' | 'rejected'

/** Subscription pricing in pence */
export const PRICING = {
  monthly: { amount: 999, label: '£9.99/mo' },
  yearly:  { amount: 8999, label: '£89.99/yr', savings: '25%' },
} as const

/** Format pence → display string */
export function formatCurrency(cents: number): string {
  return `£${(cents / 100).toFixed(2)}`
}

/** Profile with joined subscription data */
export interface UserWithSubscription {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  selected_charity_id: string | null
  charity_contribution_percent: number
  subscription?: {
    id: string
    plan: SubscriptionPlan
    status: SubscriptionStatus
    current_period_end: string | null
  } | null
}

/** Score with computed display helpers */
export interface ScoreEntry {
  id: string
  score: number
  played_date: string
  created_at: string
}

/** Draw result with user match info */
export interface DrawResult {
  id: string
  draw_date: string
  month: number
  year: number
  status: DrawStatus
  winning_numbers: number[]
  total_pool_cents: number
  five_match_pool_cents: number
  four_match_pool_cents: number
  three_match_pool_cents: number
  jackpot_rollover_cents: number
  userEntry?: {
    entered_numbers: number[]
    matches: number
  }
}

/** Winner record for display */
export interface WinnerRecord {
  id: string
  draw_id: string
  user_id: string
  match_type: DrawMatchType
  matched_numbers: number[]
  prize_amount_cents: number
  payment_status: PaymentStatus
  verification_status: VerificationStatus
  proof_image_url: string | null
  draw?: {
    draw_date: string
    month: number
    year: number
  }
  profile?: {
    full_name: string
    email: string
  }
}

/** Admin dashboard statistics */
export interface AdminStats {
  totalUsers: number
  activeSubscribers: number
  totalPrizePoolCents: number
  totalCharityContributionCents: number
  currentMonthEntries: number
  pendingVerifications: number
}
