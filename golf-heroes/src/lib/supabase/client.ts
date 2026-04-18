import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser-side Supabase client.
 * Uses untyped client for flexibility during development.
 * For production, generate types: supabase gen types typescript --linked > src/types/database.ts
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
