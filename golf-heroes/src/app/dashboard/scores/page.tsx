'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Plus, Pencil, Trash2, Calendar, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'

interface Score {
  id: string
  score: number
  played_date: string
  created_at: string
}

export default function ScoresPage() {
  const { toast } = useToast()
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingScore, setEditingScore] = useState<Score | null>(null)
  const [formScore, setFormScore] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadScores()
  }, [])

  async function loadScores() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', user.id)
      .order('played_date', { ascending: false })
      .limit(5)

    setScores(data || [])
    setLoading(false)
  }

  function openAddModal() {
    setEditingScore(null)
    setFormScore('')
    setFormDate(new Date().toISOString().split('T')[0])
    setFormError('')
    setModalOpen(true)
  }

  function openEditModal(score: Score) {
    setEditingScore(score)
    setFormScore(String(score.score))
    setFormDate(score.played_date)
    setFormError('')
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    const scoreNum = parseInt(formScore)
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 45) {
      setFormError('Score must be between 1 and 45')
      return
    }
    if (!formDate) {
      setFormError('Date is required')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editingScore) {
      // Update existing
      const { error } = await supabase
        .from('scores')
        .update({ score: scoreNum, played_date: formDate })
        .eq('id', editingScore.id)

      if (error) {
        setFormError(error.message.includes('duplicate') ? 'A score already exists for this date' : error.message)
        setSaving(false)
        return
      }
      toast({ type: 'success', title: 'Score updated!' })
    } else {
      // Check if we already have 5 scores — if so, delete the oldest first
      if (scores.length >= 5) {
        const oldest = scores[scores.length - 1]
        await supabase.from('scores').delete().eq('id', oldest.id)
      }

      // Insert new
      const { error } = await supabase
        .from('scores')
        .insert({ user_id: user.id, score: scoreNum, played_date: formDate })

      if (error) {
        setFormError(error.message.includes('duplicate') ? 'A score already exists for this date. Edit it instead.' : error.message)
        setSaving(false)
        return
      }
      toast({ type: 'success', title: 'Score added!', description: scores.length >= 5 ? 'Oldest score was replaced.' : undefined })
    }

    setSaving(false)
    setModalOpen(false)
    loadScores()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this score?')) return

    const supabase = createClient()
    await supabase.from('scores').delete().eq('id', id)
    toast({ type: 'info', title: 'Score deleted' })
    loadScores()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Scores</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter your last 5 Stableford scores (1–45). These are your draw numbers.
          </p>
        </div>
        <Button onClick={openAddModal} size="sm">
          <Plus className="h-4 w-4" /> Add Score
        </Button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
        <AlertCircle className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-sm text-gray-400">
          <p>Only your <strong className="text-white">latest 5 scores</strong> are kept. Adding a 6th score removes the oldest.</p>
          <p className="mt-1">One score per date. Scores range from <strong className="text-white">1 to 45</strong> (Stableford).</p>
        </div>
      </div>

      {/* Score Grid */}
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => {
          const score = scores[i]
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`relative flex flex-col items-center rounded-2xl border p-6 transition-all ${
                score
                  ? 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40'
                  : 'border-dashed border-white/[0.1] bg-white/[0.02]'
              }`}
            >
              {score ? (
                <>
                  <span className="text-4xl font-bold text-white">{score.score}</span>
                  <span className="text-xs text-gray-500 mt-2">
                    {new Date(score.played_date).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: '2-digit'
                    })}
                  </span>
                  <div className="flex gap-1 mt-3">
                    <button
                      onClick={() => openEditModal(score)}
                      className="rounded-lg p-1.5 text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(score.id)}
                      className="rounded-lg p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04] mb-2">
                    <Target className="h-5 w-5 text-gray-600" />
                  </div>
                  <span className="text-xs text-gray-600">Score {i + 1}</span>
                  <button
                    onClick={openAddModal}
                    className="mt-2 text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    + Add
                  </button>
                </>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Score History List */}
      {scores.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-white">Score History</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {scores.map((score) => (
              <div key={score.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 font-bold">
                    {score.score}
                  </div>
                  <div>
                    <p className="text-sm text-white">Stableford Score</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(score.played_date).toLocaleDateString('en-GB', {
                        weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditModal(score)} className="rounded-lg p-2 text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(score.id)} className="rounded-lg p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingScore ? 'Edit Score' : 'Add Score'}
        description={editingScore ? 'Update your golf score' : 'Enter a Stableford score from 1 to 45'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Stableford Score"
            type="number"
            min={1}
            max={45}
            value={formScore}
            onChange={(e) => setFormScore(e.target.value)}
            placeholder="e.g. 36"
            icon={<Target className="h-4 w-4" />}
            required
          />
          <Input
            label="Date Played"
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            icon={<Calendar className="h-4 w-4" />}
            required
          />
          {formError && (
            <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">
              {formError}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} fullWidth>
              Cancel
            </Button>
            <Button type="submit" loading={saving} fullWidth>
              {editingScore ? 'Update' : 'Add'} Score
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
