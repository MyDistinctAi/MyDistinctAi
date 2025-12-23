/**
 * Conversations API
 * Manages chat sessions and conversation history
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/conversations
 * List all conversations for the authenticated user
 * Query params:
 * - modelId: Filter by model (optional)
 * - limit: Number of conversations to return (default: 50)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const modelId = searchParams.get('modelId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('chat_sessions')
      .select(`
        id,
        model_id,
        title,
        created_at,
        updated_at,
        models (
          name,
          base_model
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by model if specified
    if (modelId) {
      query = query.eq('model_id', modelId)
    }

    const { data: sessions, error: sessionsError } = await query

    if (sessionsError) {
      console.error('Failed to fetch conversations:', sessionsError)
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      )
    }

    // Get message count for each session
    const sessionsWithCounts = await Promise.all(
      (sessions || []).map(async (session) => {
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id)

        return {
          ...session,
          messageCount: count || 0,
        }
      })
    )

    return NextResponse.json({
      conversations: sessionsWithCounts,
      total: sessionsWithCounts.length,
      limit,
      offset,
    })
  } catch (error) {
    console.error('GET /api/conversations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/conversations
 * Create a new conversation session
 * Body: { modelId: string, title?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { modelId, title = 'New Chat' } = body

    if (!modelId) {
      return NextResponse.json(
        { error: 'modelId is required' },
        { status: 400 }
      )
    }

    // Verify model exists and belongs to user
    const { data: model, error: modelError } = await supabase
      .from('models')
      .select('id')
      .eq('id', modelId)
      .eq('user_id', user.id)
      .single()

    if (modelError || !model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    // Create new session
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .insert({
        model_id: modelId,
        user_id: user.id,
        title,
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Failed to create session:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('POST /api/conversations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
