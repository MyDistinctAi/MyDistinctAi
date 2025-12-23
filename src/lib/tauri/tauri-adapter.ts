/**
 * Tauri Adapter
 *
 * Provides a unified interface for communicating with the Tauri backend
 * Handles both web and desktop environments
 */

import { invoke } from '@tauri-apps/api/core'

// Check if we're running in Tauri
export const isTauri = typeof window !== 'undefined' && '__TAURI__' in window

/**
 * Ollama Service Interface
 */
export const TauriOllama = {
  /**
   * Check if Ollama is running
   */
  checkStatus: async (): Promise<boolean> => {
    if (!isTauri) return false
    try {
      return await invoke<boolean>('check_ollama_status')
    } catch (error) {
      console.error('Failed to check Ollama status:', error)
      return false
    }
  },

  /**
   * List available Ollama models
   */
  listModels: async (): Promise<string[]> => {
    if (!isTauri) return []
    try {
      return await invoke<string[]>('list_ollama_models')
    } catch (error) {
      console.error('Failed to list models:', error)
      return []
    }
  },

  /**
   * Pull an Ollama model
   */
  pullModel: async (model: string): Promise<string> => {
    if (!isTauri) throw new Error('Tauri not available')
    return await invoke<string>('pull_ollama_model', { model })
  },

  /**
   * Generate AI response
   */
  generate: async (
    model: string,
    prompt: string,
    context?: string[]
  ): Promise<string> => {
    if (!isTauri) throw new Error('Tauri not available')
    return await invoke<string>('generate_response', {
      model,
      prompt,
      context: context || null,
    })
  },

  /**
   * Stream AI response
   */
  streamGenerate: async (
    model: string,
    prompt: string,
    context?: string[]
  ): Promise<string> => {
    if (!isTauri) throw new Error('Tauri not available')
    return await invoke<string>('stream_response', {
      model,
      prompt,
      context: context || null,
    })
  },
}

/**
 * Local Storage Service Interface
 */
export const TauriStorage = {
  /**
   * Save data locally
   */
  save: async (key: string, data: string): Promise<void> => {
    if (!isTauri) {
      // Fallback to localStorage in web mode
      localStorage.setItem(key, data)
      return
    }
    await invoke('save_user_data', { key, data })
  },

  /**
   * Load data locally
   */
  load: async (key: string): Promise<string | null> => {
    if (!isTauri) {
      // Fallback to localStorage in web mode
      return localStorage.getItem(key)
    }
    try {
      return await invoke<string>('load_user_data', { key })
    } catch (error) {
      return null
    }
  },

  /**
   * Delete data
   */
  delete: async (key: string): Promise<void> => {
    if (!isTauri) {
      localStorage.removeItem(key)
      return
    }
    await invoke('delete_user_data', { key })
  },

  /**
   * List all keys
   */
  listKeys: async (): Promise<string[]> => {
    if (!isTauri) {
      return Object.keys(localStorage)
    }
    return await invoke<string[]>('list_data_keys')
  },
}

/**
 * Encryption Service Interface
 */
export const TauriEncryption = {
  /**
   * Encrypt data
   */
  encrypt: async (data: string, password: string): Promise<string> => {
    if (!isTauri) throw new Error('Encryption only available in desktop mode')
    return await invoke<string>('encrypt_data', { data, password })
  },

  /**
   * Decrypt data
   */
  decrypt: async (encrypted: string, password: string): Promise<string> => {
    if (!isTauri) throw new Error('Decryption only available in desktop mode')
    return await invoke<string>('decrypt_data', { encrypted, password })
  },
}

/**
 * Model Configuration Interface
 */
export const TauriModels = {
  /**
   * Save model configuration
   */
  saveConfig: async (modelId: string, config: any): Promise<void> => {
    const configStr = JSON.stringify(config)
    if (!isTauri) {
      localStorage.setItem(`model_config_${modelId}`, configStr)
      return
    }
    await invoke('save_model_config', { modelId, config: configStr })
  },

  /**
   * Load model configuration
   */
  loadConfig: async (modelId: string): Promise<any> => {
    if (!isTauri) {
      const config = localStorage.getItem(`model_config_${modelId}`)
      return config ? JSON.parse(config) : null
    }
    try {
      const config = await invoke<string>('load_model_config', { modelId })
      return JSON.parse(config)
    } catch (error) {
      return null
    }
  },
}

/**
 * Chat History Interface
 */
export const TauriChat = {
  /**
   * Save chat history
   */
  saveHistory: async (sessionId: string, messages: any[]): Promise<void> => {
    const messagesStr = JSON.stringify(messages)
    if (!isTauri) {
      localStorage.setItem(`chat_history_${sessionId}`, messagesStr)
      return
    }
    await invoke('save_chat_history', { sessionId, messages: messagesStr })
  },

  /**
   * Load chat history
   */
  loadHistory: async (sessionId: string): Promise<any[]> => {
    if (!isTauri) {
      const messages = localStorage.getItem(`chat_history_${sessionId}`)
      return messages ? JSON.parse(messages) : []
    }
    try {
      const messages = await invoke<string>('load_chat_history', { sessionId })
      return JSON.parse(messages)
    } catch (error) {
      return []
    }
  },
}

/**
 * Unified Tauri API
 */
export const TauriAPI = {
  isTauri,
  ollama: TauriOllama,
  storage: TauriStorage,
  encryption: TauriEncryption,
  models: TauriModels,
  chat: TauriChat,
}

export default TauriAPI
