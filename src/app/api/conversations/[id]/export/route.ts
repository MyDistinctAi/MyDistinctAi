/**
 * Conversation Export API
 * Export conversation history in various formats
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/conversations/[id]/export?format=json|txt|md
 * Export conversation in specified format
 * Query params:
 * - format: json (default), txt, md
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

    // Get format from query params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    if (!['json', 'txt', 'md'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Supported: json, txt, md' },
        { status: 400 }
      )
    }

    // Get session with model info
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

    const conversationData = {
      ...session,
      messages: messages || [],
    }

    // Format based on requested format
    if (format === 'json') {
      return NextResponse.json(conversationData, {
        headers: {
          'Content-Disposition': `attachment; filename="conversation-${id}.json"`,
        },
      })
    }

    if (format === 'txt') {
      const txtContent = generateTxtExport(conversationData)
      return new NextResponse(txtContent, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="conversation-${id}.txt"`,
        },
      })
    }

    if (format === 'md') {
      const mdContent = generateMarkdownExport(conversationData)
      return new NextResponse(mdContent, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="conversation-${id}.md"`,
        },
      })
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
  } catch (error) {
    console.error('GET /api/conversations/[id]/export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Generate plain text export
 */
function generateTxtExport(conversation: any): string {
  const lines: string[] = []

  lines.push(`Title: ${conversation.title}`)
  lines.push(`Model: ${conversation.models?.name || 'Unknown'}`)
  lines.push(`Date: ${new Date(conversation.created_at).toLocaleString()}`)
  lines.push('='.repeat(80))
  lines.push('')

  for (const msg of conversation.messages) {
    const timestamp = new Date(msg.created_at).toLocaleTimeString()
    const role = msg.role === 'user' ? 'You' : 'AI'
    lines.push(`[${timestamp}] ${role}:`)
    lines.push(msg.content)
    lines.push('')
    lines.push('-'.repeat(80))
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Generate Markdown export
 */
function generateMarkdownExport(conversation: any): string {
  const lines: string[] = []

  lines.push(`# ${conversation.title}`)
  lines.push('')
  lines.push(`**Model:** ${conversation.models?.name || 'Unknown'} (${conversation.models?.base_model || 'N/A'})`)
  lines.push(`**Date:** ${new Date(conversation.created_at).toLocaleString()}`)
  lines.push(`**Messages:** ${conversation.messages.length}`)
  lines.push('')
  lines.push('---')
  lines.push('')

  for (const msg of conversation.messages) {
    const timestamp = new Date(msg.created_at).toLocaleTimeString()
    const role = msg.role === 'user' ? '**You**' : '**AI Assistant**'
    lines.push(`### ${role} _(${timestamp})_`)
    lines.push('')
    lines.push(msg.content)
    lines.push('')
  }

  lines.push('---')
  lines.push('')
  lines.push(`_Exported from MyDistinctAI on ${new Date().toLocaleString()}_`)

  return lines.join('\n')
}
