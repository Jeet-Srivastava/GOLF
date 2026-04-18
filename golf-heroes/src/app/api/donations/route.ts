import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/donations — Make an independent donation
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { charity_id, amount_cents } = body

  if (!charity_id || !amount_cents || amount_cents <= 0) {
    return NextResponse.json({ error: 'Valid charity and amount required' }, { status: 400 })
  }

  // Verify charity exists
  const { data: charity } = await supabase
    .from('charities')
    .select('id')
    .eq('id', charity_id)
    .single()

  if (!charity) {
    return NextResponse.json({ error: 'Charity not found' }, { status: 404 })
  }

  // Create donation
  const { data, error } = await supabase
    .from('donations')
    .insert({ user_id: user.id, charity_id, amount_cents })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Update charity total (increment manually)
  const { data: currentCharity } = await supabase
    .from('charities')
    .select('total_received_cents')
    .eq('id', charity_id)
    .single()

  if (currentCharity) {
    await supabase
      .from('charities')
      .update({ total_received_cents: (currentCharity.total_received_cents || 0) + amount_cents })
      .eq('id', charity_id)
  }

  return NextResponse.json(data, { status: 201 })
}
