import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getHomeRouteForRole } from '@/lib/redirects'

const SUBSCRIBER_ROUTES = ['/dashboard', '/scores', '/charity', '/draws', '/winners', '/profile']
const ADMIN_ROUTES = ['/admin']
const USER_AUTH_ROUTES = ['/auth/login', '/auth/signup']
const ADMIN_AUTH_ROUTE = '/auth/admin/login'

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAdminRoute = ADMIN_ROUTES.some((route) => path.startsWith(route))
  const isSubscriberRoute = SUBSCRIBER_ROUTES.some((route) => path.startsWith(route))
  const isUserAuthRoute = USER_AUTH_ROUTES.some((route) => path.startsWith(route))
  const isAdminAuthRoute = path.startsWith(ADMIN_AUTH_ROUTE)

  const needsAuth = isSubscriberRoute || isAdminRoute

  if (!user && needsAuth) {
    const authRoute = isAdminRoute ? ADMIN_AUTH_ROUTE : '/auth/login'
    return NextResponse.redirect(new URL(authRoute, request.url))
  }

  if (!user) {
    return supabaseResponse
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role
  const homeRoute = getHomeRouteForRole(role)

  if (isAdminRoute && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (isSubscriberRoute && role === 'admin') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  if (isUserAuthRoute || isAdminAuthRoute) {
    return NextResponse.redirect(new URL(homeRoute, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
