'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOllama } from '@/hooks/useTauri'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  ChevronRight,
  Brain,
  Shield,
  Zap
} from 'lucide-react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'checking' | 'complete' | 'failed' | 'downloading'
  action?: () => Promise<void>
}

export function DesktopOnboarding() {
  const router = useRouter()
  const { isRunning, checkStatus, pullModel, listModels } = useOllama()
  const [currentStep, setCurrentStep] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'ollama',
      title: 'Install Ollama',
      description: 'Ollama is required to run AI models locally on your device',
      status: 'pending'
    },
    {
      id: 'model',
      title: 'Download Mistral 7B Model',
      description: 'This AI model will power your private conversations',
      status: 'pending'
    },
    {
      id: 'complete',
      title: 'Setup Complete',
      description: 'Your private AI studio is ready to use!',
      status: 'pending'
    }
  ])

  useEffect(() => {
    // Check if onboarding was completed
    const completed = localStorage.getItem('desktop_onboarding_completed')
    if (completed === 'true') {
      setShowOnboarding(false)
    } else {
      checkOllamaStatus()
    }
  }, [])

  const checkOllamaStatus = async () => {
    updateStep(0, { status: 'checking' })

    try {
      const status = await checkStatus()

      if (status) {
        updateStep(0, { status: 'complete' })
        // Check if model is downloaded
        await checkModelStatus()
      } else {
        updateStep(0, { status: 'failed' })
      }
    } catch (error) {
      updateStep(0, { status: 'failed' })
    }
  }

  const checkModelStatus = async () => {
    updateStep(1, { status: 'checking' })

    try {
      const models = await listModels()
      const hasMistral = models.some(m => m.includes('mistral'))

      if (hasMistral) {
        updateStep(1, { status: 'complete' })
        updateStep(2, { status: 'complete' })
        setCurrentStep(2)
      } else {
        updateStep(1, { status: 'pending' })
        setCurrentStep(1)
      }
    } catch (error) {
      updateStep(1, { status: 'pending' })
      setCurrentStep(1)
    }
  }

  const updateStep = (index: number, updates: Partial<OnboardingStep>) => {
    setSteps(prev => {
      const newSteps = [...prev]
      newSteps[index] = { ...newSteps[index], ...updates }
      return newSteps
    })
  }

  const handleDownloadOllama = () => {
    // Open Ollama download page
    const { open } = (window as any).__TAURI__.shell
    open('https://ollama.com/download')
  }

  const handleDownloadModel = async () => {
    updateStep(1, { status: 'downloading' })
    setDownloadProgress(0)

    try {
      // Simulate progress (Ollama doesn't provide real-time progress)
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + 5
        })
      }, 1000)

      await pullModel('mistral:7b')

      clearInterval(progressInterval)
      setDownloadProgress(100)

      setTimeout(() => {
        updateStep(1, { status: 'complete' })
        updateStep(2, { status: 'complete' })
        setCurrentStep(2)
      }, 500)
    } catch (error) {
      console.error('Failed to download model:', error)
      updateStep(1, { status: 'failed' })
      alert('Failed to download model. Please make sure Ollama is running and try again.')
    }
  }

  const handleCompleteOnboarding = () => {
    localStorage.setItem('desktop_onboarding_completed', 'true')
    setShowOnboarding(false)
    router.push('/dashboard')
  }

  const handleSkip = () => {
    localStorage.setItem('desktop_onboarding_completed', 'true')
    setShowOnboarding(false)
    router.push('/dashboard')
  }

  if (!showOnboarding) {
    return null
  }

  const getStepIcon = (step: OnboardingStep) => {
    switch (step.status) {
      case 'complete':
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-600" />
      case 'checking':
      case 'downloading':
        return <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
      default:
        return <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-3xl w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to MyDistinctAI</h1>
          <p className="text-gray-600">
            Let's set up your private AI studio in just a few steps
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium">100% Private</p>
            <p className="text-xs text-gray-600">Data never leaves your device</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Fast & Offline</p>
            <p className="text-xs text-gray-600">Works without internet</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Brain className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Powerful AI</p>
            <p className="text-xs text-gray-600">Mistral 7B model</p>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`p-4 rounded-lg border-2 ${
                currentStep === index
                  ? 'border-blue-500 bg-blue-50'
                  : step.status === 'complete'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  {getStepIcon(step)}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{step.description}</p>

                  {/* Ollama Step */}
                  {step.id === 'ollama' && step.status === 'failed' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800 mb-2">
                          <strong>Ollama is not installed or not running.</strong>
                        </p>
                        <p className="text-xs text-yellow-700">
                          Ollama is free and required to run AI models locally.
                        </p>
                      </div>
                      <div className="flex space-x-3">
                        <Button onClick={handleDownloadOllama} className="flex-1">
                          <Download className="h-4 w-4 mr-2" />
                          Download Ollama
                        </Button>
                        <Button variant="outline" onClick={checkOllamaStatus}>
                          <Loader2 className="h-4 w-4 mr-2" />
                          Recheck
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        After installing, make sure to start Ollama and click "Recheck"
                      </p>
                    </div>
                  )}

                  {step.id === 'ollama' && step.status === 'checking' && (
                    <p className="text-sm text-blue-600">Checking for Ollama...</p>
                  )}

                  {step.id === 'ollama' && step.status === 'complete' && (
                    <p className="text-sm text-green-600">✓ Ollama is running!</p>
                  )}

                  {/* Model Step */}
                  {step.id === 'model' && step.status === 'pending' && currentStep === 1 && (
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-800 mb-1">
                          <strong>Download the Mistral 7B AI model</strong>
                        </p>
                        <p className="text-xs text-blue-700">
                          Size: ~4.1 GB | Time: 5-15 minutes depending on your connection
                        </p>
                      </div>
                      <Button onClick={handleDownloadModel} className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download Mistral 7B
                      </Button>
                    </div>
                  )}

                  {step.id === 'model' && step.status === 'downloading' && (
                    <div className="space-y-2">
                      <p className="text-sm text-blue-600">Downloading Mistral 7B...</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${downloadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600">{downloadProgress}% complete</p>
                    </div>
                  )}

                  {step.id === 'model' && step.status === 'checking' && (
                    <p className="text-sm text-blue-600">Checking for model...</p>
                  )}

                  {step.id === 'model' && step.status === 'complete' && (
                    <p className="text-sm text-green-600">✓ Model downloaded!</p>
                  )}

                  {/* Complete Step */}
                  {step.id === 'complete' && step.status === 'complete' && (
                    <div className="space-y-3">
                      <p className="text-sm text-green-600">
                        🎉 Everything is ready! You can now create AI models and start chatting.
                      </p>
                      <Button onClick={handleCompleteOnboarding} className="w-full">
                        Get Started
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button variant="ghost" onClick={handleSkip}>
            Skip Setup
          </Button>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Shield className="h-4 w-4" />
            <span>Your data stays 100% private on your device</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
