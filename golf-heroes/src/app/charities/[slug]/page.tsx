'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, ArrowLeft, ExternalLink, Globe } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

interface Charity {
  id: string
  name: string
  slug: string
  description: string
  short_description: string
  image_url: string | null
  website_url: string | null
  is_featured: boolean
  total_received_cents: number
}

export default function CharityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [charity, setCharity] = useState<Charity | null>(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Back */}
          <Link
            href="/charities"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" /> All Charities
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Hero Image */}
            {charity.image_url && (
              <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden mb-8">
                <img
                  src={charity.image_url}
                  alt={charity.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent" />
              </div>
            )}

            {/* Content */}
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-white sm:text-4xl">{charity.name}</h1>
                    {charity.is_featured && <Badge variant="primary">Featured</Badge>}
                  </div>
                  <p className="text-lg text-gray-400">{charity.short_description}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
                  <p className="text-sm text-gray-500 mb-1">Total Raised</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    £{(charity.total_received_cents / 100).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
                  <p className="text-sm text-gray-500 mb-1">Impact</p>
                  <p className="text-2xl font-bold text-white flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-400" /> Active
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
                <h2 className="text-xl font-semibold text-white mb-4">About</h2>
                <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">{charity.description}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/signup" className="flex-1">
                  <Button size="lg" fullWidth>
                    <Heart className="h-4 w-4" />
                    Subscribe & Support This Charity
                  </Button>
                </Link>
                {charity.website_url && (
                  <a href={charity.website_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" size="lg">
                      <Globe className="h-4 w-4" />
                      Visit Website
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
