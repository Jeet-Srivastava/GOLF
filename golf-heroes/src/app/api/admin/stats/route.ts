import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/stats — Admin analytics (admin only)
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [usersRes, subsRes, drawsRes, winnersRes, donationsRes, scoresRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('id, price_cents, status'),
    supabase.from('draws').select('id, total_pool_cents, status'),
    supabase.from('winners').select('id, prize_amount_cents, payment_status, verification_status'),
    supabase.from('donations').select('amount_cents'),
    supabase.from('scores').select('id', { count: 'exact', head: true }),
  ])

  const activeSubscribers = subsRes.data?.filter(s => s.status === 'active').length || 0
  const totalRevenue = subsRes.data?.reduce((sum, s) => sum + (s.price_cents || 0), 0) || 0
  const totalPrizePool = drawsRes.data?.reduce((sum, d) => sum + (d.total_pool_cents || 0), 0) || 0
  const totalPrizesPaid = winnersRes.data?.filter(w => w.payment_status === 'paid').reduce((sum, w) => sum + w.prize_amount_cents, 0) || 0
  const totalDonations = donationsRes.data?.reduce((sum, d) => sum + d.amount_cents, 0) || 0
  const pendingVerifications = winnersRes.data?.filter(w => w.verification_status === 'pending').length || 0

  return NextResponse.json({
    totalUsers: usersRes.count || 0,
    activeSubscribers,
    totalRevenue,
    totalPrizePool,
    totalPrizesPaid,
    totalDonations,
    totalDraws: drawsRes.data?.length || 0,
    publishedDraws: drawsRes.data?.filter(d => d.status === 'published').length || 0,
    totalWinners: winnersRes.data?.length || 0,
    pendingVerifications,
    totalScores: scoresRes.count || 0,
  })
}
