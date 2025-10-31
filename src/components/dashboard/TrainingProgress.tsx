/**
 * Training Progress Component
 *
 * Real-time display of model training progress with status updates
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface TrainingProgressProps {
  modelId: string
  onClose: () => void
}

interface TrainingStatus {
  status: string
  training_progress: number
  updated_at: string
}

export default function TrainingProgress({ modelId, onClose }: TrainingProgressProps) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<string>('training')
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Fetch initial status
    fetchTrainingStatus()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`training-${modelId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'models',
          filter: `id=eq.${modelId}`,
        },
        (payload) => {
          const newData = payload.new as TrainingStatus
          setStatus(newData.status)
          setProgress(newData.training_progress || 0)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [modelId])

  const fetchTrainingStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('models')
        .select('status, training_progress')
        .eq('id', modelId)
        .single()

      if (error) throw error

      setStatus(data.status)
      setProgress(data.training_progress || 0)
    } catch (err) {
      console.error('Error fetching training status:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch training status')
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'ready':
        return 'text-green-600'
      case 'failed':
        return 'text-red-600'
      case 'training':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'failed':
        return <AlertCircle className="h-6 w-6 text-red-600" />
      case 'training':
        return <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
      default:
        return <Loader2 className="h-6 w-6 text-gray-600" />
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'ready':
        return 'Training completed successfully!'
      case 'failed':
        return error || 'Training failed. Please try again.'
      case 'training':
        return 'Training your model...'
      default:
        return 'Preparing to train...'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Training Progress</h2>
          {(status === 'ready' || status === 'failed') && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Status Icon and Message */}
        <div className="flex flex-col items-center mb-6">
          {getStatusIcon()}
          <p className={`mt-3 text-lg font-medium ${getStatusColor()}`}>
            {getStatusMessage()}
          </p>
        </div>

        {/* Progress Bar */}
        {status === 'training' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-medium text-gray-900">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Training Steps */}
        {status === 'training' && (
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full ${progress >= 25 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <span className={`text-sm ${progress >= 25 ? 'text-gray-900' : 'text-gray-500'}`}>
                Loading training data
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full ${progress >= 50 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <span className={`text-sm ${progress >= 50 ? 'text-gray-900' : 'text-gray-500'}`}>
                Initializing model
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full ${progress >= 75 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <span className={`text-sm ${progress >= 75 ? 'text-gray-900' : 'text-gray-500'}`}>
                Training model
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full ${progress >= 100 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <span className={`text-sm ${progress >= 100 ? 'text-gray-900' : 'text-gray-500'}`}>
                Finalizing
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {status === 'ready' && (
            <button
              onClick={onClose}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Start Chatting
            </button>
          )}
          {status === 'failed' && (
            <>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </>
          )}
          {status === 'training' && (
            <button
              disabled
              className="flex-1 bg-gray-100 text-gray-400 font-medium py-2 px-4 rounded-lg cursor-not-allowed"
            >
              Training in progress...
            </button>
          )}
        </div>

        {/* Info Text */}
        <p className="mt-4 text-xs text-center text-gray-500">
          {status === 'training' && 'This may take a few minutes. You can close this and check back later.'}
          {status === 'ready' && 'Your model is ready to use!'}
          {status === 'failed' && 'Check your training data and try again.'}
        </p>
      </div>
    </div>
  )
}
