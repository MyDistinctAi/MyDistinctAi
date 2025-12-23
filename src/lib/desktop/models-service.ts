/**
 * Desktop Models Service
 * Manages AI model data using local SQLite database via Tauri
 */

import { invoke } from '@tauri-apps/api/core'

export interface Model {
    id: string
    user_id: string
    name: string
    description: string
    system_prompt: string | null
    created_at: string
    updated_at: string
}

export interface NewModel {
    user_id: string
    name: string
    description: string
    system_prompt?: string | null
}

export interface ModelUpdate {
    name?: string
    description?: string
    system_prompt?: string | null
}

/**
 * Create a new AI model
 */
export async function createModel(model: NewModel): Promise<Model> {
    try {
        return await invoke('db_create_model', { model })
    } catch (error) {
        console.error('Failed to create model:', error)
        throw new Error(error as string)
    }
}

/**
 * Get a model by ID
 */
export async function getModel(id: string): Promise<Model | null> {
    try {
        return await invoke('db_get_model', { id })
    } catch (error) {
        console.error('Failed to get model:', error)
        throw new Error(error as string)
    }
}

/**
 * List all models for a user
 */
export async function listModels(userId: string): Promise<Model[]> {
    try {
        return await invoke('db_list_models', { userId })
    } catch (error) {
        console.error('Failed to list models:', error)
        throw new Error(error as string)
    }
}

/**
 * Update a model
 */
export async function updateModel(id: string, updates: ModelUpdate): Promise<Model> {
    try {
        return await invoke('db_update_model', { id, updates })
    } catch (error) {
        console.error('Failed to update model:', error)
        throw new Error(error as string)
    }
}

/**
 * Delete a model
 */
export async function deleteModel(id: string): Promise<void> {
    try {
        await invoke('db_delete_model', { id })
    } catch (error) {
        console.error('Failed to delete model:', error)
        throw new Error(error as string)
    }
}
