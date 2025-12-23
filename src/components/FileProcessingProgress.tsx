/**
 * File Processing Progress Component
 * Shows real-time progress of file processing with status indicators
 */

'use client'

import { useFileProcessingStatus } from '@/hooks/useFileProcessingStatus'
import { CheckCircle2, XCircle, Loader2, FileText } from 'lucide-react'

interface FileProcessingProgressProps {
  trainingDataId: string
  fileName?: string
  onComplete?: () => void
  onError?: (error: string) => void
  compact?: boolean
}

export function FileProcessingProgress({
  trainingDataId,
  fileName,
  onComplete,
  onError,
  compact = false,
}: FileProcessingProgressProps) {
  const { status, isLoading, error } = useFileProcessingStatus({
    trainingDataId,
    onComplete: () => {
      if (onComplete) onComplete()
    },
    onError,
  })

  if (isLoading && !status) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading status...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <XCircle className="h-4 w-4" />
        <span>Error: {error}</span>
      </div>
    )
  }

  if (!status) return null

  const getStatusIcon = () => {
    switch (status.status) {
      case 'uploaded':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'processed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (status.status) {
      case 'uploaded':
        return 'bg-blue-500'
      case 'processing':
        return 'bg-blue-500'
      case 'processed':
        return 'bg-green-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <div className="flex-1">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
              style={{ width: `${status.progress}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-gray-600">{status.progress}%</span>
      </div>
    )
  }

  return (
    <div className="space-y-3 p-4 bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <div>
            <p className="text-sm font-medium text-gray-900">
              {fileName || status.fileName}
            </p>
            <p className="text-xs text-gray-500">
              {(status.fileSize / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        <span className="text-xs font-medium text-gray-600">
          {status.progress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${getStatusColor()}`}
          style={{ width: `${status.progress}%` }}
        />
      </div>

      {/* Status Message */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">{status.progressMessage}</span>
        {status.status === 'processing' && (
          <span className="text-blue-600 animate-pulse">Processing...</span>
        )}
        {status.status === 'processed' && (
          <span className="text-green-600">✓ Complete</span>
        )}
        {status.status === 'failed' && (
          <span className="text-red-600">✗ Failed</span>
        )}
      </div>

      {/* Error Message */}
      {status.errorMessage && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {status.errorMessage}
        </div>
      )}

      {/* Stats */}
      {status.status === 'processed' && (
        <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Embeddings created:</span>
            <span className="font-medium">{status.embeddingCount}</span>
          </div>
        </div>
      )}
    </div>
  )
}
