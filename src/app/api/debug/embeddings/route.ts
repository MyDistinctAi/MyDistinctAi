import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const modelId = searchParams.get('modelId')

        if (!modelId) {
            return NextResponse.json({ error: 'modelId required' }, { status: 400 })
        }

        const supabase = await createClient()
        const adminClient = createAdminClient()

        // Get auth status
        const { data: { user } } = await supabase.auth.getUser()

        // Get embeddings count for this model
        const { count: embeddingCount, error: countError } = await adminClient
            .from('document_embeddings')
            .select('id', { count: 'exact', head: true })
            .eq('model_id', modelId)

        // Get sample embeddings
        const { data: sampleEmbeddings, error: sampleError } = await adminClient
            .from('document_embeddings')
            .select('id, chunk_text, chunk_index, model_id, training_data_id, created_at')
            .eq('model_id', modelId)
            .limit(5)

        // Get training data for this model
        const { data: trainingData, error: trainingError } = await adminClient
            .from('training_data')
            .select('id, file_name, status, processed_at')
            .eq('model_id', modelId)

        // Get model info
        const { data: model, error: modelError } = await adminClient
            .from('models')
            .select('id, name, status, base_model')
            .eq('id', modelId)
            .single()

        return NextResponse.json({
            authenticated: !!user,
            userId: user?.id,
            model,
            modelError: modelError?.message,
            embeddingCount: embeddingCount || 0,
            countError: countError?.message,
            sampleEmbeddings: sampleEmbeddings?.map(e => ({
                id: e.id,
                chunkPreview: e.chunk_text?.substring(0, 100) + '...',
                chunkIndex: e.chunk_index,
                trainingDataId: e.training_data_id,
                createdAt: e.created_at
            })),
            sampleError: sampleError?.message,
            trainingData,
            trainingError: trainingError?.message
        })

    } catch (error) {
        console.error('Debug error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
