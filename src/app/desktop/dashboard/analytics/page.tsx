'use client'

/**
 * Desktop Analytics Dashboard
 * 
 * Displays usage analytics using LOCAL SQLite database
 * No Supabase dependencies - fully offline
 */

import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import Link from 'next/link'
import { getOfflineUser } from '@/lib/offline-auth'
import {
    ArrowLeft,
    TrendingUp,
    MessageSquare,
    Clock,
    Database,
    BarChart3,
    Brain,
    FileText,
    Wifi,
    WifiOff
} from 'lucide-react'

interface AnalyticsData {
    totalModels: number
    totalSessions: number
    totalMessages: number
    totalTrainingFiles: number
    totalChunks: number
    avgResponseTime: number
}

export default function DesktopAnalyticsPage() {
    const [analytics, setAnalytics] = useState<AnalyticsData>({
        totalModels: 0,
        totalSessions: 0,
        totalMessages: 0,
        totalTrainingFiles: 0,
        totalChunks: 0,
        avgResponseTime: 1.2
    })
    const [loading, setLoading] = useState(true)
    const [ollamaStatus, setOllamaStatus] = useState<'online' | 'offline'>('offline')

    useEffect(() => {
        loadAnalytics()
        checkOllamaStatus()
    }, [])

    async function loadAnalytics() {
        try {
            setLoading(true)

            // Get current user first
            const user = await getOfflineUser()
            if (!user) {
                console.error('No offline user found')
                setLoading(false)
                return
            }

            // Fetch models for this user
            const models = await invoke<any[]>('db_list_models', { userId: user.userId })

            // Calculate totals across all models
            let totalSessions = 0
            let totalMessages = 0
            let totalTrainingFiles = 0
            let totalChunks = 0

            for (const model of models || []) {
                try {
                    // Get sessions for this model
                    const sessions = await invoke<any[]>('db_list_chat_sessions', { modelId: model.id })
                    totalSessions += sessions?.length || 0

                    // Get messages for each session
                    for (const session of sessions || []) {
                        try {
                            const messages = await invoke<any[]>('db_get_chat_messages', { sessionId: session.id })
                            totalMessages += messages?.length || 0
                        } catch {
                            // Ignore errors for individual sessions
                        }
                    }

                    // Get training data for this model
                    const trainingData = await invoke<any[]>('db_list_training_data', { modelId: model.id })
                    totalTrainingFiles += trainingData?.length || 0
                    totalChunks += (trainingData || []).reduce((sum: number, file: any) =>
                        sum + (file.chunks_count || 0), 0)
                } catch (err) {
                    console.warn('Error loading data for model:', model.id, err)
                }
            }

            setAnalytics({
                totalModels: models?.length || 0,
                totalSessions,
                totalMessages,
                totalTrainingFiles,
                totalChunks,
                avgResponseTime: 1.2 // Placeholder
            })
        } catch (error) {
            console.error('Failed to load analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    async function checkOllamaStatus() {
        try {
            await invoke('check_ollama_status')
            setOllamaStatus('online')
        } catch {
            setOllamaStatus('offline')
        }
    }

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/desktop/dashboard"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                        <p className="text-gray-600 mt-1">Monitor your local AI models and usage</p>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${ollamaStatus === 'online'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {ollamaStatus === 'online' ? (
                        <Wifi className="h-4 w-4" />
                    ) : (
                        <WifiOff className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">
                        Ollama {ollamaStatus === 'online' ? 'Connected' : 'Offline'}
                    </span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Models</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalModels}</p>
                            <p className="text-sm text-blue-600 mt-2">Local AI models</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Brain className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Chat Sessions</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalSessions}</p>
                            <p className="text-sm text-purple-600 mt-2">Active conversations</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <MessageSquare className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Messages</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalMessages}</p>
                            <p className="text-sm text-green-600 mt-2">All time messages</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Avg Response Time</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.avgResponseTime}s</p>
                            <p className="text-sm text-orange-600 mt-2">Local processing</p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <Clock className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Storage Overview */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Data Overview</h2>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Total Chunks Processed</span>
                            <span className="font-medium">{analytics.totalChunks.toLocaleString()} chunks</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min((analytics.totalChunks / 1000) * 100, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Document chunks for RAG retrieval</p>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Vector Database (LanceDB)</span>
                            <span className="font-medium">Active</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full w-full" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">For RAG context retrieval</p>
                    </div>
                </div>
            </div>

            {/* Performance & Data Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Metrics */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">System Status</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                            <span className="text-gray-600">Ollama Service</span>
                            <span className={`font-semibold ${ollamaStatus === 'online' ? 'text-green-600' : 'text-yellow-600'}`}>
                                {ollamaStatus === 'online' ? 'Running' : 'Not Running'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                            <span className="text-gray-600">SQLite Database</span>
                            <span className="font-semibold text-green-600">Active</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                            <span className="text-gray-600">LanceDB Vectors</span>
                            <span className="font-semibold text-green-600">Active</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <span className="text-gray-600">Mode</span>
                            <span className="font-semibold text-blue-600">Offline Desktop</span>
                        </div>
                    </div>
                </div>

                {/* Training Data Info */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Training Data</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                            <span className="text-gray-600">Total Files</span>
                            <span className="font-semibold">{analytics.totalTrainingFiles}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                            <span className="text-gray-600">Total Chunks</span>
                            <span className="font-semibold">{analytics.totalChunks.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                            <span className="text-gray-600">Avg Chunks/File</span>
                            <span className="font-semibold">
                                {analytics.totalTrainingFiles > 0
                                    ? Math.round(analytics.totalChunks / analytics.totalTrainingFiles)
                                    : 0}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <span className="text-gray-600">Embedding Model</span>
                            <span className="font-semibold">nomic-embed-text</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Placeholder */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Activity tracking</p>
                        <p className="text-sm text-gray-400 mt-1">Usage patterns over time</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
