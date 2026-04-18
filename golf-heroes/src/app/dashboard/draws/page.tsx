'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Dices, Calendar, Trophy, Clock, Hash } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/types'

interface Draw {
  id: string
  draw_date: string
  month: number
  year: number
  status: string
  winning_numbers: number[]
  total_pool_cents: number
  five_match_pool_cents: number
  four_match_pool_cents: number
  three_match_pool_cents: number
  jackpot_rollover_cents: number
}

interface DrawEntry {
  draw_id: string
  entered_numbers: number[]
  matches: number
}

export default function DrawsPage() {
  const [draws, setDraws] = useState<Draw[]>([])
  const [entries, setEntries] = useState<DrawEntry[]>([])
  const [myScores, setMyScores] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [drawsRes, entriesRes, scoresRes] = await Promise.all([
      supabase.from('draws').select('*').order('draw_date', { ascending: false }).limit(12),
      supabase.from('draw_entries').select('draw_id, entered_numbers, matches').eq('user_id', user.id),
      supabase.from('scores').select('score').eq('user_id', user.id).order('played_date', { ascending: false }).limit(5),
    ])

    setDraws(drawsRes.data || [])
    setEntries(entriesRes.data || [])
    setMyScores(scoresRes.data?.map(s => s.score) || [])
    setLoading(false)
  }

  const getEntry = (drawId: string) => entries.find(e => e.draw_id === drawId)

  const now = new Date()
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Draws</h1>
        <p className="mt-1 text-sm text-gray-500">Monthly prize draws — your scores are your numbers.</p>
      </div>

      {/* Current Draw Status */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 to-transparent p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500">
            <Dices className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} Draw
            </h2>
            <p className="text-sm text-gray-400">
              <Clock className="inline h-3.5 w-3.5 mr-1" />
              {daysLeft} days remaining
            </p>
          </div>
        </div>

        {/* My Numbers */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Your Numbers</p>
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`flex h-14 w-14 items-center justify-center rounded-xl border text-xl font-bold ${
                  myScores[i]
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-white'
                    : 'border-dashed border-white/[0.1] text-gray-700'
                }`}
              >
                {myScores[i] || '?'}
              </div>
            ))}
          </div>
          {myScores.length < 5 && (
            <p className="mt-2 text-xs text-amber-400">Enter {5 - myScores.length} more score{myScores.length < 4 ? 's' : ''} to complete your entry</p>
          )}
        </div>

        {/* Prize Pool Preview */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="rounded-xl bg-white/[0.04] p-3 text-center">
            <p className="text-xs text-gray-500">5 Match</p>
            <p className="text-lg font-bold text-amber-400">40%</p>
            <p className="text-[10px] text-gray-600">Jackpot</p>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-3 text-center">
            <p className="text-xs text-gray-500">4 Match</p>
            <p className="text-lg font-bold text-cyan-400">35%</p>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-3 text-center">
            <p className="text-xs text-gray-500">3 Match</p>
            <p className="text-lg font-bold text-emerald-400">25%</p>
          </div>
        </div>
      </div>

      {/* Past Draws */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Past Draws</h2>
        {draws.length === 0 && !loading ? (
          <div className="text-center py-12 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <Calendar className="h-10 w-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No draws yet. The first draw will happen at the end of the month!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {draws.map((draw, i) => {
              const entry = getEntry(draw.id)
              return (
                <motion.div
                  key={draw.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-white">
                        {new Date(draw.draw_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <Badge variant={draw.status === 'published' ? 'success' : draw.status === 'simulated' ? 'warning' : 'default'}>
                      {draw.status}
                    </Badge>
                  </div>

                  {draw.status === 'published' && draw.winning_numbers.length > 0 && (
                    <>
                      {/* Winning numbers */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1.5">Winning Numbers</p>
                        <div className="flex gap-2">
                          {draw.winning_numbers.map((n, j) => {
                            const isMatched = entry?.entered_numbers.includes(n)
                            return (
                              <div
                                key={j}
                                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
                                  isMatched
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                    : 'bg-white/[0.06] text-gray-400'
                                }`}
                              >
                                {n}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* My entry */}
                      {entry && (
                        <div className="flex items-center justify-between rounded-lg bg-white/[0.04] px-4 py-2">
                          <span className="text-xs text-gray-500">
                            Your numbers: {entry.entered_numbers.join(', ')}
                          </span>
                          <Badge variant={entry.matches >= 3 ? 'success' : 'default'}>
                            {entry.matches} match{entry.matches !== 1 ? 'es' : ''}
                          </Badge>
                        </div>
                      )}

                      {/* Pool distribution */}
                      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                        <div className="text-xs">
                          <span className="text-gray-500">5-Match</span>
                          <p className="font-semibold text-amber-400">{formatCurrency(draw.five_match_pool_cents)}</p>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-500">4-Match</span>
                          <p className="font-semibold text-cyan-400">{formatCurrency(draw.four_match_pool_cents)}</p>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-500">3-Match</span>
                          <p className="font-semibold text-emerald-400">{formatCurrency(draw.three_match_pool_cents)}</p>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
