'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Trophy, Heart, Target, Dices, TrendingUp,
  Calendar, ArrowRight, CreditCard, ChevronRight
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardSkeleton } from '@/components/ui/loading'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/types'

interface DashboardData {
  profile: {
    full_name: string
    charity_contribution_percent: number
    selected_charity_id: string | null
  }
  subscription: {
    plan: string
    status: string
    current_period_end: string | null
  } | null
  scores: Array<{ id: string; score: number; played_date: string }>
  charity: { name: string } | null
  totalWinnings: number
  pendingWinnings: number
}

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, subRes, scoresRes, winnersRes] = await Promise.all([
      supabase.from('profiles').select('full_name, charity_contribution_percent, selected_charity_id').eq('id', user.id).single(),
      supabase.from('subscriptions').select('plan, status, current_period_end').eq('user_id', user.id).single(),
      supabase.from('scores').select('id, score, played_date').eq('user_id', user.id).order('played_date', { ascending: false }).limit(5),
      supabase.from('winners').select('prize_amount_cents, payment_status').eq('user_id', user.id),
    ])

    let charity = null
    if (profileRes.data?.selected_charity_id) {
      const { data: c } = await supabase.from('charities').select('name').eq('id', profileRes.data.selected_charity_id).single()
      charity = c
    }

    const totalWinnings = winnersRes.data?.reduce((sum, w) => sum + w.prize_amount_cents, 0) || 0
    const pendingWinnings = winnersRes.data?.filter(w => w.payment_status === 'pending').reduce((sum, w) => sum + w.prize_amount_cents, 0) || 0

    setData({
      profile: profileRes.data || { full_name: '', charity_contribution_percent: 10, selected_charity_id: null },
      subscription: subRes.data,
      scores: scoresRes.data || [],
      charity,
      totalWinnings,
      pendingWinnings,
    })
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-shimmer h-8 w-48 rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (!data) return null

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-8">
      {/* Header */}
      <motion.div custom={0} variants={fadeUp}>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          {greeting}, {data.profile.full_name || 'Golfer'} 👋
        </h1>
        <p className="mt-1 text-gray-500">Welcome to your Golf Heroes dashboard</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Subscription */}
        <motion.div custom={1} variants={fadeUp} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Subscription</span>
            <CreditCard className="h-4 w-4 text-gray-600" />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={data.subscription?.status === 'active' ? 'success' : 'danger'} dot>
              {data.subscription?.status || 'Inactive'}
            </Badge>
            <span className="text-xs text-gray-600 capitalize">{data.subscription?.plan || 'None'}</span>
          </div>
          {data.subscription?.current_period_end && (
            <p className="text-xs text-gray-600">
              Renews {new Date(data.subscription.current_period_end).toLocaleDateString()}
            </p>
          )}
        </motion.div>

        {/* Scores */}
        <motion.div custom={2} variants={fadeUp} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Scores Entered</span>
            <Target className="h-4 w-4 text-gray-600" />
          </div>
          <p className="text-3xl font-bold text-white">{data.scores.length}<span className="text-lg text-gray-600">/5</span></p>
          {data.scores.length < 5 && (
            <Link href="/dashboard/scores" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              Enter scores <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </motion.div>

        {/* Charity */}
        <motion.div custom={3} variants={fadeUp} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">My Charity</span>
            <Heart className="h-4 w-4 text-gray-600" />
          </div>
          <p className="text-sm font-medium text-white truncate">{data.charity?.name || 'None selected'}</p>
          <p className="text-xs text-emerald-400">{data.profile.charity_contribution_percent}% contribution</p>
        </motion.div>

        {/* Winnings */}
        <motion.div custom={4} variants={fadeUp} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total Winnings</span>
            <Trophy className="h-4 w-4 text-gray-600" />
          </div>
          <p className="text-3xl font-bold gradient-text">{formatCurrency(data.totalWinnings)}</p>
          {data.pendingWinnings > 0 && (
            <p className="text-xs text-amber-400">{formatCurrency(data.pendingWinnings)} pending</p>
          )}
        </motion.div>
      </div>

      {/* Scores Preview */}
      <motion.div custom={5} variants={fadeUp} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">My Scores</h2>
          <Link href="/dashboard/scores">
            <Button variant="ghost" size="sm">View All <ArrowRight className="h-3.5 w-3.5" /></Button>
          </Link>
        </div>
        {data.scores.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-10 w-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">No scores entered yet. Enter your first 5 Stableford scores!</p>
            <Link href="/dashboard/scores">
              <Button size="sm">Enter Scores</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => {
              const score = data.scores[i]
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center rounded-xl border p-4 transition-all ${
                    score
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : 'border-white/[0.06] bg-white/[0.02] border-dashed'
                  }`}
                >
                  <span className={`text-2xl font-bold ${score ? 'text-white' : 'text-gray-700'}`}>
                    {score ? score.score : '—'}
                  </span>
                  <span className="text-[10px] text-gray-500 mt-1.5">
                    {score ? new Date(score.played_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Empty'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div custom={6} variants={fadeUp} className="grid gap-4 sm:grid-cols-3">
        <Link href="/dashboard/scores" className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-emerald-500/20 hover:bg-white/[0.04]">
          <Target className="h-8 w-8 text-emerald-500 mb-3" />
          <h3 className="text-sm font-semibold text-white">Enter Scores</h3>
          <p className="text-xs text-gray-500 mt-1">Log your latest Stableford round</p>
        </Link>
        <Link href="/dashboard/draws" className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-cyan-500/20 hover:bg-white/[0.04]">
          <Dices className="h-8 w-8 text-cyan-500 mb-3" />
          <h3 className="text-sm font-semibold text-white">View Draws</h3>
          <p className="text-xs text-gray-500 mt-1">Check results & upcoming draws</p>
        </Link>
        <Link href="/dashboard/charity" className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-amber-500/20 hover:bg-white/[0.04]">
          <Heart className="h-8 w-8 text-amber-500 mb-3" />
          <h3 className="text-sm font-semibold text-white">My Charity</h3>
          <p className="text-xs text-gray-500 mt-1">Update charity or contribution</p>
        </Link>
      </motion.div>
    </motion.div>
  )
}
