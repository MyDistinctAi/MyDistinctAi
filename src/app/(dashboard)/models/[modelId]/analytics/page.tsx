/**
 * Model Analytics Dashboard Page
 *
 * Displays comprehensive analytics for a specific model including:
 * - Usage statistics and trends
 * - Performance metrics
 * - Training data information
 */

'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  TrendingUp,
  MessageSquare,
  Clock,
  Database,
  Users,
  Zap,
  Download,
} from 'lucide-react'

interface AnalyticsData {
  model: {
    id: string
    name: string
    status: string
    trainingProgress: number
    createdAt: string
  }
  usage: {
    totalSessions: number
    totalMessages: number
    avgMessagesPerSession: number
    userMessages: number
    assistantMessages: number
    timeline: Array<{ date: string; messages: number }>
  }
  performance: {
    avgResponseTime: number
    p95ResponseTime: number
    p99ResponseTime: number
    totalTokens: number
    avgTokensPerMessage: number
  }
  training: {
    totalFiles: number
    processedFiles: number
    totalSize: number
    datasetSizeMB: number
  }
  dateRange: {
    start: string
    end: string
    days: number
  }
}

export default function ModelAnalyticsPage({
  params,
}: {
  params: Promise<{ modelId: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<7 | 30 | 90>(30)

  useEffect(() => {
    fetchAnalytics()
  }, [resolvedParams.modelId, dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/models/${resolvedParams.modelId}/analytics?days=${dateRange}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const exportData = () => {
    if (!analytics) return

    const csv = [
      ['Metric', 'Value'],
      ['Total Sessions', analytics.usage.totalSessions],
      ['Total Messages', analytics.usage.totalMessages],
      ['Avg Messages/Session', analytics.usage.avgMessagesPerSession],
      ['Avg Response Time (ms)', analytics.performance.avgResponseTime],
      ['Total Tokens', analytics.performance.totalTokens],
      ['Training Files', analytics.training.totalFiles],
      ['Dataset Size (MB)', analytics.training.datasetSizeMB],
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${analytics.model.name}-analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Failed to load analytics'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Models
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {analytics.model.name}
            </h1>
            <p className="text-gray-600 mt-1">Model Analytics Dashboard</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value) as 7 | 30 | 90)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>

            {/* Export Button */}
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-5 w-5" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Sessions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {analytics.usage.totalSessions}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total Messages */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Messages</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {analytics.usage.totalMessages}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Avg Response Time */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {analytics.performance.avgResponseTime}
                  <span className="text-lg text-gray-600 ml-1">ms</span>
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Total Tokens */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tokens</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {(analytics.performance.totalTokens / 1000).toFixed(1)}
                  <span className="text-lg text-gray-600 ml-1">K</span>
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Usage Overview */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Usage Overview
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    Avg Messages per Session
                  </span>
                  <span className="font-semibold text-gray-900">
                    {analytics.usage.avgMessagesPerSession}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(analytics.usage.avgMessagesPerSession * 10, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">User Messages</span>
                  <span className="font-semibold text-gray-900">
                    {analytics.usage.userMessages}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${(analytics.usage.userMessages / analytics.usage.totalMessages) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">AI Messages</span>
                  <span className="font-semibold text-gray-900">
                    {analytics.usage.assistantMessages}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${(analytics.usage.assistantMessages / analytics.usage.totalMessages) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              Performance Metrics
            </h2>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    Average Response Time
                  </span>
                  <span className="font-semibold text-gray-900">
                    {analytics.performance.avgResponseTime}ms
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">P95 Response Time</span>
                  <span className="font-semibold text-gray-900">
                    {analytics.performance.p95ResponseTime}ms
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">P99 Response Time</span>
                  <span className="font-semibold text-gray-900">
                    {analytics.performance.p99ResponseTime}ms
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    Avg Tokens per Message
                  </span>
                  <span className="font-semibold text-gray-900">
                    {analytics.performance.avgTokensPerMessage}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Timeline */}
        {analytics.usage.timeline.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              Message Activity
            </h2>

            <div className="h-64 flex items-end justify-between gap-2">
              {analytics.usage.timeline.map((point) => {
                const maxMessages = Math.max(
                  ...analytics.usage.timeline.map((p) => p.messages)
                )
                const height = (point.messages / maxMessages) * 100

                return (
                  <div
                    key={point.date}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <div className="relative group flex-1 w-full flex items-end">
                      <div
                        className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                        style={{ height: `${height}%` }}
                        title={`${point.messages} messages`}
                      />
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {point.messages} messages
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 transform rotate-45 origin-left mt-8">
                      {new Date(point.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Training Data Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Database className="h-5 w-5 text-orange-600" />
            Training Data
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Total Files</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {analytics.training.totalFiles}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Processed Files</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {analytics.training.processedFiles}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Dataset Size</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {analytics.training.datasetSizeMB} MB
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Processing Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {analytics.training.totalFiles > 0
                  ? Math.round(
                      (analytics.training.processedFiles /
                        analytics.training.totalFiles) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>

          {analytics.training.totalFiles > 0 && (
            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-orange-600 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${(analytics.training.processedFiles / analytics.training.totalFiles) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
