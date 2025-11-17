/**
 * Individual Model API Route
 *
 * Handle GET, update and deletion of specific models
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const supabase = await createClient()
    const { modelId } = await params

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the specific model
    const { data: model, error: dbError } = await supabase
      .from('models')
      .select('*')
      .eq('id', modelId)
      .eq('user_id', user.id)
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch model', details: dbError.message },
        { status: 500 }
      )
    }

    if (!model) {
      return NextResponse.json(
        { error: 'Model not found or unauthorized' },
        { status: 404 }
      )
    }

    // Fetch document counts and names
    const { data: docs, count } = await supabase
      .from('training_data')
      .select('id, file_name, status, file_size, chunk_count, file_type', { count: 'exact' })
      .eq('model_id', modelId)
      .eq('status', 'processed')

    const modelWithDocs = {
      ...model,
      documents: docs || [],
      documentCount: count || 0
    }

    // Return with cache headers for better performance
    return NextResponse.json(modelWithDocs, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
      }
    })
  } catch (error) {
    console.error('Error fetching model:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const supabase = await createClient()
    const { modelId } = await params

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const {
      name,
      description,
      baseModel,
      trainingMode,
      personality,
      learningRate,
      maxContextLength,
      temperature,
      responseLength,
    } = body

    // Validate required fields
    if (!name || !baseModel) {
      return NextResponse.json(
        { error: 'Name and base model are required' },
        { status: 400 }
      )
    }

    // Update model in database
    const { data: model, error: dbError } = await supabase
      .from('models')
      .update({
        name,
        description: description || null,
        base_model: baseModel,
        config: {
          trainingMode,
          personality,
          learningRate,
          maxContextLength,
          temperature,
          responseLength,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', modelId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to update model', details: dbError.message },
        { status: 500 }
      )
    }

    if (!model) {
      return NextResponse.json(
        { error: 'Model not found or unauthorized' },
        { status: 404 }
      )
    }

    return NextResponse.json(model, { status: 200 })
  } catch (error) {
    console.error('Error updating model:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    const supabase = await createClient()
    const { modelId } = await params

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First, get model details to check ownership
    const { data: model, error: fetchError } = await supabase
      .from('models')
      .select('id, user_id')
      .eq('id', modelId)
      .single()

    if (fetchError || !model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    if (model.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this model' },
        { status: 403 }
      )
    }

    // Delete associated training data files first (cascade)
    const { error: trainingDataError } = await supabase
      .from('training_data')
      .delete()
      .eq('model_id', modelId)

    if (trainingDataError) {
      console.error('Error deleting training data:', trainingDataError)
    }

    // Delete associated embeddings
    const { error: embeddingsError } = await supabase
      .from('document_embeddings')
      .delete()
      .eq('model_id', modelId)

    if (embeddingsError) {
      console.error('Error deleting embeddings:', embeddingsError)
    }

    // Delete associated chat sessions
    const { error: sessionsError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('model_id', modelId)

    if (sessionsError) {
      console.error('Error deleting chat sessions:', sessionsError)
    }

    // Finally, delete the model itself
    const { error: deleteError } = await supabase
      .from('models')
      .delete()
      .eq('id', modelId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Database error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete model', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Model deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting model:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
