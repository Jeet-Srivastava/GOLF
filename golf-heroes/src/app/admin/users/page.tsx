'use client'

import { useState, useEffect } from 'react'
import { Search, Edit2, Calendar, CreditCard, Plus, Save, Trash2, Target } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import { PRICING, formatCurrency } from '@/types'

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: string
  charity_contribution_percent: number
  created_at: string
  subscriptions: Array<{
    id: string
    plan: 'monthly' | 'yearly'
    status: 'active' | 'inactive' | 'cancelled' | 'lapsed'
    current_period_end: string | null
  }> | null
}

interface SubscriptionForm {
  id: string | null
  plan: 'monthly' | 'yearly'
  status: 'active' | 'inactive' | 'cancelled' | 'lapsed'
  renewalDate: string
  currentPeriodStart: string | null
}

interface ScoreRecord {
  id: string
  score: number
  played_date: string
  created_at: string
}

const defaultSubscriptionForm: SubscriptionForm = {
  id: null,
  plan: 'monthly',
  status: 'inactive',
  renewalDate: '',
  currentPeriodStart: null,
}

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('subscriber')
  const [subscriptionForm, setSubscriptionForm] = useState<SubscriptionForm>(defaultSubscriptionForm)
  const [scores, setScores] = useState<ScoreRecord[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [subscriptionSaving, setSubscriptionSaving] = useState(false)
  const [scoreSavingId, setScoreSavingId] = useState<string | null>(null)
  const [deletingScoreId, setDeletingScoreId] = useState<string | null>(null)
  const [newScore, setNewScore] = useState('')
  const [newPlayedDate, setNewPlayedDate] = useState('')

  const loadUsers = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('*, subscriptions(id, plan, status, current_period_end)')
      .order('created_at', { ascending: false })

    setUsers(data || [])
    setLoading(false)
  }

  const loadUserDetails = async (userId: string) => {
    const supabase = createClient()
    const [subscriptionRes, scoresRes] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('id, plan, status, current_period_start, current_period_end')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('scores')
        .select('id, score, played_date, created_at')
        .eq('user_id', userId)
        .order('played_date', { ascending: false }),
    ])

    const subscription = subscriptionRes.data
    setSubscriptionForm(
      subscription
        ? {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            renewalDate: subscription.current_period_end?.slice(0, 10) || '',
            currentPeriodStart: subscription.current_period_start,
          }
        : defaultSubscriptionForm
    )
    setScores(scoresRes.data || [])
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      void loadUsers()
    })
  }, [])

  const filtered = users.filter(
    u => u.email.toLowerCase().includes(search.toLowerCase()) ||
         u.full_name.toLowerCase().includes(search.toLowerCase())
  )

  const openEdit = async (user: UserProfile) => {
    setEditingUser(user)
    setEditName(user.full_name)
    setEditRole(user.role)
    setNewScore('')
    setNewPlayedDate(new Date().toISOString().slice(0, 10))
    setDetailLoading(true)
    await loadUserDetails(user.id)
    setDetailLoading(false)
  }

  const closeModal = () => {
    setEditingUser(null)
    setSubscriptionForm(defaultSubscriptionForm)
    setScores([])
  }

  const handleSaveUser = async () => {
    if (!editingUser) return
    setProfileSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: editName, role: editRole as 'subscriber' | 'admin' })
      .eq('id', editingUser.id)

    if (error) {
      toast({ type: 'error', title: 'Error', description: error.message })
    } else {
      toast({ type: 'success', title: 'Profile updated' })
      setEditingUser({ ...editingUser, full_name: editName, role: editRole })
      await loadUsers()
    }
    setProfileSaving(false)
  }

  const handleSaveSubscription = async () => {
    if (!editingUser) return
    setSubscriptionSaving(true)

    const supabase = createClient()
    const priceCents = PRICING[subscriptionForm.plan].amount
    const renewalDate = subscriptionForm.renewalDate
      ? new Date(`${subscriptionForm.renewalDate}T00:00:00`).toISOString()
      : null

    const payload = {
      user_id: editingUser.id,
      plan: subscriptionForm.plan,
      status: subscriptionForm.status,
      price_cents: priceCents,
      current_period_start:
        subscriptionForm.currentPeriodStart ||
        (subscriptionForm.status === 'active' ? new Date().toISOString() : null),
      current_period_end: renewalDate,
      cancelled_at: subscriptionForm.status === 'cancelled' ? new Date().toISOString() : null,
    }

    const query = subscriptionForm.id
      ? supabase.from('subscriptions').update(payload).eq('id', subscriptionForm.id)
      : supabase.from('subscriptions').insert(payload)

    const { error } = await query

    if (error) {
      toast({ type: 'error', title: 'Subscription error', description: error.message })
      setSubscriptionSaving(false)
      return
    }

    toast({ type: 'success', title: subscriptionForm.id ? 'Subscription updated' : 'Subscription created' })
    await loadUserDetails(editingUser.id)
    await loadUsers()
    setSubscriptionSaving(false)
  }

  const handleScoreFieldChange = (scoreId: string, field: 'score' | 'played_date', value: string) => {
    setScores((current) =>
      current.map((score) =>
        score.id === scoreId
          ? {
              ...score,
              [field]: field === 'score' ? Number(value) : value,
            }
          : score
      )
    )
  }

  const handleSaveScore = async (scoreId: string) => {
    const scoreToSave = scores.find((score) => score.id === scoreId)
    if (!scoreToSave || !editingUser) return

    if (scoreToSave.score < 1 || scoreToSave.score > 45) {
      toast({ type: 'error', title: 'Invalid score', description: 'Scores must be between 1 and 45.' })
      return
    }

    if (!scoreToSave.played_date) {
      toast({ type: 'error', title: 'Date required', description: 'Each score needs a played date.' })
      return
    }

    setScoreSavingId(scoreId)
    const supabase = createClient()
    const { error } = await supabase
      .from('scores')
      .update({
        score: scoreToSave.score,
        played_date: scoreToSave.played_date,
      })
      .eq('id', scoreId)

    if (error) {
      toast({
        type: 'error',
        title: 'Unable to update score',
        description: error.message.includes('duplicate')
          ? 'A score already exists for that date.'
          : error.message,
      })
    } else {
      toast({ type: 'success', title: 'Score updated' })
      await loadUserDetails(editingUser.id)
    }
    setScoreSavingId(null)
  }

  const handleDeleteScore = async (scoreId: string) => {
    if (!editingUser) return
    setDeletingScoreId(scoreId)

    const supabase = createClient()
    const { error } = await supabase.from('scores').delete().eq('id', scoreId)

    if (error) {
      toast({ type: 'error', title: 'Unable to delete score', description: error.message })
    } else {
      toast({ type: 'success', title: 'Score deleted' })
      await loadUserDetails(editingUser.id)
    }
    setDeletingScoreId(null)
  }

  const handleAddScore = async () => {
    if (!editingUser) return

    const parsedScore = Number(newScore)
    if (!Number.isInteger(parsedScore) || parsedScore < 1 || parsedScore > 45) {
      toast({ type: 'error', title: 'Invalid score', description: 'Scores must be whole numbers between 1 and 45.' })
      return
    }

    if (!newPlayedDate) {
      toast({ type: 'error', title: 'Date required', description: 'Choose a played date before adding a score.' })
      return
    }

    if (scores.some((score) => score.played_date === newPlayedDate)) {
      toast({ type: 'error', title: 'Duplicate date', description: 'That user already has a score for this date.' })
      return
    }

    setScoreSavingId('new-score')
    const supabase = createClient()

    if (scores.length >= 5) {
      const oldestScore = [...scores].sort((a, b) => a.played_date.localeCompare(b.played_date))[0]
      if (oldestScore) {
        const { error: deleteError } = await supabase.from('scores').delete().eq('id', oldestScore.id)
        if (deleteError) {
          toast({ type: 'error', title: 'Unable to rotate scores', description: deleteError.message })
          setScoreSavingId(null)
          return
        }
      }
    }

    const { error } = await supabase.from('scores').insert({
      user_id: editingUser.id,
      score: parsedScore,
      played_date: newPlayedDate,
    })

    if (error) {
      toast({ type: 'error', title: 'Unable to add score', description: error.message })
      setScoreSavingId(null)
      return
    }

    toast({
      type: 'success',
      title: 'Score added',
      description: scores.length >= 5 ? 'The oldest score was replaced to keep the rolling five.' : undefined,
    })
    setNewScore('')
    setNewPlayedDate(new Date().toISOString().slice(0, 10))
    await loadUserDetails(editingUser.id)
    setScoreSavingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            {loading ? 'Loading users…' : `${users.length} total users`}
          </p>
        </div>
      </div>

      <Input
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={<Search className="h-4 w-4" />}
      />

      {/* Users Table */}
      <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((user) => {
                const sub = user.subscriptions?.[0]
                return (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{user.full_name || '—'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={user.role === 'admin' ? 'warning' : 'default'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {sub ? (
                        <div className="flex items-center gap-2">
                          <Badge variant={sub.status === 'active' ? 'success' : 'danger'} dot>
                            {sub.status}
                          </Badge>
                          <span className="text-xs text-gray-500 capitalize">{sub.plan}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-600">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEdit(user)}
                        className="rounded-lg p-2 text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={!!editingUser}
        onOpenChange={(open) => !open && closeModal()}
        title="Edit User"
        description={editingUser?.email}
        className="max-w-4xl"
      >
        {detailLoading ? (
          <div className="space-y-3">
            <div className="h-24 animate-shimmer rounded-2xl" />
            <div className="h-32 animate-shimmer rounded-2xl" />
            <div className="h-48 animate-shimmer rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Account</h3>
                    <p className="text-xs text-gray-500">Manage name and role.</p>
                  </div>
                  <Badge variant={editRole === 'admin' ? 'warning' : 'default'}>{editRole}</Badge>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-300">Role</label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white"
                    >
                      <option value="subscriber">Subscriber</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <Button onClick={handleSaveUser} loading={profileSaving} fullWidth>
                    <Save className="h-4 w-4" /> Save Profile
                  </Button>
                </div>
              </section>

              <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Subscription</h3>
                    <p className="text-xs text-gray-500">Create, renew, lapse, or cancel access.</p>
                  </div>
                  <CreditCard className="h-4 w-4 text-gray-500" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-300">Plan</label>
                    <select
                      value={subscriptionForm.plan}
                      onChange={(e) =>
                        setSubscriptionForm((current) => ({
                          ...current,
                          plan: e.target.value as SubscriptionForm['plan'],
                        }))
                      }
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-300">Status</label>
                    <select
                      value={subscriptionForm.status}
                      onChange={(e) =>
                        setSubscriptionForm((current) => ({
                          ...current,
                          status: e.target.value as SubscriptionForm['status'],
                        }))
                      }
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="lapsed">Lapsed</option>
                    </select>
                  </div>
                  <Input
                    label="Renewal Date"
                    type="date"
                    value={subscriptionForm.renewalDate}
                    onChange={(e) =>
                      setSubscriptionForm((current) => ({
                        ...current,
                        renewalDate: e.target.value,
                      }))
                    }
                    icon={<Calendar className="h-4 w-4" />}
                  />
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {formatCurrency(PRICING[subscriptionForm.plan].amount)}
                    </p>
                  </div>
                </div>

                <Button onClick={handleSaveSubscription} loading={subscriptionSaving} className="mt-4" fullWidth>
                  <CreditCard className="h-4 w-4" />
                  {subscriptionForm.id ? 'Update Subscription' : 'Create Subscription'}
                </Button>
              </section>
            </div>

            <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Golf Scores</h3>
                  <p className="text-xs text-gray-500">Admin can edit the rolling five directly.</p>
                </div>
                <Badge variant="info">{scores.length}/5 stored</Badge>
              </div>

              <div className="space-y-3">
                {scores.map((score) => (
                  <div
                    key={score.id}
                    className="grid gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 md:grid-cols-[120px_180px_1fr_auto]"
                  >
                    <Input
                      label="Score"
                      type="number"
                      min={1}
                      max={45}
                      value={String(score.score)}
                      onChange={(e) => handleScoreFieldChange(score.id, 'score', e.target.value)}
                      icon={<Target className="h-4 w-4" />}
                    />
                    <Input
                      label="Played Date"
                      type="date"
                      value={score.played_date}
                      onChange={(e) => handleScoreFieldChange(score.id, 'played_date', e.target.value)}
                      icon={<Calendar className="h-4 w-4" />}
                    />
                    <div className="flex items-end text-xs text-gray-500">
                      Added {new Date(score.created_at).toLocaleDateString('en-GB')}
                    </div>
                    <div className="flex items-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSaveScore(score.id)}
                        loading={scoreSavingId === score.id}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteScore(score.id)}
                        loading={deletingScoreId === score.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="grid gap-3 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] p-4 md:grid-cols-[120px_180px_1fr_auto]">
                  <Input
                    label="New Score"
                    type="number"
                    min={1}
                    max={45}
                    value={newScore}
                    onChange={(e) => setNewScore(e.target.value)}
                    icon={<Plus className="h-4 w-4" />}
                    placeholder="36"
                  />
                  <Input
                    label="Played Date"
                    type="date"
                    value={newPlayedDate}
                    onChange={(e) => setNewPlayedDate(e.target.value)}
                    icon={<Calendar className="h-4 w-4" />}
                  />
                  <div className="flex items-end text-xs text-gray-500">
                    {scores.length >= 5
                      ? 'Adding a new score will replace the oldest stored score.'
                      : 'Add a score for this user without leaving the admin dashboard.'}
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddScore} loading={scoreSavingId === 'new-score'} fullWidth>
                      <Plus className="h-4 w-4" /> Add Score
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </Modal>
    </div>
  )
}
