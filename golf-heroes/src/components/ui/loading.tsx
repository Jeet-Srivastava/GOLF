export function LoadingSpinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-shimmer rounded-xl ${className}`} />
  )
}

export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner className="h-8 w-8 text-emerald-500" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  )
}

/** Dashboard card skeleton */
export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
      <div className="space-y-3">
        <LoadingSkeleton className="h-4 w-24 bg-white/[0.04]" />
        <LoadingSkeleton className="h-8 w-32 bg-white/[0.04]" />
        <LoadingSkeleton className="h-3 w-full bg-white/[0.04]" />
      </div>
    </div>
  )
}
