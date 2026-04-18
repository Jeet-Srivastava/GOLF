'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, CheckCircle, XCircle, DollarSign, Eye, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/types'

interface Winner {
  id: string
  draw_id: string
  user_id: string
  match_type: string
  matched_numbers: number[]
  prize_amount_cents: number
  payment_status: string
  verification_status: string
  proof_image_url: string | null
  admin_notes: string | null
  created_at: string
  profiles: { full_name: string; email: string } | null
  draws: { draw_date: string; month: number; year: number } | null
}

export default function AdminWinnersPage() {
  const { toast } = useToast()
  const [winners, setWinners] = useState<Winner[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWinner, setSelectedWinner] = useState<Winner | null>(null)
  const [showProofModal, setShowProofModal] = useState(false)

  useEffect(() => { loadWinners() }, [])

  async function loadWinners() {
    const supabase = createClient()
    const { data } = await supabase
      .from('winners')
      .select('*, profiles(full_name, email), draws(draw_date, month, year)')
      .order('created_at', { ascending: false })

    setWinners(data || [])
    setLoading(false)
  }

  async function updateVerification(winnerId: string, status: 'approved' | 'rejected') {
    const supabase = createClient()
    await supabase
      .from('winners')
      .update({ verification_status: status })
      .eq('id', winnerId)

    toast({ type: 'success', title: `Winner ${status}` })
    loadWinners()
  }

  async function markPaid(winnerId: string) {
    const supabase = createClient()
    await supabase
      .from('winners')
      .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', winnerId)

    toast({ type: 'success', title: 'Marked as paid' })
    loadWinners()
  }

  const matchLabel = (t: string) =>
    t === 'five_match' ? '5 Numbers' :
    t === 'four_match' ? '4 Numbers' : '3 Numbers'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Winner Management</h1>
        <p className="mt-1 text-sm text-gray-500">Verify submissions and manage payouts.</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
          <p className="text-sm text-gray-500">Total Winners</p>
          <p className="text-3xl font-bold text-white">{winners.length}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
          <p className="text-sm text-gray-500">Pending Verification</p>
          <p className="text-3xl font-bold text-amber-400">
            {winners.filter(w => w.verification_status === 'pending').length}
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
          <p className="text-sm text-gray-500">Pending Payout</p>
          <p className="text-3xl font-bold text-cyan-400">
            {formatCurrency(
              winners
                .filter(w => w.payment_status === 'pending' && w.verification_status === 'approved')
                .reduce((sum, w) => sum + w.prize_amount_cents, 0)
            )}
          </p>
        </div>
      </div>

      {/* Winners Table */}
      <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase">Winner</th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase">Draw</th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase">Match</th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase">Prize</th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase">Verification</th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3.5 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {winners.map((winner) => (
                <tr key={winner.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{winner.profiles?.full_name || '—'}</p>
                    <p className="text-xs text-gray-500">{winner.profiles?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {winner.draws ? new Date(winner.draws.draw_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={winner.match_type === 'five_match' ? 'warning' : 'info'}>
                      {matchLabel(winner.match_type)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-semibold text-white">
                    {formatCurrency(winner.prize_amount_cents)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={
                      winner.verification_status === 'approved' ? 'success' :
                      winner.verification_status === 'rejected' ? 'danger' : 'warning'
                    } dot>
                      {winner.verification_status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={winner.payment_status === 'paid' ? 'success' : 'default'}>
                      {winner.payment_status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {winner.proof_image_url && (
                        <button
                          onClick={() => { setSelectedWinner(winner); setShowProofModal(true) }}
                          className="rounded-lg p-2 text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                          title="View proof"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      {winner.verification_status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateVerification(winner.id, 'approved')}
                            className="rounded-lg p-2 text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => updateVerification(winner.id, 'rejected')}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {winner.verification_status === 'approved' && winner.payment_status === 'pending' && (
                        <Button size="sm" onClick={() => markPaid(winner.id)}>
                          <DollarSign className="h-3.5 w-3.5" /> Pay
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {winners.length === 0 && !loading && (
        <div className="text-center py-16 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <Trophy className="h-10 w-10 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No winners yet.</p>
        </div>
      )}

      {/* Proof Modal */}
      <Modal
        open={showProofModal}
        onOpenChange={setShowProofModal}
        title="Score Proof"
        description={selectedWinner?.profiles?.full_name || ''}
      >
        {selectedWinner?.proof_image_url && (
          <div className="space-y-4">
            <img
              src={selectedWinner.proof_image_url}
              alt="Score proof"
              className="w-full rounded-xl border border-white/[0.08]"
            />
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => { updateVerification(selectedWinner.id, 'rejected'); setShowProofModal(false) }}
                fullWidth
              >
                <XCircle className="h-4 w-4" /> Reject
              </Button>
              <Button
                onClick={() => { updateVerification(selectedWinner.id, 'approved'); setShowProofModal(false) }}
                fullWidth
              >
                <CheckCircle className="h-4 w-4" /> Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
