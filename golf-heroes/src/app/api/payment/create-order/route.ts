import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRazorpay, PLAN_PRICES_PAISE } from '@/lib/razorpay'

/**
 * POST /api/payment/create-order
 *
 * Creates a Razorpay order server-side and stores a pending payment record.
 * Returns order details the client uses to open Razorpay Checkout.
 *
 * Body: { plan: 'monthly' | 'yearly' }
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { plan } = body as { plan: 'monthly' | 'yearly' }

  if (plan !== 'monthly' && plan !== 'yearly') {
    return NextResponse.json({ error: 'Invalid plan. Must be monthly or yearly.' }, { status: 400 })
  }

  const amountPaise = PLAN_PRICES_PAISE[plan]

  try {
    // 1. Create Razorpay order
    const razorpay = getRazorpay()
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `gh_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        user_id: user.id,
        plan,
        app: 'golf-heroes',
      },
    })

    // 2. Store pending payment in DB
    const { error: dbError } = await supabase.from('payments').insert({
      user_id: user.id,
      razorpay_order_id: order.id,
      amount_paise: amountPaise,
      currency: 'INR',
      plan,
      status: 'created',
    })

    if (dbError) {
      console.error('DB insert error:', dbError)
      return NextResponse.json({ error: 'Failed to record order' }, { status: 500 })
    }

    // 3. Fetch user profile for prefilling checkout
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      order_id: order.id,
      amount: amountPaise,
      currency: 'INR',
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      plan,
      prefill: {
        name: profile?.full_name || '',
        email: profile?.email || user.email || '',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Razorpay create-order failed:', message)
    return NextResponse.json({ error: `Payment gateway error: ${message}` }, { status: 500 })
  }
}
