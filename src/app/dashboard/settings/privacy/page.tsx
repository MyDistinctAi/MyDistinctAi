/**
 * Privacy Settings Page
 * Displays privacy tiers with pricing and data storage options
 */

import { createClient } from '@/lib/supabase/server'
import { Shield, Server, Cloud, Lock, Check, X } from 'lucide-react'
import Link from 'next/link'
import { getAllPlans } from '@/lib/usage-tracking'

export const dynamic = 'force-dynamic'

export default async function PrivacySettingsPage() {
  const supabase = await createClient()

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get current subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user!.id)
    .eq('status', 'active')
    .single()

  // Get all plans with pricing
  const plans = await getAllPlans()

  const privacyTiers = [
    {
      id: 'local',
      name: 'Local-First',
      icon: Server,
      color: 'primary',
      description: 'Your data never leaves your device',
      features: [
        'All processing on-device',
        'No cloud storage',
        'AES-256 encryption at rest',
        'Zero data sent to external servers',
        'Offline-capable',
        'Full data control'
      ],
      notIncluded: [
        'Cloud sync',
        'Multi-device access',
        'Automatic backups'
      ],
      availability: 'Desktop App',
      plan: plans.find(p => p.plan_name === 'professional'),
    },
    {
      id: 'hybrid',
      name: 'Hybrid Cloud',
      icon: Cloud,
      color: 'blue',
      description: 'Best of both worlds - local + secure cloud',
      features: [
        'Local processing option',
        'Encrypted cloud storage',
        'End-to-end encryption',
        'GDPR/HIPAA compliant',
        'Multi-device sync',
        'Automatic encrypted backups',
        'Data residency options',
      ],
      notIncluded: [],
      availability: 'Web App + Desktop',
      plan: plans.find(p => p.plan_name === 'professional'),
    },
    {
      id: 'enterprise',
      name: 'Self-Hosted',
      icon: Lock,
      color: 'purple',
      description: 'Deploy on your own infrastructure',
      features: [
        'Complete infrastructure control',
        'On-premise deployment',
        'Custom security policies',
        'Air-gapped environments',
        'Compliance certification support',
        'Custom data retention',
        'Advanced audit logging',
        'SSO/LDAP integration',
      ],
      notIncluded: [],
      availability: 'Enterprise',
      plan: plans.find(p => p.plan_name === 'enterprise'),
    },
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Privacy & Data Storage
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Choose how your data is stored and processed. All options include enterprise-grade encryption.
        </p>
      </div>

      {/* Current Plan */}
      {subscription && (
        <div className="bg-primary-50 dark:bg-primary-950/20 border-2 border-primary-200 dark:border-primary-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <div>
              <h3 className="font-semibold text-primary-900 dark:text-primary-100">
                Current Plan: {subscription.plan_type?.toUpperCase()}
              </h3>
              <p className="text-sm text-primary-700 dark:text-primary-300">
                Your data is encrypted and secure. Learn more about your privacy options below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Tiers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {privacyTiers.map((tier) => {
          const Icon = tier.icon
          const isCurrentPlan = subscription?.plan_type === tier.plan?.plan_name

          return (
            <div
              key={tier.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 transition-all ${
                isCurrentPlan
                  ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
              }`}
            >
              {/* Header */}
              <div className={`p-6 border-b border-gray-200 dark:border-gray-700 ${
                tier.color === 'primary' ? 'bg-primary-50 dark:bg-primary-950/20' :
                tier.color === 'blue' ? 'bg-blue-50 dark:bg-blue-950/20' :
                'bg-purple-50 dark:bg-purple-950/20'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-3 rounded-lg ${
                    tier.color === 'primary' ? 'bg-primary-100 dark:bg-primary-900/30' :
                    tier.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    'bg-purple-100 dark:bg-purple-900/30'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      tier.color === 'primary' ? 'text-primary-600 dark:text-primary-400' :
                      tier.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                      'text-purple-600 dark:text-purple-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {tier.name}
                    </h3>
                    {isCurrentPlan && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200">
                        Current
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tier.description}
                </p>
              </div>

              {/* Features */}
              <div className="p-6 space-y-4">
                {/* Included Features */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Included:
                  </h4>
                  <ul className="space-y-2">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Not Included */}
                {tier.notIncluded.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Not included:
                    </h4>
                    <ul className="space-y-2">
                      {tier.notIncluded.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Availability */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    AVAILABILITY
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {tier.availability}
                  </div>
                </div>
              </div>

              {/* Pricing Footer */}
              <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                {tier.plan ? (
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        ${tier.plan.price_monthly.toFixed(0)}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        /month
                      </span>
                    </div>

                    {/* Token Cap */}
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {tier.plan.monthly_token_cap === -1 ? (
                        <span className="font-medium text-primary-600 dark:text-primary-400">
                          Unlimited tokens
                        </span>
                      ) : (
                        <>
                          <span className="font-medium">
                            {(tier.plan.monthly_token_cap / 1000).toFixed(0)}K tokens
                          </span>{' '}
                          per month
                        </>
                      )}
                    </div>

                    {/* CTA Button */}
                    {!isCurrentPlan && (
                      <Link
                        href="/pricing"
                        className="block w-full text-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-md transition-colors"
                      >
                        Upgrade to {tier.plan.plan_name}
                      </Link>
                    )}

                    {isCurrentPlan && (
                      <button
                        disabled
                        className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm font-medium rounded-md cursor-not-allowed"
                      >
                        Current Plan
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      Contact Sales
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Custom pricing for enterprise needs
                    </p>
                    <Link
                      href="mailto:sales@mydistinctai.com"
                      className="block w-full text-center px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-md transition-colors"
                    >
                      Contact Sales
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Security Standards */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Security Standards & Compliance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Encryption
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• AES-256 encryption at rest</li>
              <li>• TLS 1.3 for data in transit</li>
              <li>• End-to-end encryption option</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Compliance
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• GDPR compliant</li>
              <li>• HIPAA compliant</li>
              <li>• SOC 2 Type II (in progress)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Data Rights
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Right to access your data</li>
              <li>• Right to deletion</li>
              <li>• Data portability</li>
            </ul>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              Can I switch between privacy tiers?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              What happens to my data if I cancel?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You can export all your data before cancellation. Data is retained for 30 days after cancellation, then permanently deleted.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              Is my data used to train AI models?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Never.</strong> Your data is never used to train third-party AI models. Your models are trained only on data you explicitly upload.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
