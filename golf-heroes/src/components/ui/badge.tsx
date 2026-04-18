import { clsx } from 'clsx'

const variants = {
  default:  'bg-white/[0.06] text-gray-300 border-white/[0.08]',
  success:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  danger:   'bg-red-500/10 text-red-400 border-red-500/20',
  info:     'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  primary:  'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
} as const

interface BadgeProps {
  children: React.ReactNode
  variant?: keyof typeof variants
  className?: string
  dot?: boolean
}

export function Badge({ children, variant = 'default', className, dot }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {dot && (
        <span
          className={clsx('h-1.5 w-1.5 rounded-full', {
            'bg-gray-400': variant === 'default',
            'bg-emerald-400': variant === 'success' || variant === 'primary',
            'bg-amber-400': variant === 'warning',
            'bg-red-400': variant === 'danger',
            'bg-cyan-400': variant === 'info',
          })}
        />
      )}
      {children}
    </span>
  )
}
