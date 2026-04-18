import Link from 'next/link'
import { Trophy, Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-gray-950/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">GolfHeroes</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              Play golf. Support charity. Win prizes.<br />
              Every round becomes something meaningful.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Platform</h4>
            <ul className="space-y-2">
              {[
                { href: '/how-it-works', label: 'How It Works' },
                { href: '/charities', label: 'Charities' },
                { href: '/auth/signup', label: 'Subscribe' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 transition-colors hover:text-emerald-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Legal</h4>
            <ul className="space-y-2">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((label) => (
                <li key={label}>
                  <span className="text-sm text-gray-500 cursor-default">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Impact */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Impact</h4>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <Heart className="h-4 w-4" />
                <span className="text-sm font-medium">Charity First</span>
              </div>
              <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                A minimum of 10% of every subscription goes to your chosen charity.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Golf Heroes. All rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            Built with <span className="text-emerald-500">♥</span> for charity
          </p>
        </div>
      </div>
    </footer>
  )
}
