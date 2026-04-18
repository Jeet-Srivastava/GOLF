'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Mail, Lock, User, Eye, EyeOff,
  Heart, Check, CreditCard, ShieldCheck, IndianRupee
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { PRICING, formatCurrency } from '@/types'
import { RazorpayCheckout, type RazorpaySuccessResponse } from '@/components/payment/RazorpayCheckout'
import { PLAN_PRICES_PAISE, paiseToCurrency } from '@/lib/razorpay'

type Step = 'account' | 'plan' | 'charity' | 'payment'

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>('account')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Auth user created during account step
  const [createdUserId, setCreatedUserId] = useState<string | null>(null)

  // Form state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>(
    (searchParams.get('plan') as 'monthly' | 'yearly') || 'monthly'
  )
  const [selectedCharity, setSelectedCharity] = useState('')
  const [charityPercent, setCharityPercent] = useState(10)
  const [charities, setCharities] = useState<Array<{ id: string; name: string; short_description: string }>>([])

  // Payment state
  const [orderData, setOrderData] = useState<{
    order_id: string; amount: number; currency: string
    prefill: { name: string; email: string }
  } | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('charities')
      .select('id, name, short_description')
      .order('name')
      .then(({ data }) => { if (data) setCharities(data) })
  }, [])

  // ── Step 1: Create auth user ──────────────────────────────
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    setLoading(false)
    if (authError) { setError(authError.message); return }
    if (!authData.user) { setError('Failed to create account'); return }

    setCreatedUserId(authData.user.id)
    setStep('plan')
  }

  // ── Step 3: Save charity selection ───────────────────────
  const handleCharitySubmit = async () => {
    if (!selectedCharity || !createdUserId) return
    setLoading(true)

    const supabase = createClient()
    // Small wait for the DB trigger to create the profile
    await new Promise(r => setTimeout(r, 800))

    await supabase.from('profiles').update({
      full_name: fullName,
      selected_charity_id: selectedCharity,
      charity_contribution_percent: charityPercent,
    }).eq('id', createdUserId)

    setLoading(false)
    setStep('payment')
  }

  // ── Step 4: Create Razorpay order ────────────────────────
  const handleCreateOrder = async () => {
    setError('')
    setLoading(true)

    const res = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: selectedPlan }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok || data.error) {
      setError(data.error || 'Could not initiate payment. Please try again.')
      return
    }

    setOrderData({
      order_id: data.order_id,
      amount: data.amount,
      currency: data.currency,
      prefill: data.prefill,
    })
  }

  // ── Razorpay payment success callback ───────────────────
  const handlePaymentSuccess = async (response: RazorpaySuccessResponse) => {
    setVerifying(true)
    setOrderData(null) // close checkout component

    const res = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        plan: selectedPlan,
      }),
    })

    const data = await res.json()
    setVerifying(false)

    if (!res.ok || !data.success) {
      setError(data.error || 'Payment verification failed. Contact support.')
      return
    }

    setPaymentSuccess(true)
    // Redirect to dashboard after 1.5s
    setTimeout(() => { router.push('/dashboard'); router.refresh() }, 1500)
  }

  const stepLabels: Step[] = ['account', 'plan', 'charity', 'payment']
  const stepNumber = stepLabels.indexOf(step)

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid-pattern relative py-20">
      <div className="absolute inset-0 bg-radial-fade" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg px-4"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/25">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              Golf<span className="gradient-text">Heroes</span>
            </span>
          </Link>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center gap-3">
          {(['Account', 'Plan', 'Charity', 'Payment'] as const).map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                i < stepNumber ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 text-white' :
                i === stepNumber ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 text-white ring-2 ring-emerald-500/30 ring-offset-2 ring-offset-gray-950' :
                'bg-white/5 text-gray-600'
              }`}>
                {i < stepNumber ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${i <= stepNumber ? 'text-white' : 'text-gray-600'}`}>
                {label}
              </span>
              {i < 3 && <div className={`h-px w-6 ${i < stepNumber ? 'bg-emerald-500' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-8">
          <AnimatePresence mode="wait">

            {/* ── Step 1: Account ─────────────────────────── */}
            {step === 'account' && (
              <motion.div key="account" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-bold text-white">Create Your Account</h1>
                  <p className="mt-2 text-sm text-gray-400">Join the Golf Heroes community</p>
                </div>
                <form onSubmit={handleAccountSubmit} className="space-y-5">
                  <Input label="Full Name" placeholder="John Smith" value={fullName}
                    onChange={(e) => setFullName(e.target.value)} icon={<User className="h-4 w-4" />} required />
                  <Input label="Email" type="email" placeholder="you@example.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} icon={<Mail className="h-4 w-4" />} required />
                  <div className="relative">
                    <Input label="Password" type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 6 characters" value={password}
                      onChange={(e) => setPassword(e.target.value)} icon={<Lock className="h-4 w-4" />} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-[34px] text-gray-500 hover:text-white">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {error && <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">{error}</p>}
                  <Button type="submit" fullWidth size="lg" loading={loading}>Continue</Button>
                </form>
              </motion.div>
            )}

            {/* ── Step 2: Plan ─────────────────────────────── */}
            {step === 'plan' && (
              <motion.div key="plan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-bold text-white">Choose Your Plan</h1>
                  <p className="mt-2 text-sm text-gray-400">Select a subscription that works for you</p>
                </div>
                <div className="space-y-3">
                  {(['monthly', 'yearly'] as const).map((plan) => (
                    <button key={plan} onClick={() => setSelectedPlan(plan)}
                      className={`w-full rounded-xl border p-5 text-left transition-all ${
                        selectedPlan === plan
                          ? 'border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                          : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-semibold text-white capitalize">{plan}</span>
                          {plan === 'yearly' && (
                            <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                              Save {PRICING.yearly.savings}
                            </span>
                          )}
                          <p className="mt-1 text-sm text-gray-400">
                            {plan === 'monthly' ? 'Cancel anytime' : 'Best value option'}
                          </p>
                          <p className="mt-1 text-xs text-gray-600">
                            ≈ {paiseToCurrency(PLAN_PRICES_PAISE[plan])} charged in INR
                          </p>
                        </div>
                        <span className="text-2xl font-bold text-white">
                          {formatCurrency(PRICING[plan].amount)}
                          <span className="text-sm text-gray-500 font-normal">/{plan === 'monthly' ? 'mo' : 'yr'}</span>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex gap-3">
                  <Button variant="secondary" size="lg" onClick={() => setStep('account')} fullWidth>Back</Button>
                  <Button size="lg" onClick={() => setStep('charity')} fullWidth>Continue</Button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Charity ───────────────────────────── */}
            {step === 'charity' && (
              <motion.div key="charity" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-bold text-white">Choose Your Charity</h1>
                  <p className="mt-2 text-sm text-gray-400">At least {charityPercent}% of your subscription goes to them</p>
                </div>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {charities.map((charity) => (
                    <button key={charity.id} onClick={() => setSelectedCharity(charity.id)}
                      className={`w-full rounded-xl border p-4 text-left transition-all ${
                        selectedCharity === charity.id
                          ? 'border-emerald-500/40 bg-emerald-500/10'
                          : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]'
                      }`}>
                      <div className="flex items-center gap-3">
                        <Heart className={`h-5 w-5 shrink-0 ${selectedCharity === charity.id ? 'text-emerald-400' : 'text-gray-500'}`} />
                        <div>
                          <p className="text-sm font-medium text-white">{charity.name}</p>
                          <p className="text-xs text-gray-500">{charity.short_description}</p>
                        </div>
                        {selectedCharity === charity.id && <Check className="ml-auto h-5 w-5 text-emerald-400 shrink-0" />}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <label className="font-medium text-gray-300">Contribution %</label>
                    <span className="font-bold text-emerald-400">{charityPercent}%</span>
                  </div>
                  <input type="range" min={10} max={100} value={charityPercent}
                    onChange={(e) => setCharityPercent(Number(e.target.value))} className="w-full accent-emerald-500" />
                </div>
                <div className="mt-6 flex gap-3">
                  <Button variant="secondary" size="lg" onClick={() => setStep('plan')} fullWidth>Back</Button>
                  <Button size="lg" onClick={handleCharitySubmit} loading={loading}
                    disabled={!selectedCharity} fullWidth>Continue</Button>
                </div>
              </motion.div>
            )}

            {/* ── Step 4: Payment ───────────────────────────── */}
            {step === 'payment' && (
              <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-bold text-white">Complete Payment</h1>
                  <p className="mt-2 text-sm text-gray-400">Secure checkout powered by Razorpay</p>
                </div>

                {/* Order Summary */}
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 mb-5">
                  <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Order Summary</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400 capitalize">{selectedPlan} Subscription</span>
                    <span className="text-sm font-semibold text-white">{formatCurrency(PRICING[selectedPlan].amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>Charity contribution ({charityPercent}%)</span>
                    <span className="text-emerald-400">
                      {formatCurrency(Math.floor(PRICING[selectedPlan].amount * charityPercent / 100))} donated
                    </span>
                  </div>
                  <div className="border-t border-white/[0.06] pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">Charged today</span>
                      <div className="text-right">
                        <span className="text-lg font-bold gradient-text">
                          {paiseToCurrency(PLAN_PRICES_PAISE[selectedPlan])}
                        </span>
                        <p className="text-xs text-gray-600">in INR via Razorpay</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security badge */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  256-bit SSL encrypted · Razorpay certified · No card details stored
                </div>

                {error && <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400 mb-4">{error}</p>}

                {/* Payment success state */}
                {paymentSuccess && (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
                    <Check className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                    <p className="text-lg font-bold text-white">Payment Successful!</p>
                    <p className="text-sm text-gray-400 mt-1">Redirecting to your dashboard…</p>
                  </motion.div>
                )}

                {/* Verifying state */}
                {verifying && (
                  <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-400">
                    <div className="h-5 w-5 animate-spin border-2 border-emerald-500 border-t-transparent rounded-full" />
                    Verifying payment…
                  </div>
                )}

                {/* Razorpay popup auto-opens when orderId is set */}
                {orderData && !verifying && !paymentSuccess && (
                  <RazorpayCheckout
                    orderId={orderData.order_id}
                    amount={orderData.amount}
                    currency={orderData.currency}
                    plan={selectedPlan}
                    prefill={orderData.prefill}
                    onSuccess={handlePaymentSuccess}
                    onDismiss={() => { setOrderData(null); setError('Payment was cancelled.') }}
                    onError={(msg) => { setOrderData(null); setError(msg) }}
                  />
                )}

                {!orderData && !paymentSuccess && !verifying && (
                  <div className="flex gap-3">
                    <Button variant="secondary" size="lg" onClick={() => setStep('charity')} fullWidth>Back</Button>
                    <Button size="lg" onClick={handleCreateOrder} loading={loading} fullWidth>
                      <CreditCard className="h-4 w-4" /> Pay Now
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-emerald-400 hover:text-emerald-300">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
