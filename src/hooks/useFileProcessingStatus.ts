/**
 * Hook for tracking file processing status with real-time updates
 */

import { useState, useEffect, useCallback } from 'react'

export interface ProcessingStatus {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  status: 'uploaded' | 'processing' | 'processed' | 'failed'
  progress: number
  progressMessage: string
  embeddingCount: number
  errorMessage?: string
  uploadedAt: string
  processedAt?: string
  modelName: string
}

interface UseFileProcessingStatusOptions {
  trainingDataId: string
  pollInterval?: number // milliseconds, default 2000
  onComplete?: (status: ProcessingStatus) => void
  onError?: (error: string) => void
}

export function useFileProcessingStatus({
  trainingDataId,
  pollInterval = 2000,
  onComplete,
  onError,
}: UseFileProcessingStatusOptions) {
  const [status, setStatus] = useState<ProcessingStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/training/status/${trainingDataId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch status')
      }

      const data: ProcessingStatus = await response.json()
      setStatus(data)
      setError(null)

      // Call onComplete if processing is done
      if (data.status === 'processed' && onComplete) {
        onComplete(data)
      }

      // Call onError if processing failed
      if (data.status === 'failed' && onError && data.errorMessage) {
        onError(data.errorMessage)
      }

      return data
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMsg)
      if (onError) {
        onError(errorMsg)
      }
      return null
    } finally {
      setIsLoading(false)
    }
  }, [trainingDataId, onComplete, onError])

  useEffect(() => {
    // Initial fetch
    fetchStatus()

    // Set up polling if not complete
    const intervalId = setInterval(async () => {
      const currentStatus = await fetchStatus()
      
      // Stop polling if processed or failed
      if (currentStatus && (currentStatus.status === 'processed' || currentStatus.status === 'failed')) {
        clearInterval(intervalId)
      }
    }, pollInterval)

    // Cleanup
    return () => clearInterval(intervalId)
  }, [fetchStatus, pollInterval])

  return {
    status,
    isLoading,
    error,
    refetch: fetchStatus,
  }
}
