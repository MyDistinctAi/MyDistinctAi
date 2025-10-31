/**
 * Training Data Page
 *
 * Manage training data files for AI models
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import FileUpload from '@/components/dashboard/FileUpload'
import { FileText, Trash2, Download } from 'lucide-react'

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
                  {trainingFiles.map((file) => (
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
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            file.status === 'uploaded'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {file.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(file.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => deleteFile(file.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
