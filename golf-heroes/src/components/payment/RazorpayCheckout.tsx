'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

// Extend window for Razorpay checkout
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  order_id: string
  name: string
  description: string
  image?: string
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color?: string }
  modal?: { ondismiss?: () => void }
  handler: (response: RazorpaySuccessResponse) => void
}

interface RazorpayInstance {
  open: () => void
  on: (event: string, handler: () => void) => void
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface Props {
  orderId: string
  amount: number       // in paise
  currency?: string
  plan: 'monthly' | 'yearly'
  prefill?: { name?: string; email?: string }
  /** Called with raw Razorpay success response — parent should call /api/payment/verify */
  onSuccess: (response: RazorpaySuccessResponse) => void
  /** Called when user dismisses the popup without paying */
  onDismiss?: () => void
  /** Called on load/open errors */
  onError?: (message: string) => void
}

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'

/**
 * RazorpayCheckout
 *
 * Dynamically loads the Razorpay Checkout.js script and opens the
 * payment popup. Designed to be rendered once the order ID is ready.
 *
 * Usage:
 *   const [orderId, setOrderId] = useState<string | null>(null)
 *   {orderId && <RazorpayCheckout orderId={orderId} ... />}
 */
export function RazorpayCheckout({
  orderId,
  amount,
  currency = 'INR',
  plan,
  prefill,
  onSuccess,
  onDismiss,
  onError,
}: Props) {
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const opened = useRef(false)

  // Load checkout.js script once mounted
  useEffect(() => {
    if (document.querySelector(`script[src="${RAZORPAY_SCRIPT}"]`)) {
      setScriptLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = RAZORPAY_SCRIPT
    script.async = true
    script.onload = () => setScriptLoaded(true)
    script.onerror = () => onError?.('Failed to load payment gateway. Check your internet connection.')
    document.body.appendChild(script)
  }, [onError])

  // Open checkout as soon as script is ready
  useEffect(() => {
    if (!scriptLoaded || opened.current) return
    if (!window.Razorpay) {
      onError?.('Razorpay is not available.')
      return
    }

    opened.current = true

    const options: RazorpayOptions = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      amount,
      currency,
      order_id: orderId,
      name: 'Golf Heroes',
      description: `${plan === 'monthly' ? 'Monthly' : 'Yearly'} Subscription`,
      image: '/logo.png',
      prefill: {
        name: prefill?.name || '',
        email: prefill?.email || '',
      },
      theme: { color: '#10b981' }, // emerald-500
      modal: {
        ondismiss: () => {
          onDismiss?.()
        },
      },
      handler: (response: RazorpaySuccessResponse) => {
        onSuccess(response)
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }, [scriptLoaded, orderId, amount, currency, plan, prefill, onSuccess, onDismiss, onError])

  // Show a brief loader while checkout.js is loading
  if (!scriptLoaded) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
        Opening payment gateway…
      </div>
    )
  }

  return null // The popup is controlled entirely by the Razorpay SDK
}
