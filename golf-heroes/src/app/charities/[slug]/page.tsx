/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Heart, ArrowLeft, Globe, Calendar, Gift } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { ToastProvider } from '@/components/ui/toast'
import { formatCurrency } from '@/types'

interface Charity {
  id: string
  name: string
  slug: string
  description: string
  short_description: string
  upcoming_events: string | null
  image_url: string | null
  website_url: string | null
  is_featured: boolean
  total_received_cents: number
}

export default function CharityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter()
  const { slug } = use(params)
  const [charity, setCharity] = useState<Charity | null>(null)
  const [loading, setLoading] = useState(true)
  const [donationAmount, setDonationAmount] = useState('25')
  const [donating, setDonating] = useState(false)
  const [donationMessage, setDonationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('charities')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data }) => {
        if (data) setCharity(data)
        setLoading(false)
      })
  }, [slug])

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-shimmer h-8 w-48 rounded-lg" />
        </div>
      </div>
    )
  }

  if (!charity) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Charity Not Found</h1>
            <Link href="/charities" className="text-emerald-400 hover:text-emerald-300">
              ← Back to charities
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const upcomingEvents = charity.upcoming_events
    ?.split('\n')
    .map((event) => event.trim())
    .filter(Boolean) || []

  const handleDonation = async (e: React.FormEvent) => {
    e.preventDefault()
    setDonationMessage(null)

    const parsedAmount = Number(donationAmount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setDonationMessage({ type: 'error', text: 'Enter a valid donation amount.' })
      return
    }

    setDonating(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setDonating(false)
      setDonationMessage({ type: 'error', text: 'Sign in to make an independent donation.' })
      router.push('/auth/login')
      return
    }

    const amountCents = Math.round(parsedAmount * 100)
    const response = await fetch('/api/donations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        charity_id: charity.id,
        amount_cents: amountCents,
      }),
    })

    const payload = await response.json()

    if (!response.ok) {
      setDonationMessage({
        type: 'error',
        text: payload.error || 'Donation could not be completed.',
      })
      setDonating(false)
      return
    }

    setCharity((current) =>
      current
        ? { ...current, total_received_cents: current.total_received_cents + amountCents }
        : current
    )
    setDonationMessage({
      type: 'success',
      text: `Thank you. ${formatCurrency(amountCents)} has been added to ${charity.name}.`,
    })
    setDonationAmount('25')
    setDonating(false)
  }

  return (
    <ToastProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1 pt-24 pb-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <Link
              href="/charities"
              className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> All Charities
            </Link>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {charity.image_url && (
                <div className="relative mb-8 h-64 overflow-hidden rounded-2xl sm:h-80">
                  <img
                    src={charity.image_url}
                    alt={charity.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent" />
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-3">
                      <h1 className="text-3xl font-bold text-white sm:text-4xl">{charity.name}</h1>
                      {charity.is_featured && <Badge variant="primary">Featured</Badge>}
                    </div>
                    <p className="text-lg text-gray-400">{charity.short_description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
                    <p className="mb-1 text-sm text-gray-500">Total Raised</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      £{(charity.total_received_cents / 100).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
                    <p className="mb-1 text-sm text-gray-500">Impact</p>
                    <p className="flex items-center gap-2 text-2xl font-bold text-white">
                      <Heart className="h-5 w-5 text-red-400" /> Active
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
                      <h2 className="mb-4 text-xl font-semibold text-white">About</h2>
                      <p className="whitespace-pre-wrap leading-relaxed text-gray-400">{charity.description}</p>
                    </div>

                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
                      <div className="mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-cyan-400" />
                        <h2 className="text-xl font-semibold text-white">Upcoming Events</h2>
                      </div>
                      {upcomingEvents.length > 0 ? (
                        <div className="space-y-3">
                          {upcomingEvents.map((event) => (
                            <div
                              key={event}
                              className="rounded-xl border border-cyan-500/10 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-100"
                            >
                              {event}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No upcoming charity events are listed yet.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-2xl border border-emerald-500/10 bg-white/[0.03] p-6">
                      <div className="mb-4 flex items-center gap-2">
                        <Gift className="h-5 w-5 text-emerald-400" />
                        <h2 className="text-xl font-semibold text-white">Independent Donation</h2>
                      </div>
                      <p className="mb-4 text-sm text-gray-400">
                        Support this charity directly, even outside the subscription and draw flow.
                      </p>

                      <form onSubmit={handleDonation} className="space-y-4">
                        <Input
                          label="Amount (GBP)"
                          type="number"
                          min="1"
                          step="0.01"
                          value={donationAmount}
                          onChange={(e) => setDonationAmount(e.target.value)}
                          placeholder="25.00"
                        />

                        {donationMessage && (
                          <p
                            className={`rounded-xl border px-4 py-3 text-sm ${
                              donationMessage.type === 'success'
                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                                : 'border-red-500/20 bg-red-500/10 text-red-300'
                            }`}
                          >
                            {donationMessage.text}
                          </p>
                        )}

                        <Button type="submit" fullWidth loading={donating}>
                          <Heart className="h-4 w-4" />
                          Donate Now
                        </Button>
                      </form>
                    </div>

                    <div className="flex flex-col gap-4">
                      <Link href="/auth/signup" className="w-full">
                        <Button size="lg" fullWidth>
                          <Heart className="h-4 w-4" />
                          Subscribe & Support This Charity
                        </Button>
                      </Link>
                      {charity.website_url && (
                        <a href={charity.website_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="secondary" size="lg" fullWidth>
                            <Globe className="h-4 w-4" />
                            Visit Website
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>
    </ToastProvider>
  )
}
