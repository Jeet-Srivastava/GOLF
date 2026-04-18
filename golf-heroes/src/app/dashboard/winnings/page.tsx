'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Upload, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/types'

interface Winner {
  id: string
  draw_id: string
  match_type: string
  matched_numbers: number[]
  prize_amount_cents: number
  payment_status: string
  verification_status: string
  proof_image_url: string | null
  created_at: string
  draws: { draw_date: string; month: number; year: number } | null
}

export default function WinningsPage() {
  const { toast } = useToast()
  const [winnings, setWinnings] = useState<Winner[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)

  useEffect(() => {
    loadWinnings()
  }, [])

  async function loadWinnings() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('winners')
      .select('*, draws(draw_date, month, year)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setWinnings(data || [])
    setLoading(false)
  }

  async function handleProofUpload(winnerId: string, file: File) {
    setUploading(winnerId)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const ext = file.name.split('.').pop()
    const path = `${user.id}/${winnerId}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('winner-proofs')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      toast({ type: 'error', title: 'Upload failed', description: uploadError.message })
      setUploading(null)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('winner-proofs')
      .getPublicUrl(path)

    await supabase
      .from('winners')
      .update({ proof_image_url: publicUrl, verification_status: 'pending' })
      .eq('id', winnerId)

    toast({ type: 'success', title: 'Proof uploaded!', description: 'Admin will review your submission.' })
    setUploading(null)
    loadWinnings()
  }

  const totalWon = winnings.reduce((sum, w) => sum + w.prize_amount_cents, 0)
  const totalPaid = winnings.filter(w => w.payment_status === 'paid').reduce((sum, w) => sum + w.prize_amount_cents, 0)
  const totalPending = totalWon - totalPaid

  const matchTypeLabel = (t: string) => {
    if (t === 'five_match') return '5 Numbers'
    if (t === 'four_match') return '4 Numbers'
    return '3 Numbers'
  }

  const verificationBadge = (status: string) => {
    if (status === 'approved') return <Badge variant="success" dot>Verified</Badge>
    if (status === 'rejected') return <Badge variant="danger" dot>Rejected</Badge>
    return <Badge variant="warning" dot>Pending Review</Badge>
  }

  const paymentBadge = (status: string) => {
    if (status === 'paid') return <Badge variant="success">Paid</Badge>
    if (status === 'rejected') return <Badge variant="danger">Rejected</Badge>
    return <Badge variant="warning">Pending</Badge>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Winnings</h1>
        <p className="mt-1 text-sm text-gray-500">Track your prizes and upload verification proof.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
          <p className="text-sm text-gray-500 mb-1">Total Won</p>
          <p className="text-3xl font-bold gradient-text">{formatCurrency(totalWon)}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
          <p className="text-sm text-gray-500 mb-1">Paid Out</p>
          <p className="text-3xl font-bold text-emerald-400">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
          <p className="text-sm text-gray-500 mb-1">Pending</p>
          <p className="text-3xl font-bold text-amber-400">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {/* Winners List */}
      {winnings.length === 0 && !loading ? (
        <div className="text-center py-16 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <Trophy className="h-12 w-12 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Winnings Yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Keep entering your scores and participating in draws. Your lucky draw is coming!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {winnings.map((win, i) => (
            <motion.div
              key={win.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                    <Trophy className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">{matchTypeLabel(win.match_type)}</p>
                    <p className="text-xs text-gray-500">
                      {win.draws ? new Date(win.draws.draw_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'Unknown draw'}
                    </p>
                  </div>
                </div>
                <p className="text-xl font-bold gradient-text">{formatCurrency(win.prize_amount_cents)}</p>
              </div>

              {/* Matched Numbers */}
              <div className="flex gap-2 mb-4">
                {win.matched_numbers.map((n, j) => (
                  <div key={j} className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-sm font-bold text-emerald-400">
                    {n}
                  </div>
                ))}
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 mb-4">
                {verificationBadge(win.verification_status)}
                {paymentBadge(win.payment_status)}
              </div>

              {/* Proof Upload */}
              {win.verification_status !== 'approved' && (
                <div className="mt-4 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02] p-4">
                  <p className="text-sm font-medium text-white mb-2">Upload Score Proof</p>
                  <p className="text-xs text-gray-500 mb-3">
                    Upload a screenshot of your scores from the golf platform to verify your win.
                  </p>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleProofUpload(win.id, file)
                      }}
                      disabled={uploading === win.id}
                    />
                    <Button variant="secondary" size="sm" loading={uploading === win.id} className="pointer-events-none">
                      <Upload className="h-4 w-4" />
                      {win.proof_image_url ? 'Re-upload Proof' : 'Upload Proof'}
                    </Button>
                  </label>
                  {win.proof_image_url && (
                    <p className="mt-2 text-xs text-emerald-400">✓ Proof uploaded — awaiting review</p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
