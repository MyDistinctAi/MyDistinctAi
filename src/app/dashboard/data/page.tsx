/**
 * Training Data Page
 *
 * Manage training data files for AI models
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { FileText, Trash2, Download } from 'lucide-react'
import { ProgressSteps, FILE_UPLOAD_STEPS, type ProgressStep } from '@/components/ProgressSteps'

// Dynamic import for FileUpload component (code splitting)
const FileUpload = dynamic(() => import('@/components/dashboard/FileUpload'), {
  loading: () => <div className="animate-pulse h-32 bg-gray-100 rounded-lg" />
})

interface TrainingDataFile {
  id: string
  model_id: string
  file_name: string
  file_url: string
  file_size: number
  file_type: string
  status: string
  created_at: string
}

interface Model {
  id: string
  name: string
}

export default function TrainingDataPage() {
  const router = useRouter()
  const supabase = createClient()

  const [models, setModels] = useState<Model[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string>('')
  const [trainingFiles, setTrainingFiles] = useState<TrainingDataFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  // Load user's models
  useEffect(() => {
    loadModels()
  }, [])

  // Load training data when model is selected
  useEffect(() => {
    if (selectedModelId) {
      loadTrainingData()
    }
  }, [selectedModelId])

  // Auto-refresh training data every 5 seconds if there are processing files
  useEffect(() => {
    if (!selectedModelId) return

    const hasProcessingFiles = trainingFiles.some(f => f.status === 'processing')
    if (!hasProcessingFiles) return

    const interval = setInterval(() => {
      loadTrainingData()
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [selectedModelId, trainingFiles])

  // Reset to page 1 when model changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedModelId])

  // Pagination logic
  const paginatedFiles = trainingFiles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )
  const totalPages = Math.ceil(trainingFiles.length / ITEMS_PER_PAGE)
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  const loadModels = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('User not authenticated')
        setIsLoading(false)
        return
      }

      const { data: modelsData, error: modelsError} = await supabase
        .from('models')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (modelsError) throw modelsError

      setModels(modelsData || [])

      // Auto-select first model
      if (modelsData && modelsData.length > 0) {
        setSelectedModelId(modelsData[0].id)
      }

      setIsLoading(false)
    } catch (err) {
      console.error('Error loading models:', err)
      setError(err instanceof Error ? err.message : 'Failed to load models')
      setIsLoading(false)
    }
  }

  const loadTrainingData = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('training_data')
        .select('*')
        .eq('model_id', selectedModelId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setTrainingFiles(data || [])
    } catch (err) {
      console.error('Error loading training data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load training data')
    }
  }

  const deleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const { error: deleteError } = await supabase
        .from('training_data')
        .delete()
        .eq('id', fileId)

      if (deleteError) throw deleteError

      // Reload training data
      loadTrainingData()
    } catch (err) {
      console.error('Error deleting file:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete file')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Training Data</h1>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-lg text-gray-900 mb-4">No models found</p>
            <p className="text-gray-600 mb-6">
              You need to create a model first before uploading training data.
            </p>
            <button
              onClick={() => router.push('/dashboard/models')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Go to Models
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Training Data</h1>
          <p className="text-gray-600">
            Upload and manage files to train your AI models
          </p>
        </div>

        {/* Model Selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Model
          </label>
          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>

        {/* File Upload Component */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Files</h2>
          <FileUpload modelId={selectedModelId} onUploadComplete={loadTrainingData} />
        </div>

        {/* Training Files List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Uploaded Files ({trainingFiles.length})
          </h2>

          {trainingFiles.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No training data uploaded yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Upload files above to start training your AI model
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chunks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="text-sm font-medium text-gray-900">
                            {file.file_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatFileSize(file.file_size)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {(file as any).chunk_count ? (
                          <span className="font-medium text-blue-600">
                            {(file as any).chunk_count}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {file.status === 'processing' ? (
                          <div className="space-y-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing
                            </span>
                            <div className="mt-2">
                              <ProgressSteps
                                steps={FILE_UPLOAD_STEPS.map((step, idx) => ({
                                  ...step,
                                  status: idx < 3 ? 'completed' : idx === 3 ? 'in_progress' : 'pending' as const,
                                  percentage: idx < 3 ? 100 : idx === 3 ? 50 : 0
                                }))}
                                showPercentages={false}
                              />
                            </div>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                              file.status === 'processed'
                                ? 'bg-green-100 text-green-800'
                                : file.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {file.status === 'processed' && '✓ '}
                            {file.status === 'failed' && '✗ '}
                            {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(file.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Download removed - files are deleted after processing to save storage costs */}
                          {/* Only embeddings are kept, not original files */}
                          <button
                            onClick={() => deleteFile(file.id)}
                            className="text-red-600 hover:text-red-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50"
                            title="Delete embeddings"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="text-xs">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {trainingFiles.length > ITEMS_PER_PAGE && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={!hasPrevPage}
                  className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                    hasPrevPage
                      ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={!hasNextPage}
                  className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                    hasNextPage
                      ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>
                    {' '}-{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * ITEMS_PER_PAGE, trainingFiles.length)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{trainingFiles.length}</span> files
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={!hasPrevPage}
                      className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                        hasPrevPage ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-not-allowed opacity-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            currentPage === pageNum
                              ? 'z-10 bg-blue-600 text-white'
                              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={!hasNextPage}
                      className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                        hasNextPage ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-not-allowed opacity-50'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
