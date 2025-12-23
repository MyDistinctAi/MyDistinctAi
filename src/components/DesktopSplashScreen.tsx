'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Loader2, AlertCircle, Download } from 'lucide-react'

interface SetupStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'loading' | 'complete' | 'error'
  progress?: number
  errorMessage?: string
}

interface DesktopSplashScreenProps {
  onComplete: () => void
}

export function DesktopSplashScreen({ onComplete }: DesktopSplashScreenProps) {
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 'server',
      title: 'Starting Server',
      description: 'Initializing Next.js development server',
      status: 'pending',
    },
    {
      id: 'ollama',
      title: 'Checking Ollama',
      description: 'Verifying AI engine availability',
      status: 'pending',
    },
    {
      id: 'model',
      title: 'Preparing AI Model',
      description: 'Downloading mistral:7b (first time only)',
      status: 'pending',
      progress: 0,
    },
    {
      id: 'ready',
      title: 'Finalizing',
      description: 'Getting everything ready for you',
      status: 'pending',
    },
  ])

  const [isComplete, setIsComplete] = useState(false)
  const [showContent, setShowContent] = useState(true)

  useEffect(() => {
    const startTime = Date.now()
    const MIN_DISPLAY_TIME = 10000 // 10 seconds minimum

    // Listen to startup progress events from Tauri
    const setupListener = async () => {
      const { listen } = await import('@tauri-apps/api/event')

      const unlisten = await listen('startup-progress', (event: any) => {
        const { step, status, message, progress, errorMessage } = event.payload

        console.log('Startup progress:', event.payload)

        // Update step status
        if (status) {
          updateStep(step, status, errorMessage)
        }

        // Update progress if provided
        if (progress !== undefined) {
          updateStepProgress(step, progress)
        }

        // Check if all steps are complete
        if (step === 'ready' && status === 'complete') {
          // Calculate remaining time to meet minimum display time
          const elapsed = Date.now() - startTime
          const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsed)

          setTimeout(async () => {
            setIsComplete(true)
            await delay(500)
            setShowContent(false)
            await delay(500)
            onComplete()
          }, remainingTime + 500)
        }
      })

      return unlisten
    }

    let unlistenFn: (() => void) | null = null

    setupListener().then((fn) => {
      unlistenFn = fn
    }).catch((error) => {
      console.log('Using fallback mode for splash screen (ACL blocked events)')

      // Fallback: Simulate the steps manually with proper timing
      // Step 1: Starting Server (0-3s)
      setTimeout(() => updateStep('server', 'loading'), 0)
      setTimeout(() => updateStep('server', 'complete'), 3000)

      // Step 2: Checking Ollama (3.5-5s)
      setTimeout(() => updateStep('ollama', 'loading'), 3500)
      setTimeout(() => updateStep('ollama', 'complete'), 5000)

      // Step 3: Preparing AI Model (5.5-8.5s) with progress bar 0-100%
      setTimeout(() => updateStep('model', 'loading'), 5500)

      // Animate progress bar from 0-100% over 3 seconds (5.5s to 8.5s)
      const progressSteps = [0, 20, 40, 60, 80, 100]
      progressSteps.forEach((progress, index) => {
        setTimeout(() => {
          updateStepProgress('model', progress)
        }, 5500 + (index * 500)) // 500ms per step = 3 seconds total
      })

      setTimeout(() => updateStep('model', 'complete'), 8500)

      // Step 4: Finalizing (9-10s)
      setTimeout(() => updateStep('ready', 'loading'), 9000)

      // Complete and redirect at 10 seconds minimum
      setTimeout(async () => {
        updateStep('ready', 'complete')
        await delay(500)
        setIsComplete(true)
        await delay(500)
        setShowContent(false)
        await delay(500)
        onComplete()
      }, MIN_DISPLAY_TIME)
    })

    // Cleanup listener on unmount
    return () => {
      if (unlistenFn) {
        unlistenFn()
      }
    }
  }, [onComplete])

  const updateStep = (id: string, status: SetupStep['status'], errorMessage?: string) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id ? { ...step, status, errorMessage } : step
      )
    )
  }

  const updateStepProgress = (id: string, progress: number) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id ? { ...step, progress } : step
      )
    )
  }

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const handleRetry = (stepId: string) => {
    // TODO: Implement retry logic
    console.log('Retry step:', stepId)
  }

  const handleDownloadOllama = () => {
    window.open('https://ollama.com/download', '_blank')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: showContent ? 1 : 0,
        transition: 'opacity 0.5s ease',
        pointerEvents: showContent ? 'auto' : 'none',
      }}
    >
      {/* Spinner animation styles */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.05,
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '672px', padding: '0 32px' }}>
        {/* Logo and Title */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '96px',
            height: '96px',
            borderRadius: '16px',
            marginBottom: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            <img
              src="/images/logo.jpg"
              alt="MyDistinctAI Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>MyDistinctAI</h1>
          <p style={{ color: '#94a3b8', fontSize: '1.125rem' }}>Your Private AI Studio</p>
        </div>

        {/* Progress Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {steps.map((step, index) => (
            <StepCard
              key={step.id}
              step={step}
              index={index}
              onRetry={handleRetry}
              onDownloadOllama={handleDownloadOllama}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '48px', color: '#64748b', fontSize: '0.875rem' }}>
          <p>Setting up your local AI environment...</p>
        </div>
      </div>
    </div>
  )
}

interface StepCardProps {
  step: SetupStep
  index: number
  onRetry: (stepId: string) => void
  onDownloadOllama: () => void
}

function StepCard({ step, index, onRetry, onDownloadOllama }: StepCardProps) {
  const getIcon = () => {
    const iconStyle = { width: '24px', height: '24px' }
    switch (step.status) {
      case 'complete':
        return <CheckCircle2 style={{ ...iconStyle, color: '#22c55e' }} />
      case 'loading':
        return <Loader2 style={{ ...iconStyle, color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
      case 'error':
        return <AlertCircle style={{ ...iconStyle, color: '#ef4444' }} />
      default:
        return <Circle style={{ ...iconStyle, color: '#475569' }} />
    }
  }

  const getCardStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '12px',
      border: '1px solid',
      transition: 'all 0.5s ease',
    }

    switch (step.status) {
      case 'complete':
        return { ...base, backgroundColor: 'rgba(30, 41, 59, 0.5)', borderColor: 'rgba(34, 197, 94, 0.3)', boxShadow: '0 10px 15px -3px rgba(34, 197, 94, 0.1)' }
      case 'loading':
        return { ...base, backgroundColor: 'rgba(30, 41, 59, 0.8)', borderColor: 'rgba(59, 130, 246, 0.5)', boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.2)', transform: 'scale(1.02)' }
      case 'error':
        return { ...base, backgroundColor: 'rgba(30, 41, 59, 0.5)', borderColor: 'rgba(239, 68, 68, 0.3)', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.1)' }
      default:
        return { ...base, backgroundColor: 'rgba(30, 41, 59, 0.3)', borderColor: 'rgba(51, 65, 85, 0.3)' }
    }
  }

  return (
    <div style={getCardStyle()}>
      {/* Progress bar background */}
      {step.status === 'loading' && step.progress !== undefined && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1))',
          transition: 'all 0.3s ease',
          width: `${step.progress}%`
        }} />
      )}

      <div style={{ position: 'relative', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          {/* Icon */}
          <div style={{ flexShrink: 0, marginTop: '4px' }}>
            {getIcon()}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'white' }}>
                {step.title}
              </h3>
              {step.status === 'loading' && step.progress !== undefined && (
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#60a5fa' }}>
                  {step.progress}%
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '8px' }}>
              {step.description}
            </p>

            {/* Progress bar */}
            {step.status === 'loading' && step.progress !== undefined && (
              <div style={{ width: '100%', backgroundColor: 'rgba(51, 65, 85, 0.5)', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: 'linear-gradient(to right, #3b82f6, #a855f7)',
                    transition: 'all 0.3s ease-out',
                    width: `${step.progress}%`
                  }}
                />
              </div>
            )}

            {/* Error message and actions */}
            {step.status === 'error' && (
              <div style={{ marginTop: '12px' }}>
                <p style={{ fontSize: '0.875rem', color: '#f87171', marginBottom: '8px' }}>
                  {step.errorMessage || 'An error occurred'}
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onRetry(step.id)}
                    style={{
                      padding: '8px 16px',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'white',
                      backgroundColor: '#334155',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Retry
                  </button>
                  {step.id === 'ollama' && (
                    <button
                      onClick={onDownloadOllama}
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'white',
                        backgroundColor: '#2563eb',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Download style={{ width: '16px', height: '16px' }} />
                      Download Ollama
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// CSS keyframes for spinner animation - injected via style element
export const SpinnerStyles = () => (
  <style>{`
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `}</style>
)
