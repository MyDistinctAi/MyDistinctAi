'use client'

import { useState, useEffect } from 'react'
import { useOllama, useIsTauri } from '@/hooks/useTauri'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Download, Loader2, Play } from 'lucide-react'

interface OllamaSetupProps {
  onReady?: () => void
}

export function OllamaSetup({ onReady }: OllamaSetupProps) {
  const isTauri = useIsTauri()
  const ollama = useOllama()
  
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null)
  const [isRunning, setIsRunning] = useState<boolean | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)

  // Check Ollama installation and status on mount
  useEffect(() => {
    if (!isTauri) return

    const checkOllama = async () => {
      try {
        setCheckingStatus(true)
        setError(null)

        // Check if installed
        const installed = await ollama.checkInstalled()
        setIsInstalled(installed)

        if (installed) {
          // Check if running
          const running = await ollama.checkStatus()
          setIsRunning(running)

          if (running && onReady) {
            onReady()
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check Ollama status')
      } finally {
        setCheckingStatus(false)
      }
    }

    checkOllama()
  }, [isTauri])

  const handleStartOllama = async () => {
    try {
      setIsStarting(true)
      setError(null)

      await ollama.startServer()

      // Wait a bit for server to start
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Check if it's running now
      const running = await ollama.checkStatus()
      setIsRunning(running)

      if (running && onReady) {
        onReady()
      } else {
        setError('Ollama started but not responding. Please wait a moment and try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start Ollama')
    } finally {
      setIsStarting(false)
    }
  }

  const handleRetryCheck = async () => {
    setCheckingStatus(true)
    setError(null)
    
    try {
      const running = await ollama.checkStatus()
      setIsRunning(running)
      
      if (running && onReady) {
        onReady()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check Ollama status')
    } finally {
      setCheckingStatus(false)
    }
  }

  if (!isTauri) {
    return null
  }

  if (checkingStatus) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Checking Ollama status...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Ollama is ready
  if (isInstalled && isRunning) {
    return (
      <Card className="w-full max-w-2xl mx-auto border-green-500/50">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold">Ollama is Ready!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Your AI models are ready to use
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Ollama not installed
  if (isInstalled === false) {
    return (
      <Card className="w-full max-w-2xl mx-auto border-yellow-500/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-yellow-500" />
            <div>
              <CardTitle>Ollama Not Installed</CardTitle>
              <CardDescription>
                Ollama is required to run AI models locally
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <h4 className="font-semibold">How to install Ollama:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Visit <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ollama.com/download</a></li>
              <li>Download the installer for your operating system</li>
              <li>Run the installer and follow the instructions</li>
              <li>Restart this application after installation</li>
            </ol>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={() => window.open('https://ollama.com/download', '_blank')}
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Ollama
            </Button>
            <Button 
              onClick={handleRetryCheck}
              variant="outline"
              disabled={checkingStatus}
            >
              {checkingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Check Again'
              )}
            </Button>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Ollama installed but not running
  if (isInstalled && !isRunning) {
    return (
      <Card className="w-full max-w-2xl mx-auto border-blue-500/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-blue-500" />
            <div>
              <CardTitle>Ollama Server Not Running</CardTitle>
              <CardDescription>
                Click below to start the Ollama server
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Ollama is installed but the server is not running. We can start it automatically for you.
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleStartOllama}
              disabled={isStarting}
              className="flex-1"
            >
              {isStarting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Ollama...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Ollama Server
                </>
              )}
            </Button>
            <Button 
              onClick={handleRetryCheck}
              variant="outline"
              disabled={checkingStatus || isStarting}
            >
              {checkingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Check Again'
              )}
            </Button>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <p>💡 Tip: You can also start Ollama manually by running <code className="bg-muted px-1 py-0.5 rounded">ollama serve</code> in your terminal.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
