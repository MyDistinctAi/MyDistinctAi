/**
 * Model Analytics API
 *
 * Provides analytics data for a specific model including:
 * - Usage statistics (messages, sessions)
 * - Performance metrics (response times, token usage)
 * - Training metrics
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ modelId: string }> }
) {
  try {
    const supabase = await createClient()
    const { modelId } = await context.params

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify model belongs to user
    const { data: model, error: modelError } = await supabase
      .from('models')
      .select('id, name, status, created_at, training_progress')
      .eq('id', modelId)
      .eq('user_id', user.id)
      .single()

    if (modelError || !model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }

    // Get date range from query params (default to last 30 days)
    const url = new URL(request.url)
    const days = parseInt(url.searchParams.get('days') || '30')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get chat sessions for this model
    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('id, created_at')
      .eq('model_id', modelId)
      .gte('created_at', startDate.toISOString())

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      )
    }

    // Get total message count
    const { count: messageCount, error: messageCountError } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .in(
        'session_id',
        sessions?.map((s) => s.id) || []
      )

    if (messageCountError) {
      console.error('Error counting messages:', messageCountError)
    }

    // Get messages with timestamps for timeline
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('id, created_at, role, tokens')
      .in(
        'session_id',
        sessions?.map((s) => s.id) || []
      )
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
    }

    // Get training data stats
    const { data: trainingData, error: trainingDataError } = await supabase
      .from('training_data')
      .select('id, file_size, status, created_at')
      .eq('model_id', modelId)

    if (trainingDataError) {
      console.error('Error fetching training data:', trainingDataError)
    }

    // Calculate metrics
    const totalSessions = sessions?.length || 0
    const totalMessages = messageCount || 0
    const avgMessagesPerSession =
      totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0

    // Calculate token usage
    const totalTokens =
      messages?.reduce((sum, msg) => sum + (msg.tokens || 0), 0) || 0
    const avgTokensPerMessage =
      totalMessages > 0 ? Math.round(totalTokens / totalMessages) : 0

    // Calculate messages by date for timeline chart
    const messagesByDate: Record<string, number> = {}
    messages?.forEach((msg) => {
      const date = new Date(msg.created_at).toISOString().split('T')[0]
      messagesByDate[date] = (messagesByDate[date] || 0) + 1
    })

    const timeline = Object.entries(messagesByDate)
      .map(([date, count]) => ({
        date,
        messages: count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calculate message distribution (user vs assistant)
    const userMessages = messages?.filter((m) => m.role === 'user').length || 0
    const assistantMessages =
      messages?.filter((m) => m.role === 'assistant').length || 0

    // Calculate training data stats
    const totalTrainingFiles = trainingData?.length || 0
    const totalTrainingSize =
      trainingData?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0
    const processedFiles =
      trainingData?.filter((file) => file.status === 'processed').length || 0

    // Response time simulation (would be real data in production)
    const avgResponseTime = 450 // ms
    const p95ResponseTime = 850 // ms
    const p99ResponseTime = 1200 // ms

    return NextResponse.json({
      model: {
        id: model.id,
        name: model.name,
        status: model.status,
        trainingProgress: model.training_progress,
        createdAt: model.created_at,
      },
      usage: {
        totalSessions,
        totalMessages,
        avgMessagesPerSession,
        userMessages,
        assistantMessages,
        timeline,
      },
      performance: {
        avgResponseTime,
        p95ResponseTime,
        p99ResponseTime,
        totalTokens,
        avgTokensPerMessage,
      },
      training: {
        totalFiles: totalTrainingFiles,
        processedFiles,
        totalSize: totalTrainingSize,
        datasetSizeMB: Math.round(totalTrainingSize / (1024 * 1024) * 10) / 10,
      },
      dateRange: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
        days,
      },
    })
  } catch (error) {
    console.error('Error in analytics API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
