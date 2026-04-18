'use client'

import { forwardRef } from 'react'
import { clsx } from 'clsx'

/** Button variant styles */
const variants = {
  primary:
    'bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] ring-1 ring-white/50 tracking-tight',
  secondary:
    'bg-black text-white hover:bg-[#0a0a0a] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-white/10 hover:border-white/20 tracking-tight',
  ghost:
    'text-zinc-400 hover:text-white hover:bg-white/5 tracking-tight',
  danger:
    'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)] tracking-tight',
  accent:
    'bg-[#050505] text-[#12b981] border border-[#12b981]/30 hover:bg-[#12b981]/10 hover:border-[#12b981]/60 shadow-[0_0_20px_rgba(18,185,129,0.15)] tracking-tight',
} as const

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-8 py-3.5 text-base rounded-xl',
  xl: 'px-10 py-4 text-lg rounded-2xl',
} as const

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  loading?: boolean
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          'active:scale-[0.97]',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export { Button }
export type { ButtonProps }
