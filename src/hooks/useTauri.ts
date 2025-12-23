import { useState, useEffect, useCallback } from 'react'

/**
 * Check if running in Tauri desktop app
 */
export function useIsTauri() {
  const [isTauri, setIsTauri] = useState(false)

  useEffect(() => {
    setIsTauri(typeof window !== 'undefined' && '__TAURI__' in window)
  }, [])

  return isTauri
}

/**
 * Get Tauri invoke function
 */
export function useTauriInvoke() {
  const isTauri = useIsTauri()

  const invoke = useCallback(
    async <T = any>(command: string, args?: Record<string, any>): Promise<T> => {
      if (!isTauri) {
        throw new Error('Not running in Tauri app')
      }

      const tauriInvoke = (window as any).__TAURI__.core.invoke
      return await tauriInvoke(command, args)
    },
    [isTauri]
  )

  return { invoke, isTauri }
}

/**
 * Hook for Ollama operations
 */
export function useOllama() {
  const { invoke, isTauri } = useTauriInvoke()
  const [isChecking, setIsChecking] = useState(false)
  const [isRunning, setIsRunning] = useState<boolean | null>(null)

  const checkInstalled = useCallback(async () => {
    if (!isTauri) throw new Error('Not in Tauri app')
    return await invoke<boolean>('check_ollama_installed')
  }, [invoke, isTauri])

  const startServer = useCallback(async () => {
    if (!isTauri) throw new Error('Not in Tauri app')
    return await invoke<void>('start_ollama_server')
  }, [invoke, isTauri])

  const checkStatus = useCallback(async () => {
    if (!isTauri) return false

    setIsChecking(true)
    try {
      const status = await invoke<boolean>('check_ollama_status')
      setIsRunning(status)
      return status
    } catch (error) {
      console.error('Ollama status check failed:', error)
      setIsRunning(false)
      return false
    } finally {
      setIsChecking(false)
    }
  }, [invoke, isTauri])

  const listModels = useCallback(async () => {
    if (!isTauri) throw new Error('Not in Tauri app')
    return await invoke<string[]>('list_ollama_models')
  }, [invoke, isTauri])

  const pullModel = useCallback(
    async (model: string) => {
      if (!isTauri) throw new Error('Not in Tauri app')
      return await invoke<string>('pull_ollama_model', { model })
    },
    [invoke, isTauri]
  )

  const generateResponse = useCallback(
    async (model: string, prompt: string, context?: string[]) => {
      if (!isTauri) throw new Error('Not in Tauri app')
      return await invoke<string>('generate_response', {
        model,
        prompt,
        context: context || null,
      })
    },
    [invoke, isTauri]
  )

  const streamResponse = useCallback(
    async (model: string, prompt: string, context?: string[]) => {
      if (!isTauri) throw new Error('Not in Tauri app')
      return await invoke<string>('stream_response', {
        model,
        prompt,
        context: context || null,
      })
    },
    [invoke, isTauri]
  )

  // Auto-check status on mount
  useEffect(() => {
    if (isTauri) {
      checkStatus()
    }
  }, [isTauri, checkStatus])

  return {
    isChecking,
    isRunning,
    checkInstalled,
    startServer,
    checkStatus,
    listModels,
    pullModel,
    generateResponse,
    streamResponse,
  }
}

/**
 * Hook for local storage operations
 */
export function useLocalStorage() {
  const { invoke, isTauri } = useTauriInvoke()

  const save = useCallback(
    async (key: string, data: any) => {
      if (!isTauri) {
        // Fallback to localStorage for web
        localStorage.setItem(key, JSON.stringify(data))
        return
      }

      const serialized = typeof data === 'string' ? data : JSON.stringify(data)
      await invoke('save_user_data', { key, data: serialized })
    },
    [invoke, isTauri]
  )

  const load = useCallback(
    async <T = any>(key: string): Promise<T | null> => {
      if (!isTauri) {
        // Fallback to localStorage for web
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : null
      }

      try {
        const data = await invoke<string>('load_user_data', { key })
        return JSON.parse(data)
      } catch (error) {
        return null
      }
    },
    [invoke, isTauri]
  )

  const remove = useCallback(
    async (key: string) => {
      if (!isTauri) {
        localStorage.removeItem(key)
        return
      }

      await invoke('delete_user_data', { key })
    },
    [invoke, isTauri]
  )

  const listKeys = useCallback(async () => {
    if (!isTauri) {
      return Object.keys(localStorage)
    }

    return await invoke<string[]>('list_data_keys')
  }, [invoke, isTauri])

  return { save, load, remove, listKeys }
}

/**
 * Hook for encryption operations
 */
export function useEncryption() {
  const { invoke, isTauri } = useTauriInvoke()

  const encrypt = useCallback(
    async (data: string, password: string) => {
      if (!isTauri) throw new Error('Encryption only available in desktop app')
      return await invoke<string>('encrypt_data', { data, password })
    },
    [invoke, isTauri]
  )

  const decrypt = useCallback(
    async (encrypted: string, password: string) => {
      if (!isTauri) throw new Error('Decryption only available in desktop app')
      return await invoke<string>('decrypt_data', { encrypted, password })
    },
    [invoke, isTauri]
  )

  return { encrypt, decrypt, isTauri }
}

/**
 * Hook for model configuration
 */
export function useModelConfig() {
  const { invoke, isTauri } = useTauriInvoke()

  const saveConfig = useCallback(
    async (modelId: string, config: any) => {
      if (!isTauri) throw new Error('Not in Tauri app')

      const serialized = typeof config === 'string' ? config : JSON.stringify(config)
      await invoke('save_model_config', { modelId, config: serialized })
    },
    [invoke, isTauri]
  )

  const loadConfig = useCallback(
    async <T = any>(modelId: string): Promise<T | null> => {
      if (!isTauri) throw new Error('Not in Tauri app')

      try {
        const config = await invoke<string>('load_model_config', { modelId })
        return JSON.parse(config)
      } catch (error) {
        return null
      }
    },
    [invoke, isTauri]
  )

  return { saveConfig, loadConfig, isTauri }
}

/**
 * Hook for chat history
 */
export function useChatHistory() {
  const { invoke, isTauri } = useTauriInvoke()

  const saveHistory = useCallback(
    async (sessionId: string, messages: any[]) => {
      if (!isTauri) throw new Error('Not in Tauri app')

      const serialized = JSON.stringify(messages)
      await invoke('save_chat_history', { sessionId, messages: serialized })
    },
    [invoke, isTauri]
  )

  const loadHistory = useCallback(
    async (sessionId: string): Promise<any[] | null> => {
      if (!isTauri) throw new Error('Not in Tauri app')

      try {
        const history = await invoke<string>('load_chat_history', { sessionId })
        return JSON.parse(history)
      } catch (error) {
        return null
      }
    },
    [invoke, isTauri]
  )

  return { saveHistory, loadHistory, isTauri }
}
