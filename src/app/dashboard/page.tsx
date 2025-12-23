/**
 * Dashboard Home Page
 *
 * Overview page showing key metrics and quick actions
 */

import { createClient } from '@/lib/supabase/server'
import { Brain, Database, MessageSquare, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { getUserUsage, shouldSendNudge } from '@/lib/usage-tracking'
import { UsageNudge, UsageWidget } from '@/components/dashboard/UsageNudge'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user!.id)
    .single()

  // Get actual counts from database
  const { count: modelCount } = await supabase
    .from('models')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  // Get training data count for user's models
  const { data: userModels } = await supabase
    .from('models')
    .select('id')
    .eq('user_id', user!.id)

  const modelIds = userModels?.map((m) => m.id) || []

  const { count: dataCount } = modelIds.length > 0
    ? await supabase
      .from('training_data')
      .select('*', { count: 'exact', head: true })
      .in('model_id', modelIds)
    : { count: 0 }

  const { count: chatCount } = await supabase
    .from('chat_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  const stats = [
    { name: 'My Models', value: modelCount ?? 0, icon: Brain, href: '/dashboard/models', color: 'blue' },
    { name: 'Training Data', value: dataCount ?? 0, icon: Database, href: '/dashboard/data', color: 'green' },
    { name: 'Chat Sessions', value: chatCount ?? 0, icon: MessageSquare, href: '/dashboard/chat', color: 'purple' },
    { name: 'Performance', value: '98%', icon: TrendingUp, href: '#', color: 'orange' },
  ]

  // Get usage statistics (may fail if offline - handle gracefully)
  let usage = null
  let nudge = null
  try {
    usage = await getUserUsage(user!.id)
    nudge = usage ? shouldSendNudge(usage) : null
  } catch (error) {
    console.log('⚠️ Could not fetch usage data (offline mode?):', error)
    // Continue without usage data in offline mode
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {profile?.name || user?.email}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Here's what's happening with your AI models today.
        </p>
      </div>

      {/* Usage Nudge - Display if needed */}
      {nudge && usage && (
        <UsageNudge
          nudge={nudge}
          tokensUsed={usage.tokensUsed}
          monthlyCap={usage.monthlyCap}
        />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-md bg-${stat.color}-100`}>
                      <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Usage Widget and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Widget */}
        {usage && (
          <div className="lg:col-span-1">
            <UsageWidget
              tokensUsed={usage.tokensUsed}
              monthlyCap={usage.monthlyCap}
              planName={usage.planName}
              showUpgrade={true}
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className={`bg-white dark:bg-gray-800 shadow rounded-lg p-6 ${usage ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/dashboard/models"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="text-center">
                <Brain className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                <h3 className="text-sm font-medium text-gray-900">Create New Model</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Train a custom AI model
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard/data"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <div className="text-center">
                <Database className="mx-auto h-8 w-8 text-green-600 mb-2" />
                <h3 className="text-sm font-medium text-gray-900">Upload Data</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Add training documents
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard/chat"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <div className="text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-purple-600 mb-2" />
                <h3 className="text-sm font-medium text-gray-900">Start Chat</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Talk to your AI models
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 shadow rounded-lg p-6 text-white">
        <h2 className="text-lg font-semibold mb-2">Getting Started</h2>
        <p className="text-blue-100 mb-4">
          Ready to build your first AI model? Start by uploading your training data.
        </p>
        <Link
          href="/dashboard/docs"
          className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
        >
          View Documentation
          <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
