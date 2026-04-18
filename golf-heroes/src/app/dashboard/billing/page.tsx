'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard, CheckCircle, XCircle, RotateCcw,
  Calendar, IndianRupee, ShieldCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import { PRICING, formatCurrency } from '@/types'
import { RazorpayCheckout, type RazorpaySuccessResponse } from '@/components/payment/RazorpayCheckout'
import { PLAN_PRICES_PAISE, paiseToCurrency } from '@/lib/razorpay'

interface Payment {
  id: string
  razorpay_order_id: string
  razorpay_payment_id: string | null
  amount_paise: number
  currency: string
  plan: string
  status: string
  error_reason: string | null
  created_at: string
}

interface Subscription {
  plan: string
  status: string
  current_period_end: string | null
  price_cents: number
}

export default function BillingPage() {
  const { toast } = useToast()
  const [payments, setPayments] = useState<Payment[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  // Razorpay renewal flow
  const [renewPlan, setRenewPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [orderData, setOrderData] = useState<{
    order_id: string; amount: number; currency: string
    prefill: { name: string; email: string }
  } | null>(null)
  const [creatingOrder, setCreatingOrder] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [paymentsRes, subRes] = await Promise.all([
      supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('plan, status, current_period_end, price_cents').eq('user_id', user.id).single(),
    ])

    setPayments(paymentsRes.data || [])
    setSubscription(subRes.data)
    setLoading(false)
  }

  async function handleCreateOrder() {
    setCreatingOrder(true)
    const res = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: renewPlan }),
    })
    const data = await res.json()
    setCreatingOrder(false)

    if (!res.ok) {
      toast({ type: 'error', title: 'Payment Error', description: data.error })
      return
    }
    setOrderData({ order_id: data.order_id, amount: data.amount, currency: data.currency, prefill: data.prefill })
  }

  async function handlePaymentSuccess(response: RazorpaySuccessResponse) {
    setVerifying(true)
    setOrderData(null)

    const res = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...response, plan: renewPlan }),
    })
    const data = await res.json()
    setVerifying(false)

    if (!res.ok || !data.success) {
      toast({ type: 'error', title: 'Verification Failed', description: data.error })
      return
    }

    toast({ type: 'success', title: 'Subscription Renewed!', description: `Your ${renewPlan} subscription is now active.` })
    loadData()
  }

  const statusBadge = (status: string) => {
    if (status === 'paid') return <Badge variant="success" dot>Paid</Badge>
    if (status === 'failed') return <Badge variant="danger" dot>Failed</Badge>
    return <Badge variant="warning" dot>Pending</Badge>
  }

  if (loading) return <div className="animate-shimmer h-96 rounded-2xl" />

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing & Payments</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your subscription and view payment history.</p>
      </div>

      {/* Current Subscription */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Current Subscription</h2>
          {subscription && (
            <Badge variant={subscription.status === 'active' ? 'success' : 'danger'} dot>
              {subscription.status}
            </Badge>
          )}
        </div>

        {subscription?.status === 'active' ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white/[0.04] p-4">
              <p className="text-xs text-gray-500 mb-1">Plan</p>
              <p className="text-lg font-semibold text-white capitalize">{subscription.plan}</p>
              <p className="text-xs text-gray-500">{formatCurrency(subscription.price_cents)}</p>
            </div>
            <div className="rounded-xl bg-white/[0.04] p-4">
              <p className="text-xs text-gray-500 mb-1">Renews</p>
              <p className="text-lg font-semibold text-white">
                {subscription.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'N/A'}
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.04] p-4">
              <p className="text-xs text-gray-500 mb-1">Gateway</p>
              <p className="text-lg font-semibold text-white flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-emerald-400" /> Razorpay
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-4">
              {subscription?.status === 'cancelled' ? 'Your subscription was cancelled.' : 'No active subscription.'}
            </p>
          </div>
        )}
      </div>

      {/* Renew / Upgrade */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          {subscription?.status === 'active' ? 'Upgrade Plan' : 'Subscribe'}
        </h2>

        <div className="flex gap-3 mb-4">
          {(['monthly', 'yearly'] as const).map((plan) => (
            <button
              key={plan}
              onClick={() => setRenewPlan(plan)}
              className={`flex-1 rounded-xl border p-4 text-left transition-all ${
                renewPlan === plan
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]'
              }`}
            >
              <p className="text-sm font-semibold text-white capitalize">{plan}</p>
              <p className="text-xs text-gray-400">{formatCurrency(PRICING[plan].amount)}</p>
              <p className="text-xs text-gray-600">≈ {paiseToCurrency(PLAN_PRICES_PAISE[plan])}</p>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          Secure checkout · Powered by Razorpay
        </div>

        {verifying ? (
          <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
            <div className="h-5 w-5 animate-spin border-2 border-emerald-500 border-t-transparent rounded-full" />
            Verifying payment…
          </div>
        ) : orderData ? (
          <RazorpayCheckout
            orderId={orderData.order_id}
            amount={orderData.amount}
            currency={orderData.currency}
            plan={renewPlan}
            prefill={orderData.prefill}
            onSuccess={handlePaymentSuccess}
            onDismiss={() => setOrderData(null)}
            onError={(msg) => { setOrderData(null); toast({ type: 'error', title: 'Error', description: msg }) }}
          />
        ) : (
          <Button onClick={handleCreateOrder} loading={creatingOrder} size="lg">
            <CreditCard className="h-4 w-4" />
            Pay {paiseToCurrency(PLAN_PRICES_PAISE[renewPlan])}
          </Button>
        )}
      </div>

      {/* Payment History */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Payment History</h2>
        {payments.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <CreditCard className="h-10 w-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No payments yet.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(payment.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm capitalize text-white">{payment.plan}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">
                      {paiseToCurrency(payment.amount_paise)}
                    </td>
                    <td className="px-6 py-4">{statusBadge(payment.status)}</td>
                    <td className="px-6 py-4 text-xs text-gray-600 font-mono truncate max-w-[160px]">
                      {payment.razorpay_payment_id || payment.razorpay_order_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
