'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'success' | 'error'
  message?: string
  duration?: number
}

export default function DesktopTestPage() {
  const router = useRouter()
  const [isTauri, setIsTauri] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    setIsTauri(typeof window !== 'undefined' && '__TAURI__' in window)
  }, [])

  const updateResult = (index: number, updates: Partial<TestResult>) => {
    setResults(prev => {
      const newResults = [...prev]
      newResults[index] = { ...newResults[index], ...updates }
      return newResults
    })
  }

  const runTests = async () => {
    if (!isTauri) {
      alert('This page only works in the desktop app!')
      return
    }

    setIsRunning(true)
    const tests: TestResult[] = [
      { name: 'Check Tauri Availability', status: 'pending' },
      { name: 'Check Ollama Status', status: 'pending' },
      { name: 'List Ollama Models', status: 'pending' },
      { name: 'Generate AI Response', status: 'pending' },
      { name: 'Save Local Data', status: 'pending' },
      { name: 'Load Local Data', status: 'pending' },
      { name: 'List Data Keys', status: 'pending' },
      { name: 'Encrypt Data', status: 'pending' },
      { name: 'Decrypt Data', status: 'pending' },
      { name: 'Save Model Config', status: 'pending' },
      { name: 'Load Model Config', status: 'pending' },
      { name: 'Save Chat History', status: 'pending' },
      { name: 'Load Chat History', status: 'pending' },
      { name: 'Delete Data', status: 'pending' },
    ]
    setResults(tests)

    const { invoke } = (window as any).__TAURI__.core

    try {
      // Test 1: Tauri availability
      updateResult(0, { status: 'running' })
      const start0 = Date.now()
      await new Promise(resolve => setTimeout(resolve, 100))
      updateResult(0, { status: 'success', message: 'Tauri is available', duration: Date.now() - start0 })

      // Test 2: Ollama status
      updateResult(1, { status: 'running' })
      const start1 = Date.now()
      try {
        const ollamaStatus = await invoke('check_ollama_status')
        updateResult(1, {
          status: 'success',
          message: ollamaStatus ? '✅ Ollama is running' : '⚠️ Ollama is not running',
          duration: Date.now() - start1
        })

        if (ollamaStatus) {
          // Test 3: List models
          updateResult(2, { status: 'running' })
          const start2 = Date.now()
          const models = await invoke('list_ollama_models')
          updateResult(2, {
            status: 'success',
            message: `Found ${(models as string[]).length} model(s): ${(models as string[]).join(', ')}`,
            duration: Date.now() - start2
          })

          // Test 4: Generate response (only if mistral is available)
          if ((models as string[]).includes('mistral:7b')) {
            updateResult(3, { status: 'running' })
            const start3 = Date.now()
            const response = await invoke('generate_response', {
              model: 'mistral:7b',
              prompt: 'Say "Hello from desktop!" and nothing else.',
              context: null
            })
            updateResult(3, {
              status: 'success',
              message: `AI said: "${response}"`,
              duration: Date.now() - start3
            })
          } else {
            updateResult(3, { status: 'error', message: 'Skipped: mistral:7b not installed' })
          }
        } else {
          updateResult(2, { status: 'error', message: 'Skipped: Ollama not running' })
          updateResult(3, { status: 'error', message: 'Skipped: Ollama not running' })
        }
      } catch (err: any) {
        updateResult(1, { status: 'error', message: err.toString(), duration: Date.now() - start1 })
        updateResult(2, { status: 'error', message: 'Skipped: Ollama not available' })
        updateResult(3, { status: 'error', message: 'Skipped: Ollama not available' })
      }

      // Test 5: Save data
      updateResult(4, { status: 'running' })
      const start4 = Date.now()
      await invoke('save_user_data', {
        key: 'test_data',
        data: JSON.stringify({ test: true, timestamp: Date.now() })
      })
      updateResult(4, { status: 'success', message: 'Data saved successfully', duration: Date.now() - start4 })

      // Test 6: Load data
      updateResult(5, { status: 'running' })
      const start5 = Date.now()
      const loaded = await invoke('load_user_data', { key: 'test_data' })
      const parsed = JSON.parse(loaded as string)
      updateResult(5, {
        status: 'success',
        message: `Loaded: ${JSON.stringify(parsed)}`,
        duration: Date.now() - start5
      })

      // Test 7: List keys
      updateResult(6, { status: 'running' })
      const start6 = Date.now()
      const keys = await invoke('list_data_keys')
      updateResult(6, {
        status: 'success',
        message: `Found ${(keys as string[]).length} key(s)`,
        duration: Date.now() - start6
      })

      // Test 8: Encrypt
      updateResult(7, { status: 'running' })
      const start7 = Date.now()
      const encrypted = await invoke('encrypt_data', {
        data: 'Secret message!',
        password: 'test123'
      })
      updateResult(7, {
        status: 'success',
        message: `Encrypted (${(encrypted as string).length} chars)`,
        duration: Date.now() - start7
      })

      // Test 9: Decrypt
      updateResult(8, { status: 'running' })
      const start8 = Date.now()
      const decrypted = await invoke('decrypt_data', {
        encrypted,
        password: 'test123'
      })
      updateResult(8, {
        status: 'success',
        message: `Decrypted: "${decrypted}"`,
        duration: Date.now() - start8
      })

      // Test 10: Save model config
      updateResult(9, { status: 'running' })
      const start9 = Date.now()
      await invoke('save_model_config', {
        modelId: 'test-model-123',
        config: JSON.stringify({ name: 'Test Model', temperature: 0.7 })
      })
      updateResult(9, { status: 'success', message: 'Model config saved', duration: Date.now() - start9 })

      // Test 11: Load model config
      updateResult(10, { status: 'running' })
      const start10 = Date.now()
      const config = await invoke('load_model_config', { modelId: 'test-model-123' })
      updateResult(10, {
        status: 'success',
        message: `Config: ${config}`,
        duration: Date.now() - start10
      })

      // Test 12: Save chat history
      updateResult(11, { status: 'running' })
      const start11 = Date.now()
      await invoke('save_chat_history', {
        sessionId: 'test-session-456',
        messages: JSON.stringify([
          { role: 'user', content: 'Hello!' },
          { role: 'assistant', content: 'Hi there!' }
        ])
      })
      updateResult(11, { status: 'success', message: 'Chat history saved', duration: Date.now() - start11 })

      // Test 13: Load chat history
      updateResult(12, { status: 'running' })
      const start12 = Date.now()
      const history = await invoke('load_chat_history', { sessionId: 'test-session-456' })
      const messages = JSON.parse(history as string)
      updateResult(12, {
        status: 'success',
        message: `Loaded ${messages.length} message(s)`,
        duration: Date.now() - start12
      })

      // Test 14: Delete data
      updateResult(13, { status: 'running' })
      const start13 = Date.now()
      await invoke('delete_user_data', { key: 'test_data' })
      updateResult(13, { status: 'success', message: 'Data deleted', duration: Date.now() - start13 })

    } catch (error: any) {
      console.error('Test suite error:', error)
    }

    setIsRunning(false)
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'running': return 'text-blue-600 animate-pulse'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'running': return '⏳'
      default: return '⏸️'
    }
  }

  if (!isTauri) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Desktop App Only</h1>
          <p className="text-gray-600 mb-4">
            This testing page only works in the Tauri desktop application.
          </p>
          <p className="text-sm text-gray-500">
            Please open this page in the desktop app to run tests.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Desktop App Test Suite</h1>
          <p className="text-gray-600">
            Test all Tauri commands and verify desktop functionality
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <p className="text-lg font-semibold">
                {results.length === 0 ? 'Ready to test' :
                 isRunning ? 'Running tests...' :
                 results.every(r => r.status === 'success') ? '✅ All tests passed!' :
                 '⚠️ Some tests failed'}
              </p>
            </div>
            <Button
              onClick={runTests}
              disabled={isRunning}
              size="lg"
            >
              {isRunning ? 'Running...' : 'Run All Tests'}
            </Button>
          </div>
        </Card>

        <div className="space-y-3">
          {results.map((result, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <span className="text-2xl">{getStatusIcon(result.status)}</span>
                  <div className="flex-1">
                    <h3 className={`font-medium ${getStatusColor(result.status)}`}>
                      {result.name}
                    </h3>
                    {result.message && (
                      <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                    )}
                  </div>
                </div>
                {result.duration && (
                  <span className="text-xs text-gray-500">
                    {result.duration}ms
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>

        {results.length === 0 && (
          <Card className="p-8 text-center text-gray-500">
            Click "Run All Tests" to start testing
          </Card>
        )}
      </div>
    </div>
  )
}
