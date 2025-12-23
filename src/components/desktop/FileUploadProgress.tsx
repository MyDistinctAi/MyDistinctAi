'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Clock
} from 'lucide-react'

interface FileProcessingStep {
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress?: number
  message?: string
}

interface FileUploadProgressProps {
  fileName: string
  steps: FileProcessingStep[]
  overallProgress: number
  onCancel?: () => void
  onRetry?: () => void
  showDetails?: boolean
}

export function FileUploadProgress({
  fileName,
  steps,
  overallProgress,
  onCancel,
  onRetry,
  showDetails = true
}: FileUploadProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (overallProgress > 0 && overallProgress < 100) {
      const estimated = (elapsedTime / overallProgress) * (100 - overallProgress)
      setEstimatedTime(Math.ceil(estimated))
    }
  }, [overallProgress, elapsedTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStepIcon = (status: FileProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const hasError = steps.some(step => step.status === 'error')
  const isComplete = overallProgress === 100

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6 text-blue-500" />
          <div>
            <h3 className="font-semibold text-lg">Processing File</h3>
            <p className="text-sm text-gray-600">{fileName}</p>
          </div>
        </div>
        {!isComplete && !hasError && onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-gray-500 hover:text-red-500"
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {hasError ? 'Processing Failed' : isComplete ? 'Complete' : 'Processing...'}
          </span>
          <span className="text-sm text-gray-600">{overallProgress}%</span>
        </div>
        <Progress
          value={overallProgress}
          className={`h-2 ${hasError ? 'bg-red-100' : ''}`}
        />

        {/* Time Information */}
        {!isComplete && !hasError && (
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Elapsed: {formatTime(elapsedTime)}</span>
            {estimatedTime && (
              <span>Est. remaining: {formatTime(estimatedTime)}</span>
            )}
          </div>
        )}
      </div>

      {/* Detailed Steps */}
      {showDetails && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Processing Steps</h4>
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-start space-x-3 p-3 rounded-lg ${
                step.status === 'error'
                  ? 'bg-red-50 border border-red-200'
                  : step.status === 'completed'
                  ? 'bg-green-50 border border-green-200'
                  : step.status === 'processing'
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              {getStepIcon(step.status)}
              <div className="flex-1">
                <p className="text-sm font-medium">{step.name}</p>
                {step.message && (
                  <p className={`text-xs mt-1 ${
                    step.status === 'error' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {step.message}
                  </p>
                )}
                {step.progress !== undefined && step.status === 'processing' && (
                  <Progress value={step.progress} className="h-1 mt-2" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State with Retry */}
      {hasError && onRetry && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                An error occurred during processing
              </p>
              <p className="text-xs text-red-600 mt-1">
                Check the error details above and try again.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="border-red-300 text-red-600 hover:bg-red-100"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Success State */}
      {isComplete && !hasError && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-sm font-medium text-green-800">
              File processed successfully!
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}

// Example usage component
export function FileUploadProgressExample() {
  const [steps] = useState<FileProcessingStep[]>([
    {
      name: 'Uploading file',
      status: 'completed',
      message: 'File uploaded successfully (2.5 MB)'
    },
    {
      name: 'Extracting text',
      status: 'processing',
      progress: 65,
      message: 'Parsing PDF document...'
    },
    {
      name: 'Chunking text',
      status: 'pending',
      message: 'Waiting...'
    },
    {
      name: 'Generating embeddings',
      status: 'pending',
      message: 'Waiting...'
    },
    {
      name: 'Storing in database',
      status: 'pending',
      message: 'Waiting...'
    }
  ])

  return (
    <div className="max-w-2xl mx-auto p-6">
      <FileUploadProgress
        fileName="research-paper.pdf"
        steps={steps}
        overallProgress={35}
        onCancel={() => console.log('Cancel')}
        onRetry={() => console.log('Retry')}
        showDetails={true}
      />
    </div>
  )
}
