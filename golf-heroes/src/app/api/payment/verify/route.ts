import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { PRICING } from '@/types'

/**
 * POST /api/payment/verify
 *
 * Verifies the Razorpay payment signature (HMAC-SHA256) and activates
 * the user's subscription upon success.
 *
 * Body: {
 *   razorpay_order_id: string
 *   razorpay_payment_id: string
 *   razorpay_signature: string
 *   plan: 'monthly' | 'yearly'
 * }
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = body

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: 'Missing payment parameters' }, { status: 400 })
  }

  // 1. Verify HMAC-SHA256 signature
  // Razorpay signature = HMAC(order_id + "|" + payment_id, key_secret)
  const keySecret = process.env.RAZORPAY_KEY_SECRET!
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  if (expectedSignature !== razorpay_signature) {
    // Mark payment as failed
    await supabase
      .from('payments')
      .update({ status: 'failed', error_reason: 'Signature mismatch' })
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', user.id)

    return NextResponse.json({ error: 'Payment verification failed — invalid signature' }, { status: 400 })
  }

  try {
    // 2. Update payment record to 'paid'
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'paid',
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', user.id)

    if (paymentError) throw paymentError

    // 3. Activate / renew subscription
    const now = new Date()
    const periodEnd = new Date(now)
    if (plan === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    }

    const priceCents = PRICING[plan as 'monthly' | 'yearly']?.amount ?? 999

    // Upsert subscription (create or renew)
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingSub) {
      await supabase
        .from('subscriptions')
        .update({
          plan,
          status: 'active',
          price_cents: priceCents,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancelled_at: null,
        })
        .eq('id', existingSub.id)
    } else {
      await supabase.from('subscriptions').insert({
        user_id: user.id,
        plan,
        status: 'active',
        price_cents: priceCents,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and subscription activated.',
      plan,
      period_end: periodEnd.toISOString(),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Verify error:', message)
    return NextResponse.json({ error: `Failed to activate subscription: ${message}` }, { status: 500 })
  }
}
