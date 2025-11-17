/**
 * Models API Route
 *
 * Handle model creation and management
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

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

    // Create model in database
    const { data: model, error: dbError } = await supabase
      .from('models')
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        base_model: baseModel,
        status: 'ready',
        training_progress: 100,
        config: {
          trainingMode,
          personality,
          learningRate,
          maxContextLength,
          temperature,
          responseLength,
        },
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create model', details: dbError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(model, { status: 201 })
  } catch (error) {
    console.error('Error creating model:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all models for the user
    const { data: models, error: dbError } = await supabase
      .from('models')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch models', details: dbError.message },
        { status: 500 }
      )
    }

    // Return with cache headers for better performance
    return NextResponse.json(models, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
      }
    })
  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
