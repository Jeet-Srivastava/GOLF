'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, CreditCard, Calendar, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, PRICING } from '@/types'

export default function ProfilePage() {
  const { toast } = useToast()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [subscription, setSubscription] = useState<{
    plan: string; status: string; current_period_end: string | null; price_cents: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, subRes] = await Promise.all([
      supabase.from('profiles').select('full_name, email').eq('id', user.id).single(),
      supabase.from('subscriptions').select('plan, status, current_period_end, price_cents').eq('user_id', user.id).single(),
    ])

    if (profileRes.data) {
      setFullName(profileRes.data.full_name)
      setEmail(profileRes.data.email)
    }
    setSubscription(subRes.data)
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)

    if (error) {
      toast({ type: 'error', title: 'Error', description: error.message })
    } else {
      toast({ type: 'success', title: 'Profile updated!' })
    }
    setSaving(false)
  }

  async function handleCancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access at the end of your billing period.')) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('user_id', user.id)

    toast({ type: 'info', title: 'Subscription cancelled', description: 'You can re-subscribe at any time.' })
    loadProfile()
  }

  if (loading) return <div className="animate-shimmer h-96 rounded-2xl" />

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile & Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your account and subscription.</p>
      </div>

      {/* Profile Form */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 space-y-5">
        <h2 className="text-lg font-semibold text-white">Account Details</h2>
        <Input
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          icon={<User className="h-4 w-4" />}
        />
        <Input
          label="Email"
          value={email}
          disabled
          icon={<Mail className="h-4 w-4" />}
          hint="Email cannot be changed"
        />
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving}>
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      </div>

      {/* Subscription */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Subscription</h2>
          {subscription && (
            <Badge variant={subscription.status === 'active' ? 'success' : 'danger'} dot>
              {subscription.status}
            </Badge>
          )}
        </div>

        {subscription ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-white/[0.04] p-4">
                <p className="text-xs text-gray-500 flex items-center gap-1"><CreditCard className="h-3 w-3" /> Plan</p>
                <p className="text-lg font-semibold text-white capitalize mt-1">{subscription.plan}</p>
                <p className="text-xs text-gray-500">{formatCurrency(subscription.price_cents)}</p>
              </div>
              <div className="rounded-xl bg-white/[0.04] p-4">
                <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> Renews</p>
                <p className="text-lg font-semibold text-white mt-1">
                  {subscription.current_period_end
                    ? new Date(subscription.current_period_end).toLocaleDateString('en-GB')
                    : 'N/A'}
                </p>
              </div>
            </div>
            {subscription.status === 'active' && (
              <Button variant="danger" size="sm" onClick={handleCancelSubscription}>
                Cancel Subscription
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-4">No active subscription</p>
            <Button>Subscribe Now</Button>
          </div>
        )}
      </div>
    </div>
  )
}
