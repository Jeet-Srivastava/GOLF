'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Dices, Play, Eye, Zap, Calendar, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/types'
import { generateRandomNumbers, generateAlgorithmicNumbers, countMatches, getMatchType, calculatePrizePool, calculateWinnerPrize } from '@/lib/draw-engine'

interface Draw {
  id: string
  draw_date: string
  month: number
  year: number
  status: string
  draw_type: string
  winning_numbers: number[]
  total_pool_cents: number
  five_match_pool_cents: number
  four_match_pool_cents: number
  three_match_pool_cents: number
  jackpot_rollover_cents: number
}

export default function AdminDrawsPage() {
  const { toast } = useToast()
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [simResult, setSimResult] = useState<{ numbers: number[]; drawType: string } | null>(null)
  const [showSimModal, setShowSimModal] = useState(false)
  const [drawType, setDrawType] = useState<'random' | 'algorithmic'>('random')

  useEffect(() => { loadDraws() }, [])

  async function loadDraws() {
    const supabase = createClient()
    const { data } = await supabase
      .from('draws')
      .select('*')
      .order('draw_date', { ascending: false })

    setDraws(data || [])
    setLoading(false)
  }

  async function runSimulation() {
    const supabase = createClient()

    // Get all scores for algorithmic mode
    let numbers: number[]
    if (drawType === 'algorithmic') {
      const { data: allScores } = await supabase.from('scores').select('score')
      numbers = generateAlgorithmicNumbers(allScores?.map(s => s.score) || [])
    } else {
      numbers = generateRandomNumbers()
    }

    setSimResult({ numbers, drawType })
    setShowSimModal(true)
  }

  async function runDraw() {
    setRunning(true)
    const supabase = createClient()

    try {
      // Generate winning numbers
      let winningNumbers: number[]
      if (drawType === 'algorithmic') {
        const { data: allScores } = await supabase.from('scores').select('score')
        winningNumbers = generateAlgorithmicNumbers(allScores?.map(s => s.score) || [])
      } else {
        winningNumbers = generateRandomNumbers()
      }

      // Calculate prize pool
      const { count: activeCount } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')

      // Get previous jackpot rollover
      const lastDraw = draws.find(d => d.status === 'published' && d.jackpot_rollover_cents > 0)
      const rollover = lastDraw?.jackpot_rollover_cents || 0

      const pool = calculatePrizePool(activeCount || 0, 999, rollover)

      const now = new Date()
      const drawDate = new Date(now.getFullYear(), now.getMonth() + 1, 0) // last day of month

      // Create draw record
      const { data: draw, error: drawError } = await supabase
        .from('draws')
        .insert({
          draw_date: drawDate.toISOString().split('T')[0],
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          status: 'simulated',
          draw_type: drawType,
          winning_numbers: winningNumbers,
          total_pool_cents: pool.totalPoolCents,
          five_match_pool_cents: pool.fiveMatchPoolCents,
          four_match_pool_cents: pool.fourMatchPoolCents,
          three_match_pool_cents: pool.threeMatchPoolCents,
          jackpot_rollover_cents: 0,
        })
        .select()
        .single()

      if (drawError) {
        toast({ type: 'error', title: 'Error', description: drawError.message })
        setRunning(false)
        return
      }

      // Process all users' entries
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id')

      if (allUsers) {
        for (const user of allUsers) {
          const { data: userScores } = await supabase
            .from('scores')
            .select('score')
            .eq('user_id', user.id)
            .order('played_date', { ascending: false })
            .limit(5)

          if (userScores && userScores.length > 0) {
            const enteredNumbers = userScores.map(s => s.score).sort((a, b) => a - b)
            const { count, matched } = countMatches(enteredNumbers, winningNumbers)
            const matchType = getMatchType(count)

            // Create draw entry
            await supabase.from('draw_entries').insert({
              draw_id: draw.id,
              user_id: user.id,
              entered_numbers: enteredNumbers,
              matches: count,
            })

            // Create winner record if matched 3+
            if (matchType) {
              const poolKey = matchType === 'five_match' ? 'fiveMatchPoolCents' :
                             matchType === 'four_match' ? 'fourMatchPoolCents' : 'threeMatchPoolCents'

              await supabase.from('winners').insert({
                draw_id: draw.id,
                user_id: user.id,
                match_type: matchType,
                matched_numbers: matched,
                prize_amount_cents: pool[poolKey], // Will be split later on publish
              })
            }
          }
        }
      }

      toast({ type: 'success', title: 'Draw simulated!', description: 'Review results and publish when ready.' })
      loadDraws()
    } catch (e) {
      toast({ type: 'error', title: 'Draw failed', description: 'An unexpected error occurred.' })
    }

    setRunning(false)
  }

  async function publishDraw(drawId: string) {
    const supabase = createClient()
    await supabase
      .from('draws')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', drawId)

    toast({ type: 'success', title: 'Draw published!', description: 'Results are now visible to all users.' })
    loadDraws()
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Draw Management</h1>
          <p className="mt-1 text-sm text-gray-500">Configure, simulate, and publish monthly draws.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">New Draw</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Draw Type</label>
            <div className="flex gap-3">
              {(['random', 'algorithmic'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setDrawType(type)}
                  className={`flex-1 rounded-xl border p-4 text-left transition-all ${
                    drawType === type
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]'
                  }`}
                >
                  <p className="text-sm font-medium text-white capitalize">{type}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {type === 'random' ? 'Standard lottery-style random numbers' : 'Weighted by most/least frequent scores'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={runSimulation} size="lg">
              <Eye className="h-4 w-4" /> Simulate
            </Button>
            <Button onClick={runDraw} loading={running} size="lg">
              <Play className="h-4 w-4" /> Run Draw
            </Button>
          </div>
        </div>
      </div>

      {/* Draws List */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">All Draws</h2>
        <div className="space-y-3">
          {draws.map((draw, i) => (
            <motion.div
              key={draw.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-white">
                    {new Date(draw.draw_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                  </span>
                  <Badge variant={draw.draw_type === 'random' ? 'info' : 'primary'}>
                    {draw.draw_type}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={draw.status === 'published' ? 'success' : draw.status === 'simulated' ? 'warning' : 'default'}>
                    {draw.status}
                  </Badge>
                  {draw.status === 'simulated' && (
                    <Button size="sm" onClick={() => publishDraw(draw.id)}>
                      Publish
                    </Button>
                  )}
                </div>
              </div>

              {draw.winning_numbers.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {draw.winning_numbers.map((n, j) => (
                    <div key={j} className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-sm font-bold text-white">
                      {n}
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-4 gap-3 text-center text-xs">
                <div className="rounded-lg bg-white/[0.04] p-2">
                  <p className="text-gray-500">Total Pool</p>
                  <p className="font-semibold text-white">{formatCurrency(draw.total_pool_cents)}</p>
                </div>
                <div className="rounded-lg bg-white/[0.04] p-2">
                  <p className="text-gray-500">5-Match</p>
                  <p className="font-semibold text-amber-400">{formatCurrency(draw.five_match_pool_cents)}</p>
                </div>
                <div className="rounded-lg bg-white/[0.04] p-2">
                  <p className="text-gray-500">4-Match</p>
                  <p className="font-semibold text-cyan-400">{formatCurrency(draw.four_match_pool_cents)}</p>
                </div>
                <div className="rounded-lg bg-white/[0.04] p-2">
                  <p className="text-gray-500">3-Match</p>
                  <p className="font-semibold text-emerald-400">{formatCurrency(draw.three_match_pool_cents)}</p>
                </div>
              </div>
            </motion.div>
          ))}
          {draws.length === 0 && !loading && (
            <div className="text-center py-12 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <Dices className="h-10 w-10 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No draws yet. Run your first draw above!</p>
            </div>
          )}
        </div>
      </div>

      {/* Simulation Modal */}
      <Modal
        open={showSimModal}
        onOpenChange={setShowSimModal}
        title="Simulation Result"
        description="Preview — these numbers are not saved"
      >
        {simResult && (
          <div className="space-y-4">
            <div className="flex gap-2 justify-center">
              {simResult.numbers.map((n, i) => (
                <div key={i} className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-xl font-bold text-white shadow-lg">
                  {n}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 text-center">
              Type: <span className="capitalize text-white">{simResult.drawType}</span>
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => { setShowSimModal(false); runSimulation() }} fullWidth>
                <RefreshCw className="h-4 w-4" /> Re-simulate
              </Button>
              <Button onClick={() => setShowSimModal(false)} fullWidth>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
