import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getHomeRouteForRole } from '@/lib/redirects'

/**
 * Auth callback handler for Supabase email confirmation.
 * Exchanges the auth code for a session and redirects to dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const destination = next ?? getHomeRouteForRole(profile?.role)
        return NextResponse.redirect(new URL(destination, origin))
      }
    }
  }

  // Redirect to login on error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
}
