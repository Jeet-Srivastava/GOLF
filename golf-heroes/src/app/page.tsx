'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Trophy, Heart, Target, ArrowRight, Shield, Star, Users } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PRICING, formatCurrency } from '@/types'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  }),
}

const steps = [
  { step: '01', title: 'Subscribe & Support', desc: 'Join for £9.99/mo. Choose a charity to receive a guaranteed 10%.' },
  { step: '02', title: 'Score & Submit', desc: 'Enter your latest 5 Stableford scores. These are your unique draw numbers.' },
  { step: '03', title: 'Match & Win', desc: 'Match 3, 4, or 5 in the monthly draw to win life-changing cash prizes.' },
]

const charities = [
  { name: 'The Golf Trust', desc: 'Bringing golf to disadvantaged youth', tag: 'Youth' },
  { name: 'Cancer Research UK', desc: 'Beating cancer through research', tag: 'Health' },
  { name: 'Mind Mental Health', desc: 'Mental health support for everyone', tag: 'Support' },
]

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      <Navbar />

      {/* ─── Advanced Hero Section ─── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center pt-24 pb-16 px-4">
        {/* Ambient Neon Backlight */}
        <div className="ambient-glow w-[800px] h-[400px] bg-emerald-500/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative z-10 mx-auto max-w-5xl text-center flex flex-col items-center">
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 shadow-neon text-xs font-medium text-zinc-300 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              The New Standard in Golf Charity
            </div>
          </motion.div>

          <motion.h1 
            custom={1} variants={fadeUp} initial="hidden" animate="visible"
            className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.95] text-white"
          >
            Your Scores.<br/>
            <span className="text-gradient">Their Future.</span>
          </motion.h1>

          <motion.p 
            custom={2} variants={fadeUp} initial="hidden" animate="visible"
            className="mt-8 max-w-xl text-base sm:text-lg text-zinc-400 leading-relaxed font-medium"
          >
            Bridge the gap between your passion on the course and global impact. Subscribe, submit your Stableford scores, support a charity, and win massive monthly prizes.
          </motion.p>

          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Link href="/auth/signup">
              <Button size="xl" variant="primary" className="glow-edge rounded-full font-semibold px-8">
                Start Playing for Good
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="xl" variant="secondary" className="rounded-full px-8 text-zinc-300">
                Explore the Platform
              </Button>
            </Link>
          </motion.div>

          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8 border-t border-white/5 pt-8 text-left w-full max-w-4xl">
            {[
              { l: 'Members', v: '2.5k+' },
              { l: 'Charity Raised', v: '£125k' },
              { l: 'Prizes Awarded', v: '£85k' },
              { l: 'Monthly Draws', v: '36+' }
            ].map(s => (
              <div key={s.l} className="space-y-1">
                <p className="text-3xl font-bold tracking-tight text-white">{s.v}</p>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{s.l}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── High-End Linear Grid ─── */}
      <section className="py-32 relative z-10 border-t border-white/[0.04] bg-black">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
              An ecosystem designed<br/>for <span className="text-emerald-500">Maximum Impact.</span>
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <Card key={step.step} padding="lg" className="flex flex-col h-full bg-[#050505]">
                <div className="mb-4 text-xs font-bold tracking-widest text-emerald-500/50">
                  STEP {step.step}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                  {step.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Charities ─── */}
      <section className="py-32 relative z-10 border-t border-white/[0.04]">
        <div className="ambient-glow w-[600px] h-[600px] bg-emerald-900/10 -top-40 right-0" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-xl">
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
                Support Causes that Matter.
              </h2>
            </div>
            <Link href="/charities">
              <Button variant="ghost" className="rounded-full text-zinc-300">
                View All Charities <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {charities.map((charity) => (
               <Card key={charity.name} hover glow className="group bg-[#040404]">
                 <div className="flex justify-between items-start mb-12">
                    <Heart className="w-5 h-5 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
                    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 border border-zinc-800 rounded px-2 py-0.5">
                      {charity.tag}
                    </span>
                 </div>
                 <h3 className="text-lg font-bold text-white mb-2">{charity.name}</h3>
                 <p className="text-sm font-medium text-zinc-500">{charity.desc}</p>
               </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing Card ─── */}
      <section className="py-32 relative border-t border-white/[0.04]">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-6">
            One Plan. Total Access.
          </h2>
          <Card padding="lg" glow className="max-w-md mx-auto text-left relative bg-[#050505]">
             <div className="absolute top-0 right-0 p-6">
               <Trophy className="w-8 h-8 text-zinc-800" />
             </div>
             <h3 className="text-xl font-bold text-white">Monthly Supporter</h3>
             <div className="flex items-end gap-1 mt-4 mb-6">
               <span className="text-5xl font-extrabold tracking-tighter text-white">£9.99</span>
               <span className="text-sm font-semibold text-zinc-500 mb-1">/mo</span>
             </div>
             <ul className="space-y-4 mb-8">
               {['Automated Monthly Draw Entries', 'Rolling-5 Score Tracking', 'Direct Charity Contributions', 'Jackpot Eligibility'].map(f => (
                 <li key={f} className="flex items-center gap-3 text-sm font-medium text-zinc-300">
                   <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                   </div>
                   {f}
                 </li>
               ))}
             </ul>
             <Link href="/auth/signup" className="block">
               <Button variant="primary" fullWidth className="glow-edge rounded-xl">
                 Subscribe & Enter Now
               </Button>
             </Link>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  )
}
