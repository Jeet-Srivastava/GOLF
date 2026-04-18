'use client'

import { clsx } from 'clsx'
import { motion } from 'framer-motion'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  onClick?: () => void
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({ children, className, hover = true, glow = false, padding = 'md', onClick }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      onClick={onClick}
      className={clsx(
        'glass-panel rounded-2xl transition-all duration-300 relative',
        hover && 'hover:bg-[rgba(255,255,255,0.02)] cursor-pointer glow-edge',
        glow && '[box-shadow:var(--shadow-neon)]',
        paddings[padding],
        className
      )}
    >
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  )
}

/** Static card (no animation) for server components */
export function StaticCard({ children, className, padding = 'md' }: Omit<CardProps, 'hover' | 'glow' | 'onClick'>) {
  return (
    <div
      className={clsx(
        'glass-panel relative rounded-2xl',
        paddings[padding],
        className
      )}
    >
      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}
