/**
 * Desktop Training Data Service
 * Manages training data and document uploads using local storage
 */

import { invoke } from '@tauri-apps/api/core'

export interface TrainingData {
    id: string
    model_id: string
    file_name: string
    file_path: string
    file_type: string
    chunks_count: number
    created_at: string
}

export interface NewTrainingData {
    model_id: string
    file_name: string
    file_path: string
    file_type: string
    chunks_count: number
}

/**
 * Add training data record to database
 */
export async function addTrainingData(data: NewTrainingData): Promise<TrainingData> {
    try {
        return await invoke('db_add_training_data', { data })
    } catch (error) {
        console.error('Failed to add training data:', error)
        throw new Error(error as string)
    }
}

/**
 * List all training data for a model
 */
export async function listTrainingData(modelId: string): Promise<TrainingData[]> {
    try {
        return await invoke('db_list_training_data', { modelId })
    } catch (error) {
        console.error('Failed to list training data:', error)
        throw new Error(error as string)
    }
}

/**
 * Delete training data
 */
export async function deleteTrainingData(id: string): Promise<void> {
    try {
        await invoke('db_delete_training_data', { id })
    } catch (error) {
        console.error('Failed to delete training data:', error)
        throw new Error(error as string)
    }
}

/**
 * Process and store a file (complete workflow)
 * Extract text, chunk it, generate embeddings, store in LanceDB
 */
export async function processAndStoreFile(params: {
    modelId: string
    filePath: string
    fileName: string
    embeddingModel: string
    chunkSize?: number
    overlap?: number
    encrypt?: boolean
    password?: string | null
}): Promise<{
    chunks_processed: number
    chunks_stored: number
    total_chars: number
}> {
    try {
        const result = await invoke('process_and_store_file', {
            modelId: params.modelId,
            filePath: params.filePath,
            fileName: params.fileName,
            embeddingModel: params.embeddingModel,
            chunkSize: params.chunkSize || 500,
            overlap: params.overlap || 50,
            encrypt: params.encrypt || false,
            password: params.password || null,
        })

        // After successful processing, add record to database
        await addTrainingData({
            model_id: params.modelId,
            file_name: params.fileName,
            file_path: params.filePath,
            file_type: params.fileName.split('.').pop() || 'unknown',
            chunks_count: (result as any).chunks_processed,
        })

        return result as any
    } catch (error) {
        console.error('Failed to process and store file:', error)
        throw new Error(error as string)
    }
}
