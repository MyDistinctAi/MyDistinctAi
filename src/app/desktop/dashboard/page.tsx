'use client'

/**
 * Desktop Dashboard Home Page
 * Offline version using local database via Tauri
 */

import { useEffect, useState } from 'react'
import { Brain, Database, MessageSquare, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { getOfflineUser, type OfflineUser } from '@/lib/offline-auth'
import { listModels } from '@/lib/desktop/models-service'
import { listTrainingData } from '@/lib/desktop/training-data-service'
import { listChatSessions } from '@/lib/desktop/chat-service'

export default function DesktopDashboardPage() {
    const [user, setUser] = useState<OfflineUser | null>(null)
    const [modelCount, setModelCount] = useState(0)
    const [dataCount, setDataCount] = useState(0)
    const [chatCount, setChatCount] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            try {
                const offlineUser = await getOfflineUser()
                if (offlineUser) {
                    setUser(offlineUser)

                    // Load counts from local database
                    const models = await listModels(offlineUser.userId)
                    setModelCount(models.length)

                    // Get training data count across all models
                    let totalDataCount = 0
                    for (const model of models) {
                        const data = await listTrainingData(model.id)
                        totalDataCount += data.length
                    }
                    setDataCount(totalDataCount)

                    // Get chat sessions count across all models
                    let totalChatCount = 0
                    for (const model of models) {
                        const sessions = await listChatSessions(model.id)
                        totalChatCount += sessions.length
                    }
                    setChatCount(totalChatCount)
                }
            } catch (error) {
                console.error('Failed to load dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    const stats = [
        { name: 'My Models', value: modelCount, icon: Brain, href: '/desktop/dashboard/models', color: 'blue' },
        { name: 'Training Data', value: dataCount, icon: Database, href: '/desktop/dashboard/data', color: 'green' },
        { name: 'Chat Sessions', value: chatCount, icon: MessageSquare, href: '/desktop/dashboard/chat', color: 'purple' },
        { name: 'Performance', value: '100%', icon: TrendingUp, href: '#', color: 'orange' },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user?.name}!
                </h1>
                <p className="text-gray-600 mt-1">
                    Here's what's happening with your AI models today.
                </p>
            </div>

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

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Link
                        href="/desktop/dashboard/models"
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
                        href="/desktop/dashboard/data"
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
                        href="/desktop/dashboard/chat"
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

            {/* Getting Started */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 shadow rounded-lg p-6 text-white">
                <h2 className="text-lg font-semibold mb-2">Getting Started</h2>
                <p className="text-blue-100 mb-4">
                    Ready to build your first AI model? Start by creating a model and uploading training data.
                </p>
                <Link
                    href="/desktop/dashboard/models"
                    className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
                >
                    Create Your First Model
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>
        </div>
    )
}
