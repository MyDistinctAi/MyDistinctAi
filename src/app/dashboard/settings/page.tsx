/**
 * Main Settings Page
 *
 * Displays settings options and redirects to branding settings
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Settings, Palette, User, Bell, Key, Shield, Brain } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const settingsSections = [
    {
      title: 'AI Model Selection',
      description: 'Choose your preferred AI model for chat (all models are free!)',
      icon: Brain,
      href: '/dashboard/settings/ai-model',
      available: true,
    },
    {
      title: 'Privacy & Data Storage',
      description: 'Choose how your data is stored and processed with pricing tiers',
      icon: Shield,
      href: '/dashboard/settings/privacy',
      available: true,
    },
    {
      title: 'White-Label Branding',
      description: 'Customize your platform\'s appearance with your own logo, colors, and domain',
      icon: Palette,
      href: '/dashboard/settings/branding',
      available: true,
    },
    {
      title: 'Profile Settings',
      description: 'Manage your account information and preferences',
      icon: User,
      href: '/dashboard/settings/profile',
      available: true,
    },
    {
      title: 'Notifications',
      description: 'Configure email and in-app notification preferences',
      icon: Bell,
      href: '/dashboard/settings/notifications',
      available: true,
    },
    {
      title: 'API Keys',
      description: 'Generate and manage API keys for integration',
      icon: Key,
      href: '/dashboard/settings/api-keys',
      available: true,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settingsSections.map((section) => {
            const Icon = section.icon

            if (section.available) {
              return (
                <Link
                  key={section.title}
                  href={section.href}
                  className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {section.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            }

            return (
              <div
                key={section.title}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 opacity-60 cursor-not-allowed relative"
              >
                {section.comingSoon && (
                  <span className="absolute top-4 right-4 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                    Coming Soon
                  </span>
                )}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Icon className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {section.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">
                More settings coming soon
              </h4>
              <p className="text-sm text-blue-700">
                We're actively working on adding more customization options and features.
                Stay tuned for updates!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
