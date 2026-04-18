import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/payment/webhook
 *
 * Handles server-to-server Razorpay webhook events.
 * No user session is available — uses the admin Supabase client.
 *
 * Configure in Razorpay Dashboard → Webhooks:
 *   URL: https://yourdomain.com/api/payment/webhook
 *   Events: payment.captured, payment.failed, order.paid
 */
export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature')
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

  // Verify webhook signature if secret is configured
  if (webhookSecret && signature) {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')

    if (expectedSignature !== signature) {
      console.warn('Razorpay webhook: invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  }

  let event: {
    event: string
    payload: {
      payment?: { entity: {
        id: string
        order_id: string
        status: string
        amount: number
        notes: { user_id?: string; plan?: string }
        error_reason?: string
      }}
    }
  }

  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const paymentEntity = event.payload?.payment?.entity

  if (!paymentEntity) {
    // Acknowledge unknown event types gracefully
    return NextResponse.json({ received: true })
  }

  const { id: paymentId, order_id: orderId, notes } = paymentEntity
  const userId = notes?.user_id
  const plan = notes?.plan as 'monthly' | 'yearly' | undefined

  switch (event.event) {
    case 'payment.captured':
    case 'order.paid': {
      // Payment succeeded — update payment record
      await supabase
        .from('payments')
        .update({
          razorpay_payment_id: paymentId,
          status: 'paid',
        })
        .eq('razorpay_order_id', orderId)

      // Activate subscription if we have user context
      if (userId && plan) {
        const now = new Date()
        const periodEnd = new Date(now)
        if (plan === 'monthly') {
          periodEnd.setMonth(periodEnd.getMonth() + 1)
        } else {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1)
        }

        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (existingSub) {
          await supabase
            .from('subscriptions')
            .update({
              plan,
              status: 'active',
              current_period_start: now.toISOString(),
              current_period_end: periodEnd.toISOString(),
              cancelled_at: null,
            })
            .eq('id', existingSub.id)
        } else {
          await supabase.from('subscriptions').insert({
            user_id: userId,
            plan,
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          })
        }
      }
      break
    }

    case 'payment.failed': {
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          error_reason: paymentEntity.error_reason || 'Payment failed',
        })
        .eq('razorpay_order_id', orderId)
      break
    }

    default:
      // Other events (refunds, disputes) — log and acknowledge
      console.log(`Razorpay webhook: unhandled event "${event.event}"`)
  }

  return NextResponse.json({ received: true })
}
