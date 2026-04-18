import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/subscription — Create or renew a subscription (mock payment flow)
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { plan } = body

  if (plan !== 'monthly' && plan !== 'yearly') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const priceCents = plan === 'monthly' ? 999 : 8999
  const now = new Date()
  const periodEnd = new Date(now)
  if (plan === 'monthly') {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  }

  // Check for existing subscription
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // Renew
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        plan,
        status: 'active',
        price_cents: priceCents,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancelled_at: null,
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  }

  // Create new
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: user.id,
      plan,
      status: 'active',
      price_cents: priceCents,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

/**
 * PUT /api/subscription — Cancel subscription
 */
export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { action } = body

  if (action === 'cancel') {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
