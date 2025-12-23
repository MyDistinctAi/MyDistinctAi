/**
 * Training Data API - List training documents for a model
 * GET /api/training/data?modelId=xxx&status=processed
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        // Allow unauthenticated in development
        const isDev = process.env.NODE_ENV === 'development'

        if (!isDev && (authError || !user)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get query params
        const { searchParams } = new URL(request.url)
        const modelId = searchParams.get('modelId')
        const status = searchParams.get('status')

        if (!modelId) {
            return NextResponse.json({ error: 'modelId is required' }, { status: 400 })
        }

        console.log('[TRAINING/DATA] Fetching training data:', { modelId, status })

        // DEBUG: First get ALL documents for this model (regardless of status)
        const { data: allDocs } = await supabase
            .from('training_data')
            .select('id, file_name, status, model_id')
            .eq('model_id', modelId)

        console.log('[TRAINING/DATA] DEBUG - All docs for model:', JSON.stringify(allDocs, null, 2))

        // Build query
        let query = supabase
            .from('training_data')
            .select('*')
            .eq('model_id', modelId)
            .order('created_at', { ascending: false })

        // Filter by status if provided
        if (status) {
            query = query.eq('status', status)
        }

        const { data, error } = await query

        if (error) {
            console.error('[TRAINING/DATA] Database error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        console.log('[TRAINING/DATA] Found:', data?.length || 0, 'documents')

        return NextResponse.json(data || [])

    } catch (error: any) {
        console.error('[TRAINING/DATA] Error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
