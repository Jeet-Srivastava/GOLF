'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Trophy, Heart, Dices, TrendingUp, DollarSign, BarChart3, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/types'

interface Stats {
  totalUsers: number
  activeSubscribers: number
  totalPrizePoolCents: number
  totalCharityContributions: number
  totalDraws: number
  pendingVerifications: number
}

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeSubscribers: 0,
    totalPrizePoolCents: 0,
    totalCharityContributions: 0,
    totalDraws: 0,
    pendingVerifications: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const supabase = createClient()

    const [usersRes, subsRes, drawsRes, winnersRes, charityRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('id, price_cents', { count: 'exact' }).eq('status', 'active'),
      supabase.from('draws').select('id, total_pool_cents'),
      supabase.from('winners').select('id', { count: 'exact' }).eq('verification_status', 'pending'),
      supabase.from('donations').select('amount_cents'),
    ])

    const totalPool = drawsRes.data?.reduce((sum, d) => sum + (d.total_pool_cents || 0), 0) || 0
    const totalCharity = charityRes.data?.reduce((sum, d) => sum + d.amount_cents, 0) || 0

    setStats({
      totalUsers: usersRes.count || 0,
      activeSubscribers: subsRes.count || 0,
      totalPrizePoolCents: totalPool,
      totalCharityContributions: totalCharity,
      totalDraws: drawsRes.data?.length || 0,
      pendingVerifications: winnersRes.count || 0,
    })
    setLoading(false)
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
    { label: 'Active Subscribers', value: stats.activeSubscribers, icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Prize Pool', value: formatCurrency(stats.totalPrizePoolCents), icon: Trophy, color: 'text-amber-400' },
    { label: 'Charity Total', value: formatCurrency(stats.totalCharityContributions), icon: Heart, color: 'text-red-400' },
    { label: 'Total Draws', value: stats.totalDraws, icon: Dices, color: 'text-cyan-400' },
    { label: 'Pending Verifications', value: stats.pendingVerifications, icon: Clock, color: 'text-orange-400' },
  ]

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
        <p className="mt-1 text-sm text-gray-500">Platform statistics and management.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={fadeUp}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: '/admin/users', label: 'Manage Users', desc: 'View and edit user profiles', icon: Users, color: 'from-blue-500 to-indigo-500' },
          { href: '/admin/draws', label: 'Manage Draws', desc: 'Configure and run draws', icon: Dices, color: 'from-emerald-500 to-cyan-500' },
          { href: '/admin/charities', label: 'Manage Charities', desc: 'Add and edit charities', icon: Heart, color: 'from-red-500 to-pink-500' },
          { href: '/admin/winners', label: 'Manage Winners', desc: 'Verify and pay winners', icon: Trophy, color: 'from-amber-500 to-orange-500' },
        ].map((item, i) => (
          <motion.a
            key={item.href}
            href={item.href}
            custom={i + 6}
            variants={fadeUp}
            className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
          >
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} mb-4`}>
              <item.icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-white">{item.label}</h3>
            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
          </motion.a>
        ))}
      </div>
    </motion.div>
  )
}
