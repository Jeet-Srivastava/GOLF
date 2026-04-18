'use client'

import { motion } from 'framer-motion'
import {
  Trophy, Heart, Target, Dices, ArrowRight, Shield,
  Users, Gift, Calendar, Star, TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
}

const drawRules = [
  { match: '5 Numbers', pool: '40%', rollover: true, color: 'from-amber-500 to-orange-500', icon: '🏆' },
  { match: '4 Numbers', pool: '35%', rollover: false, color: 'from-cyan-500 to-blue-500', icon: '🥈' },
  { match: '3 Numbers', pool: '25%', rollover: false, color: 'from-emerald-500 to-teal-500', icon: '🥉' },
]

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400 mb-6">
              <Dices className="h-3.5 w-3.5" /> Understanding the Game
            </span>
            <h1 className="text-4xl font-bold text-white sm:text-5xl mb-6">
              How <span className="gradient-text">Golf Heroes</span> Works
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Your golf scores become your lottery numbers. Your subscription funds charities and prizes.
              It&apos;s golf with purpose.
            </p>
          </motion.div>

          {/* Step-by-step */}
          <div className="space-y-20 mb-24">
            {/* Step 1 */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-8 sm:grid-cols-2 items-center">
              <motion.div custom={0} variants={fadeUp}>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg mb-6">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">1. Subscribe</h2>
                <p className="text-gray-400 leading-relaxed">
                  Choose a monthly (£9.99) or yearly (£89.99) plan. Select a charity partner
                  and decide your contribution percentage (minimum 10%). Your subscription funds
                  the prize pool and supports your chosen charity.
                </p>
              </motion.div>
              <motion.div custom={1} variants={fadeUp} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-white/[0.04] p-3">
                    <span className="text-sm text-gray-400">Subscription</span>
                    <span className="text-sm font-medium text-white">£9.99/mo</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 p-3">
                    <span className="text-sm text-emerald-400">→ Charity (10%+)</span>
                    <span className="text-sm font-medium text-emerald-400">£1.00+</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-amber-500/10 p-3">
                    <span className="text-sm text-amber-400">→ Prize Pool</span>
                    <span className="text-sm font-medium text-amber-400">Funded</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Step 2 */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-8 sm:grid-cols-2 items-center">
              <motion.div custom={0} variants={fadeUp} className="order-2 sm:order-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <p className="text-xs text-gray-500 mb-3">Your Latest 5 Scores (Stableford)</p>
                <div className="grid grid-cols-5 gap-2">
                  {[36, 28, 42, 31, 19].map((score, i) => (
                    <div key={i} className="flex flex-col items-center rounded-xl border border-white/[0.08] bg-white/[0.04] p-3">
                      <span className="text-xl font-bold text-white">{score}</span>
                      <span className="text-[10px] text-gray-500 mt-1">Score {i + 1}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  These 5 numbers are your draw entry
                </p>
              </motion.div>
              <motion.div custom={1} variants={fadeUp} className="order-1 sm:order-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg mb-6">
                  <Target className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">2. Enter Your Scores</h2>
                <p className="text-gray-400 leading-relaxed">
                  Log your last 5 golf rounds in Stableford format (1–45 points).
                  Only one score allowed per date. A new score automatically replaces the oldest.
                  Your 5 most recent scores become your unique draw numbers.
                </p>
              </motion.div>
            </motion.div>

            {/* Step 3 */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-8 sm:grid-cols-2 items-center">
              <motion.div custom={0} variants={fadeUp}>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg mb-6">
                  <Trophy className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">3. Win Prizes</h2>
                <p className="text-gray-400 leading-relaxed">
                  At the end of each month, 5 winning numbers are drawn. If your scores match
                  3, 4, or all 5 numbers, you win from the prize pool. If nobody matches all 5,
                  the jackpot rolls over to next month!
                </p>
              </motion.div>
              <motion.div custom={1} variants={fadeUp} className="space-y-3">
                {drawRules.map((rule, i) => (
                  <div
                    key={rule.match}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{rule.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{rule.match}</p>
                        <p className="text-xs text-gray-500">
                          {rule.rollover ? 'Jackpot — rolls over!' : 'Shared equally among winners'}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full bg-gradient-to-r ${rule.color} px-3 py-1 text-xs font-bold text-white`}>
                      {rule.pool}
                    </span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Join?
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Start making every round count. Subscribe, enter your scores, and play for good.
            </p>
            <Link href="/auth/signup">
              <Button size="xl" variant="primary">
                Get Started <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
