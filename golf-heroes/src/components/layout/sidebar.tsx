'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Target, Dices, Heart, Trophy, User,
  Settings, Users, Gift, BarChart3, Shield, ChevronLeft,
  ChevronRight, CreditCard
} from 'lucide-react'
import { useState } from 'react'

interface SidebarLink {
  href: string
  label: string
  icon: React.ElementType
}

const subscriberLinks: SidebarLink[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/scores', label: 'My Scores', icon: Target },
  { href: '/dashboard/draws', label: 'Draws', icon: Dices },
  { href: '/dashboard/charity', label: 'My Charity', icon: Heart },
  { href: '/dashboard/winnings', label: 'Winnings', icon: Trophy },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
]

const adminLinks: SidebarLink[] = [
  { href: '/admin', label: 'Overview', icon: BarChart3 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/draws', label: 'Draws', icon: Dices },
  { href: '/admin/charities', label: 'Charities', icon: Heart },
  { href: '/admin/winners', label: 'Winners', icon: Gift },
]

export function Sidebar({ variant = 'user' }: { variant?: 'user' | 'admin' }) {
  const pathname = usePathname()
  const links = variant === 'admin' ? adminLinks : subscriberLinks
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={clsx(
        'sticky top-16 hidden h-[calc(100vh-4rem)] flex-col border-r border-white/[0.06] bg-gray-950/50 transition-all duration-300 lg:flex',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-3">
        {!collapsed && (
          <span className="flex items-center gap-2 text-sm font-medium text-gray-400">
            {variant === 'admin' ? (
              <><Shield className="h-4 w-4 text-amber-400" /> Admin</>
            ) : (
              <><LayoutDashboard className="h-4 w-4 text-emerald-400" /> Dashboard</>
            )}
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:text-white hover:bg-white/5"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Links */}
      <nav className="flex-1 space-y-0.5 px-2 py-3 overflow-y-auto">
        {links.map((link) => {
          const isActive =
            link.href === '/dashboard' || link.href === '/admin'
              ? pathname === link.href
              : pathname.startsWith(link.href)

          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              className={clsx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 shadow-sm'
                  : 'text-gray-500 hover:text-white hover:bg-white/[0.04]'
              )}
            >
              <link.icon className={clsx('h-[18px] w-[18px] shrink-0', isActive && 'text-emerald-400')} />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {variant === 'user' && !collapsed && (
        <div className="border-t border-white/[0.06] px-3 py-3">
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </Link>
        </div>
      )}
    </aside>
  )
}
