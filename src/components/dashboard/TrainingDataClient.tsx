'use client'

/**
 * Training Data Client Component
 *
 * Client-side component for managing training data uploads
 */

import { useState, useEffect } from 'react'
import { Database, Plus, Trash2, Download } from 'lucide-react'
import FileUpload from './FileUpload'
import { createClient } from '@/lib/supabase/client'

interface TrainingDataClientProps {
  models: any[]
}

interface TrainingFile {
  id: string
  model_id: string
  file_name: string
  file_url: string
  file_size: number
  file_type: string
  status: string
  created_at: string
}

export default function TrainingDataClient({ models }: TrainingDataClientProps) {
  const [selectedModelId, setSelectedModelId] = useState<string>('')
  const [trainingFiles, setTrainingFiles] = useState<TrainingFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  // Select first model by default
  useEffect(() => {
    if (models.length > 0 && !selectedModelId) {
      setSelectedModelId(models[0].id)
    }
  }, [models, selectedModelId])

  // Fetch training files for selected model
  useEffect(() => {
    if (selectedModelId) {
      fetchTrainingFiles()
    }
  }, [selectedModelId])

  const fetchTrainingFiles = async () => {
    if (!selectedModelId) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('training_data')
        .select('*')
        .eq('model_id', selectedModelId)
        .order('created_at', { ascending: false })

      if (data && !error) {
        setTrainingFiles(data)
      }
    } catch (error) {
      console.error('Error fetching training files:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const { error } = await supabase.from('training_data').delete().eq('id', fileId)

      if (!error) {
        setTrainingFiles((prev) => prev.filter((f) => f.id !== fileId))
      }
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  const selectedModel = models.find((m) => m.id === selectedModelId)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Training Data</h1>
        <p className="text-gray-600 mt-1">
          Upload and manage training data files for your AI models
        </p>
      </div>

      {/* Model Selection */}
      {models.length > 0 ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                Select Model
              </label>
              <select
                id="model"
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

            {selectedModel && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Base Model:</span> {selectedModel.base_model}
                </div>
                <div>
                  <span className="font-medium">Status:</span>{' '}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      selectedModel.status === 'ready'
                        ? 'bg-green-100 text-green-800'
                        : selectedModel.status === 'training'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {selectedModel.status}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-12">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 text-gray-400">
              <Database className="h-full w-full" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No models yet</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
              Create a model first before uploading training data.
            </p>
            <div className="mt-6">
              <a
                href="/dashboard/models"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Model
              </a>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Section */}
      {selectedModelId && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Files</h2>
          <FileUpload modelId={selectedModelId} onUploadComplete={fetchTrainingFiles} />
        </div>
      )}

      {/* Uploaded Files List */}
      {selectedModelId && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Uploaded Files ({trainingFiles.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-500">Loading files...</p>
            </div>
          ) : trainingFiles.length > 0 ? (
            <div className="space-y-3">
              {trainingFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Database className="h-8 w-8 text-blue-500 flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.file_name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{(file.file_size / 1024).toFixed(2)} KB</span>
                        <span>•</span>
                        <span>{file.file_type}</span>
                        <span>•</span>
                        <span>{new Date(file.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          file.status === 'processed'
                            ? 'bg-green-100 text-green-800'
                            : file.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : file.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {file.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Download"
                    >
                      <Download className="h-5 w-5" />
                    </a>
                    <button
                      onClick={() => deleteFile(file.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Database className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No files uploaded yet</p>
              <p className="text-xs text-gray-400 mt-1">Upload files above to get started</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
