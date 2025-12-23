'use client'

import { useEffect } from 'react'
import { useOllama } from '@/hooks/useTauri'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function OllamaStatus() {
  const { isChecking, isRunning, checkStatus } = useOllama()

  // Check status every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkStatus()
    }, 30000)

    return () => clearInterval(interval)
  }, [checkStatus])

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isChecking ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          ) : isRunning ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}

          <div>
            <p className="font-medium">
              Ollama Status
            </p>
            <p className="text-sm text-gray-600">
              {isChecking
                ? 'Checking...'
                : isRunning
                ? 'Running and accessible'
                : 'Not running or not accessible'}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={checkStatus}
          disabled={isChecking}
        >
          <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {!isRunning && !isChecking && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Ollama is not running.</strong> Start Ollama to use local AI features.
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            Run <code className="bg-yellow-100 px-1 rounded">ollama serve</code> in a terminal.
          </p>
        </div>
      )}
    </Card>
  )
}
