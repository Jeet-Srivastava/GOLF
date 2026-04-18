import Razorpay from 'razorpay'

/**
 * Singleton Razorpay server instance.
 * Loaded lazily so missing keys don't crash at import time.
 */
let razorpay: Razorpay | null = null

export function getRazorpay(): Razorpay {
  if (!razorpay) {
    const key_id = process.env.RAZORPAY_KEY_ID
    const key_secret = process.env.RAZORPAY_KEY_SECRET

    if (!key_id || !key_secret) {
      throw new Error('Razorpay credentials are not configured.')
    }

    razorpay = new Razorpay({ key_id, key_secret })
  }
  return razorpay
}

/**
 * Convert a pence/cents amount to Razorpay paise (INR * 100).
 * Uses a fixed GBP→INR rate for test mode.
 * In production, use a live forex API.
 */
const GBP_TO_INR = 107 // 1 GBP ≈ ₹107

export function gbpPenceToINRPaise(pence: number): number {
  const gbp = pence / 100
  const inr = gbp * GBP_TO_INR
  return Math.round(inr * 100) // paise
}

export function paiseToCurrency(paise: number, currency = 'INR'): string {
  const amount = paise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Plan to paise conversion (INR equivalent of £9.99 and £89.99) */
export const PLAN_PRICES_PAISE: Record<'monthly' | 'yearly', number> = {
  monthly: gbpPenceToINRPaise(999),  // £9.99 → ~₹1069
  yearly: gbpPenceToINRPaise(8999),  // £89.99 → ~₹9629
}
