/**
 * Stripe Client Configuration
 *
 * Handles Stripe client initialization for both client and server
 */

import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>

/**
 * Get Stripe client instance (client-side)
 */
export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

    if (!publishableKey) {
      console.error('Stripe publishable key is not set')
      return null
    }

    stripePromise = loadStripe(publishableKey)
  }

  return stripePromise
}
