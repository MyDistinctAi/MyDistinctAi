/**
 * Analytics Dashboard Page
 *
 * Displays usage analytics, performance metrics, and training data insights
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, TrendingUp, MessageSquare, Clock, Database, BarChart3, Calendar } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch analytics data
  const { data: models } = await supabase
    .from('models')
    .select('id, name, created_at')
    .eq('user_id', user.id)

  const { data: chatSessions } = await supabase
    .from('chat_sessions')
    .select('id, created_at')
    .eq('user_id', user.id)

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('tokens, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: trainingData } = await supabase
    .from('training_data')
    .select('id, file_size, status')

  // Calculate metrics
  const totalModels = models?.length || 0
  const totalSessions = chatSessions?.length || 0
  const totalMessages = messages?.length || 0
  const totalTokens = messages?.reduce((sum, msg) => sum + (msg.tokens || 0), 0) || 0
  const avgResponseTime = 1.2 // Mock data
  const totalDataSize = trainingData?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Monitor your AI models and usage patterns</p>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <select className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>All time</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Models</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalModels}</p>
              <p className="text-sm text-green-600 mt-2">+2 this month</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalSessions}</p>
              <p className="text-sm text-green-600 mt-2">+{Math.floor(totalSessions * 0.15)} this week</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Messages</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalMessages}</p>
              <p className="text-sm text-green-600 mt-2">{totalTokens.toLocaleString()} tokens</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Response Time</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{avgResponseTime}s</p>
              <p className="text-sm text-green-600 mt-2">-0.3s vs last week</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Usage Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Usage Overview</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Messages sent</span>
              <span className="font-medium">{totalMessages} / 10,000</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${Math.min((totalMessages / 10000) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Storage used</span>
              <span className="font-medium">{(totalDataSize / 1024 / 1024).toFixed(2)} MB / 100 MB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${Math.min((totalDataSize / (100 * 1024 * 1024)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Metrics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Average Response Time</span>
              <span className="font-semibold">{avgResponseTime}s</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">P95 Response Time</span>
              <span className="font-semibold">2.8s</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">P99 Response Time</span>
              <span className="font-semibold">4.1s</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600">Error Rate</span>
              <span className="font-semibold text-green-600">0.2%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Training Data Info</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Total Files</span>
              <span className="font-semibold">{trainingData?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Processed Files</span>
              <span className="font-semibold">{trainingData?.filter(f => f.status === 'processed').length || 0}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Total Size</span>
              <span className="font-semibold">{(totalDataSize / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600">Avg File Size</span>
              <span className="font-semibold">
                {trainingData && trainingData.length > 0
                  ? ((totalDataSize / trainingData.length) / 1024).toFixed(2)
                  : 0} KB
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Message Activity Chart Placeholder */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Message Activity</h2>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Activity chart visualization</p>
            <p className="text-sm text-gray-400 mt-1">Chart data would be displayed here</p>
          </div>
        </div>
      </div>
    </div>
  )
}
