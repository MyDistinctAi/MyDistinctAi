/**
 * Individual Conversation API
 * Manages a specific conversation by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/conversations/[id]
 * Get conversation details with full message history
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get session
    const { data: session, error: sessionError } = await supabase
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
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Get all messages
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Failed to fetch messages:', messagesError)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...session,
      messages: messages || [],
    })
  } catch (error) {
    console.error('GET /api/conversations/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/conversations/[id]
 * Update conversation (rename title)
 * Body: { title: string }
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'title is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Update session
    const { data: session, error: updateError } = await supabase
      .from('chat_sessions')
      .update({
        title: title.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError || !session) {
      console.error('Failed to update conversation:', updateError)
      return NextResponse.json(
        { error: 'Failed to update conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('PATCH /api/conversations/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/conversations/[id]
 * Delete a conversation and all its messages
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify ownership
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Delete messages first (due to foreign key constraint)
    const { error: messagesError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', id)

    if (messagesError) {
      console.error('Failed to delete messages:', messagesError)
      return NextResponse.json(
        { error: 'Failed to delete conversation messages' },
        { status: 500 }
      )
    }

    // Delete session
    const { error: deleteError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Failed to delete session:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully',
    })
  } catch (error) {
    console.error('DELETE /api/conversations/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
