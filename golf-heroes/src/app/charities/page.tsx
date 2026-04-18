/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, Heart, ArrowRight, Calendar } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

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

function parseUpcomingEvents(value: string | null) {
  return value?.split('\n').map((event) => event.trim()).filter(Boolean) || []
}

export default function CharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('charities')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('name')
      .then(({ data }) => {
        if (data) setCharities(data)
        setLoading(false)
      })
  }, [])

  const filtered = charities.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      (c.upcoming_events || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Our <span className="gradient-text">Charity</span> Partners
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              Every subscription makes a difference. Choose a charity that matters to you,
              and we&apos;ll ensure your contribution reaches them.
            </p>
          </motion.div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-12">
            <Input
              placeholder="Search charities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 animate-shimmer h-64" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((charity, i) => {
                const upcomingEvents = parseUpcomingEvents(charity.upcoming_events)

                return (
                <motion.div
                  key={charity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-all duration-300 hover:border-emerald-500/20 hover:bg-white/[0.04]"
                >
                  {/* Image */}
                  <div className="relative h-40 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 overflow-hidden">
                    {charity.image_url && (
                      <img
                        src={charity.image_url}
                        alt={charity.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-60"
                      />
                    )}
                    {charity.is_featured && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="primary" dot>Featured</Badge>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-2">{charity.name}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed mb-4">{charity.short_description}</p>
                    {upcomingEvents.length > 0 && (
                      <div className="mb-4 flex items-center gap-2 text-xs text-cyan-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {upcomingEvents[0]}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Heart className="h-3.5 w-3.5 text-emerald-500" />
                        £{(charity.total_received_cents / 100).toLocaleString()} raised
                      </div>
                      <Link
                        href={`/charities/${charity.slug}`}
                        className="flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        View <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
                )
              })}
            </div>
          )}

          {filtered.length === 0 && !loading && (
            <div className="text-center py-16">
              <Heart className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">No charities found matching your search.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
