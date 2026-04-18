/**
 * Golf Heroes — Database Types
 * Mirrors the Supabase schema defined in supabase/schema.sql
 */

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          role: 'subscriber' | 'admin'
          selected_charity_id: string | null
          charity_contribution_percent: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string
          avatar_url?: string | null
          role?: 'subscriber' | 'admin'
          selected_charity_id?: string | null
          charity_contribution_percent?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          role?: 'subscriber' | 'admin'
          selected_charity_id?: string | null
          charity_contribution_percent?: number
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: 'monthly' | 'yearly'
          status: 'active' | 'inactive' | 'cancelled' | 'lapsed'
          price_cents: number
          current_period_start: string | null
          current_period_end: string | null
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan?: 'monthly' | 'yearly'
          status?: 'active' | 'inactive' | 'cancelled' | 'lapsed'
          price_cents?: number
          current_period_start?: string | null
          current_period_end?: string | null
          cancelled_at?: string | null
        }
        Update: {
          plan?: 'monthly' | 'yearly'
          status?: 'active' | 'inactive' | 'cancelled' | 'lapsed'
          price_cents?: number
          current_period_start?: string | null
          current_period_end?: string | null
          cancelled_at?: string | null
        }
      }
      charities: {
        Row: {
          id: string
          name: string
          slug: string
          description: string
          short_description: string
          image_url: string | null
          website_url: string | null
          upcoming_events: string | null
          is_featured: boolean
          total_received_cents: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string
          short_description?: string
          image_url?: string | null
          website_url?: string | null
          upcoming_events?: string | null
          is_featured?: boolean
        }
        Update: {
          name?: string
          slug?: string
          description?: string
          short_description?: string
          image_url?: string | null
          website_url?: string | null
          upcoming_events?: string | null
          is_featured?: boolean
          total_received_cents?: number
        }
      }
      scores: {
        Row: {
          id: string
          user_id: string
          score: number
          played_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          score: number
          played_date: string
        }
        Update: {
          score?: number
          played_date?: string
        }
      }
      draws: {
        Row: {
          id: string
          draw_date: string
          month: number
          year: number
          status: 'pending' | 'simulated' | 'published'
          draw_type: 'random' | 'algorithmic'
          winning_numbers: number[]
          total_pool_cents: number
          five_match_pool_cents: number
          four_match_pool_cents: number
          three_match_pool_cents: number
          jackpot_rollover_cents: number
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          draw_date: string
          month: number
          year: number
          status?: 'pending' | 'simulated' | 'published'
          draw_type?: 'random' | 'algorithmic'
          winning_numbers?: number[]
          total_pool_cents?: number
          five_match_pool_cents?: number
          four_match_pool_cents?: number
          three_match_pool_cents?: number
          jackpot_rollover_cents?: number
          published_at?: string | null
        }
        Update: {
          status?: 'pending' | 'simulated' | 'published'
          draw_type?: 'random' | 'algorithmic'
          winning_numbers?: number[]
          total_pool_cents?: number
          five_match_pool_cents?: number
          four_match_pool_cents?: number
          three_match_pool_cents?: number
          jackpot_rollover_cents?: number
          published_at?: string | null
        }
      }
      draw_entries: {
        Row: {
          id: string
          draw_id: string
          user_id: string
          entered_numbers: number[]
          matches: number
          created_at: string
        }
        Insert: {
          id?: string
          draw_id: string
          user_id: string
          entered_numbers: number[]
          matches?: number
        }
        Update: {
          entered_numbers?: number[]
          matches?: number
        }
      }
      winners: {
        Row: {
          id: string
          draw_id: string
          user_id: string
          match_type: 'three_match' | 'four_match' | 'five_match'
          matched_numbers: number[]
          prize_amount_cents: number
          payment_status: 'pending' | 'paid' | 'rejected'
          verification_status: 'pending' | 'approved' | 'rejected'
          proof_image_url: string | null
          admin_notes: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          draw_id: string
          user_id: string
          match_type: 'three_match' | 'four_match' | 'five_match'
          matched_numbers: number[]
          prize_amount_cents?: number
          payment_status?: 'pending' | 'paid' | 'rejected'
          verification_status?: 'pending' | 'approved' | 'rejected'
          proof_image_url?: string | null
          admin_notes?: string | null
        }
        Update: {
          prize_amount_cents?: number
          payment_status?: 'pending' | 'paid' | 'rejected'
          verification_status?: 'pending' | 'approved' | 'rejected'
          proof_image_url?: string | null
          admin_notes?: string | null
          paid_at?: string | null
        }
      }
      donations: {
        Row: {
          id: string
          user_id: string
          charity_id: string
          amount_cents: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          charity_id: string
          amount_cents: number
        }
        Update: {
          amount_cents?: number
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: 'subscriber' | 'admin'
      subscription_status: 'active' | 'inactive' | 'cancelled' | 'lapsed'
      subscription_plan: 'monthly' | 'yearly'
      draw_status: 'pending' | 'simulated' | 'published'
      draw_type: 'random' | 'algorithmic'
      match_type: 'three_match' | 'four_match' | 'five_match'
      payment_status: 'pending' | 'paid' | 'rejected'
      verification_status: 'pending' | 'approved' | 'rejected'
    }
  }
}

// Convenience type aliases
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
