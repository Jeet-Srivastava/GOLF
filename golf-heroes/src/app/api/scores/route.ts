import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/scores — Fetch current user's scores (latest 5)
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', user.id)
    .order('played_date', { ascending: false })
    .limit(5)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

/**
 * POST /api/scores — Add a new score (auto-replaces oldest if 5 exist)
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { score, played_date } = body

  // Validate
  if (!score || !played_date) {
    return NextResponse.json({ error: 'Score and date are required' }, { status: 400 })
  }
  if (score < 1 || score > 45) {
    return NextResponse.json({ error: 'Score must be between 1 and 45' }, { status: 400 })
  }

  // Check existing scores count
  const { data: existing } = await supabase
    .from('scores')
    .select('id, played_date')
    .eq('user_id', user.id)
    .order('played_date', { ascending: true })

  // If 5 scores exist, delete the oldest
  if (existing && existing.length >= 5) {
    await supabase.from('scores').delete().eq('id', existing[0].id)
  }

  // Insert new score
  const { data, error } = await supabase
    .from('scores')
    .insert({ user_id: user.id, score, played_date })
    .select()
    .single()

  if (error) {
    if (error.message.includes('duplicate')) {
      return NextResponse.json({ error: 'A score already exists for this date' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data, { status: 201 })
}

/**
 * PUT /api/scores — Update an existing score
 */
export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, score, played_date } = body

  if (!id) return NextResponse.json({ error: 'Score ID required' }, { status: 400 })
  if (score < 1 || score > 45) {
    return NextResponse.json({ error: 'Score must be between 1 and 45' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('scores')
    .update({ score, played_date })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

/**
 * DELETE /api/scores — Delete a score
 */
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Score ID required' }, { status: 400 })

  const { error } = await supabase
    .from('scores')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
