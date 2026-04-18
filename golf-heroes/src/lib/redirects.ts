import type { UserRole } from '@/types'

export function getHomeRouteForRole(role?: UserRole | null): '/admin' | '/dashboard' {
  return role === 'admin' ? '/admin' : '/dashboard'
}
