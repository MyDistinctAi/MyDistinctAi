'use client'

/**
 * Create Model Modal
 *
 * Modal for creating new AI models with form validation and file upload
 */

import { useState } from 'react'
import { X, ChevronDown, ChevronUp, Upload, FileText } from 'lucide-react'
import { ProgressSteps, FILE_UPLOAD_STEPS, type ProgressStep } from '../ProgressSteps'
import { useIsTauri } from '@/hooks/useTauri'

interface CreateModelModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ModelFormData, files?: File[], onProgress?: (status: string) => void) => Promise<void>
  mode?: 'create' | 'edit'
  initialData?: ModelFormData & { id?: string }
}

export interface ModelFormData {
  name: string
  description: string
  baseModel: string
  trainingMode: 'quick' | 'standard' | 'advanced'
  personality: string
  learningRate?: number
  maxContextLength?: number
  temperature?: number
  responseLength?: string
}

export type OnSubmitCallback = (data: ModelFormData, files?: File[], onProgress?: (status: string) => void) => Promise<void>

// Cloud models (always available)
// Note: Do NOT use :free suffix - OpenRouter API rejects it
const CLOUD_MODELS = [
  { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat (FREE) ⭐' },
  { value: 'google/gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (FREE)' },
  { value: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B (FREE)' },
  { value: 'qwen/qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B (FREE)' },
]

// Local models (desktop only)
const LOCAL_MODELS = [
  { value: 'mistral:7b', label: 'Mistral 7B (Local)' },
  { value: 'llama2:7b', label: 'Llama 2 7B (Local)' },
  { value: 'llama2:13b', label: 'Llama 2 13B (Local)' },
  { value: 'phi:2', label: 'Phi-2 (Local)' },
  { value: 'codellama:7b', label: 'Code Llama 7B (Local)' },
]

const TRAINING_MODES = [
  { value: 'quick', label: 'Quick', description: 'Fast training, lower accuracy' },
  { value: 'standard', label: 'Standard', description: 'Balanced performance' },
  { value: 'advanced', label: 'Advanced', description: 'Slower, higher accuracy' },
]

const PERSONALITY_EXAMPLES = [
  'Professional and concise',
  'Friendly and conversational',
  'Technical and detailed',
  'Creative and expressive',
]

export default function CreateModelModal({
  isOpen,
  onClose,
  onSubmit,
  mode = 'create',
  initialData
}: CreateModelModalProps) {
  const isTauri = useIsTauri() // Detect if running in desktop app
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ModelFormData, string>>>({})
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState<{current: number, total: number} | null>(null)
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([])
  const [showProgress, setShowProgress] = useState(false)

  // Combine cloud and local models based on environment
  const BASE_MODELS = isTauri ? [...CLOUD_MODELS, ...LOCAL_MODELS] : CLOUD_MODELS

  const [formData, setFormData] = useState<ModelFormData>(
    initialData || {
      name: '',
      description: '',
      baseModel: 'deepseek/deepseek-chat', // Default to DeepSeek (no :free suffix!)
      trainingMode: 'standard',
      personality: '',
      learningRate: 0.0001,
      maxContextLength: 2048,
      temperature: 0.7,
      responseLength: 'medium',
    }
  )

  if (!isOpen) return null

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof ModelFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleNumberChange = (name: keyof ModelFormData, value: number) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    const newErrors: Partial<Record<keyof ModelFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Model name is required'
    }

    if (!formData.baseModel) {
      newErrors.baseModel = 'Please select a base model'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    setUploadStatus('Creating model...')

    // Initialize progress steps if files are selected
    if (selectedFiles.length > 0) {
      setShowProgress(true)
      setProgressSteps(
        FILE_UPLOAD_STEPS.map(step => ({
          ...step,
          status: 'pending' as const,
          percentage: 0
        }))
      )
    }

    try {
      // Pass both form data and files to parent with progress callback
      await onSubmit(formData, selectedFiles, (status: string) => {
        setUploadStatus(status)

        // Update progress steps based on status message
        if (status.includes('Creating model')) {
          // No file upload steps needed yet
        } else if (status.includes('Processing file')) {
          // File is being processed - show all steps
          updateProgressStep('upload', 'completed', 100)
          updateProgressStep('extract', 'in_progress', 50)
        } else if (status.includes('✅ Processed')) {
          // File processed successfully - mark all complete
          FILE_UPLOAD_STEPS.forEach(step => {
            updateProgressStep(step.id, 'completed', 100)
          })
        } else if (status.includes('❌ Failed')) {
          // File processing failed
          updateProgressStep('extract', 'error', 0)
        }
      })

      // Reset form
      setFormData({
        name: '',
        description: '',
        baseModel: 'deepseek/deepseek-chat',
        trainingMode: 'standard',
        personality: '',
        learningRate: 0.0001,
        maxContextLength: 2048,
        temperature: 0.7,
        responseLength: 'medium',
      })
      setSelectedFiles([])
      setUploadStatus('')
      setUploadProgress(null)
      setProgressSteps([])
      setShowProgress(false)
      onClose()
    } catch (error) {
      console.error('Error creating model:', error)
      setErrors({ name: 'Failed to create model. Please try again.' })
      setUploadStatus('Failed to create model')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to update progress steps
  const updateProgressStep = (stepId: string, status: ProgressStep['status'], percentage?: number) => {
    setProgressSteps(prev => prev.map(step =>
      step.id === stepId
        ? { ...step, status, percentage: percentage ?? step.percentage }
        : step
    ))
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'edit' ? 'Edit Model' : 'Create New Model'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Model Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Model Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Customer Support Bot"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what this model will be used for..."
              />
            </div>

            {/* Base Model */}
            <div>
              <label htmlFor="baseModel" className="block text-sm font-medium text-gray-700 mb-2">
                Base Model <span className="text-red-500">*</span>
              </label>
              <select
                id="baseModel"
                name="baseModel"
                value={formData.baseModel}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {BASE_MODELS.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Training Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Training Mode
              </label>
              <div className="grid grid-cols-3 gap-3">
                {TRAINING_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        trainingMode: mode.value as 'quick' | 'standard' | 'advanced',
                      }))
                    }
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      formData.trainingMode === mode.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{mode.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{mode.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Personality/Tone */}
            <div>
              <label
                htmlFor="personality"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Personality/Tone
              </label>
              <textarea
                id="personality"
                name="personality"
                value={formData.personality}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Professional and friendly, with a focus on clarity..."
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs text-gray-500">Examples:</span>
                {PERSONALITY_EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, personality: example }))}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Training Data Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Training Data (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".txt,.pdf,.doc,.docx,.md"
                  onChange={(e) => {
                    if (e.target.files) {
                      setSelectedFiles(Array.from(e.target.files))
                      setUploadStatus(`${e.target.files.length} file(s) selected`)
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 mb-1">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-gray-500">
                    PDF, TXT, DOC, DOCX, MD (Max 10MB each)
                  </span>
                </label>
              </div>
              
              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <p className="text-xs text-gray-600">
                    💡 These files will be automatically uploaded to your training data after model creation
                  </p>
                </div>
              )}
              
              {uploadStatus && !showProgress && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    {uploadStatus.includes('✅') ? (
                      <span className="text-green-600 text-lg">✅</span>
                    ) : uploadStatus.includes('❌') ? (
                      <span className="text-red-600 text-lg">❌</span>
                    ) : (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                    <p className="text-sm font-medium text-blue-900">{uploadStatus}</p>
                  </div>
                </div>
              )}

              {/* Progress Steps */}
              {showProgress && progressSteps.length > 0 && (
                <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Processing Files...
                  </h4>
                  <ProgressSteps steps={progressSteps} showPercentages={true} />
                </div>
              )}
            </div>

            {/* Advanced Options Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showAdvanced ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide Advanced Options
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show Advanced Options
                </>
              )}
            </button>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                {/* Learning Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Learning Rate: {formData.learningRate}
                  </label>
                  <input
                    type="range"
                    min="0.00001"
                    max="0.001"
                    step="0.00001"
                    value={formData.learningRate}
                    onChange={(e) =>
                      handleNumberChange('learningRate', parseFloat(e.target.value))
                    }
                    className="w-full"
                  />
                </div>

                {/* Max Context Length */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Context Length
                  </label>
                  <select
                    value={formData.maxContextLength}
                    onChange={(e) =>
                      handleNumberChange('maxContextLength', parseInt(e.target.value))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1024}>1024 tokens</option>
                    <option value={2048}>2048 tokens</option>
                    <option value={4096}>4096 tokens</option>
                    <option value={8192}>8192 tokens</option>
                  </select>
                </div>

                {/* Temperature */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature: {formData.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => handleNumberChange('temperature', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Response Length */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Response Length Preference
                  </label>
                  <select
                    name="responseLength"
                    value={formData.responseLength}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="short">Short (concise answers)</option>
                    <option value="medium">Medium (balanced)</option>
                    <option value="long">Long (detailed explanations)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? mode === 'edit'
                    ? 'Updating...'
                    : 'Creating...'
                  : mode === 'edit'
                  ? 'Update Model'
                  : 'Create Model'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
