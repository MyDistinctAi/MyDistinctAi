/**
 * Stripe Configuration
 *
 * Pricing plans and product configuration
 */

export interface PricingPlan {
  id: string
  name: string
  description: string
  price: number
  priceId: string // Stripe Price ID
  features: string[]
  limitations?: string[]
  popular?: boolean
  cta: string
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for individuals getting started',
    price: 29,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || '',
    features: [
      '3 custom AI models',
      '10GB storage',
      'Email support',
      'Web app access',
      'Basic analytics',
      'Community support',
    ],
    limitations: [
      'No white-label branding',
      'No API access',
      'No desktop app',
    ],
    cta: 'Get Started',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For professionals and small teams',
    price: 99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || '',
    popular: true,
    features: [
      'Unlimited AI models',
      '100GB storage',
      'Priority support',
      'White-label branding',
      'Full API access',
      'Desktop app',
      'Advanced analytics',
      'Custom domains',
      'Export chat history',
    ],
    cta: 'Start Free Trial',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with custom needs',
    price: 0, // Custom pricing
    priceId: '', // No price ID for custom
    features: [
      'Everything in Professional',
      'Self-hosting support',
      'Dedicated support engineer',
      'Custom integrations',
      'SLA guarantees',
      'On-premise deployment',
      'Advanced security features',
      'Custom training support',
      'Unlimited storage',
    ],
    cta: 'Contact Sales',
  },
]

/**
 * Get Stripe server instance (server-side)
 */
export const getStripeServer = async () => {
  const Stripe = (await import('stripe')).default

  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error('Stripe secret key is not set')
  }

  return new Stripe(secretKey, {
    apiVersion: '2024-11-20.acacia',
    typescript: true,
  })
}
