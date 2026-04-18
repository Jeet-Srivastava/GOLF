'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, PRICING } from '@/types'

interface Charity {
  id: string
  name: string
  short_description: string
  image_url: string | null
  is_featured: boolean
}

export default function CharityDashboardPage() {
  const { toast } = useToast()
  const [charities, setCharities] = useState<Charity[]>([])
  const [selectedCharity, setSelectedCharity] = useState<string | null>(null)
  const [charityPercent, setCharityPercent] = useState(10)
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [charitiesRes, profileRes, subRes] = await Promise.all([
      supabase.from('charities').select('id, name, short_description, image_url, is_featured').order('name'),
      supabase.from('profiles').select('selected_charity_id, charity_contribution_percent').eq('id', user.id).single(),
      supabase.from('subscriptions').select('plan').eq('user_id', user.id).single(),
    ])

    setCharities(charitiesRes.data || [])
    if (profileRes.data) {
      setSelectedCharity(profileRes.data.selected_charity_id)
      setCharityPercent(profileRes.data.charity_contribution_percent)
    }
    if (subRes.data) {
      setPlan(subRes.data.plan as 'monthly' | 'yearly')
    }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({
        selected_charity_id: selectedCharity,
        charity_contribution_percent: charityPercent,
      })
      .eq('id', user.id)

    if (error) {
      toast({ type: 'error', title: 'Error', description: error.message })
    } else {
      toast({ type: 'success', title: 'Charity updated!', description: 'Your contribution preferences have been saved.' })
    }
    setSaving(false)
  }

  const currentCharity = charities.find(c => c.id === selectedCharity)
  const contributionAmount = Math.floor(PRICING[plan].amount * charityPercent / 100)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">My Charity</h1>
        <p className="mt-1 text-sm text-gray-500">Choose a charity and set your contribution level.</p>
      </div>

      {/* Current selection summary */}
      {currentCharity && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
              <Heart className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">{currentCharity.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{currentCharity.short_description}</p>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <span className="text-emerald-400 font-medium">{charityPercent}% contribution</span>
                <span className="text-gray-500">≈ {formatCurrency(contributionAmount)} per {plan === 'monthly' ? 'month' : 'year'}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Contribution Slider */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Contribution Percentage</h2>
          <span className="text-2xl font-bold gradient-text">{charityPercent}%</span>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={charityPercent}
          onChange={(e) => setCharityPercent(Number(e.target.value))}
          className="w-full accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>10% min</span>
          <span>100% max</span>
        </div>
        <p className="mt-3 text-sm text-gray-400">
          {formatCurrency(contributionAmount)} of your {formatCurrency(PRICING[plan].amount)}/{plan === 'monthly' ? 'mo' : 'yr'} subscription goes to your charity.
        </p>
      </div>

      {/* Charity Selection */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4">Select a Charity</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {charities.map((charity, i) => (
            <motion.button
              key={charity.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedCharity(charity.id)}
              className={`w-full rounded-xl border p-4 text-left transition-all ${
                selectedCharity === charity.id
                  ? 'border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                  : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  selectedCharity === charity.id ? 'bg-emerald-500/20' : 'bg-white/5'
                }`}>
                  <Heart className={`h-5 w-5 ${selectedCharity === charity.id ? 'text-emerald-400' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{charity.name}</p>
                  <p className="text-xs text-gray-500 truncate">{charity.short_description}</p>
                </div>
                {selectedCharity === charity.id && (
                  <Check className="h-5 w-5 text-emerald-400 shrink-0" />
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} size="lg">
          Save Changes
        </Button>
      </div>
    </div>
  )
}
