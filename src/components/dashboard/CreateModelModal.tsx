'use client'

/**
 * Create Model Modal
 *
 * Modal for creating new AI models with form validation
 */

import { useState } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'

interface CreateModelModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ModelFormData) => Promise<void>
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

const BASE_MODELS = [
  // OpenRouter Models (Cloud - FREE)
  { value: 'google/gemini-flash-1.5-8b', label: 'Gemini Flash 1.5 8B (FREE - Cloud)' },
  { value: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B (FREE - Cloud)' },
  { value: 'qwen/qwen-2.5-72b-instruct:free', label: 'Qwen 2.5 72B (FREE - Cloud)' },
  // Ollama Models (Local - Desktop Only)
  { value: 'mistral:7b', label: 'Mistral 7B (Local)' },
  { value: 'llama2:7b', label: 'Llama 2 7B (Local)' },
  { value: 'llama2:13b', label: 'Llama 2 13B (Local)' },
  { value: 'phi:2', label: 'Phi-2 (Local)' },
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

export default function CreateModelModal({ isOpen, onClose, onSubmit }: CreateModelModalProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ModelFormData, string>>>({})

  const [formData, setFormData] = useState<ModelFormData>({
    name: '',
    description: '',
    baseModel: 'google/gemini-flash-1.5-8b',
    trainingMode: 'standard',
    personality: '',
    learningRate: 0.0001,
    maxContextLength: 2048,
    temperature: 0.7,
    responseLength: 'medium',
  })

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

    try {
      await onSubmit(formData)
      // Reset form
      setFormData({
        name: '',
        description: '',
        baseModel: 'google/gemini-flash-1.5-8b',
        trainingMode: 'standard',
        personality: '',
        learningRate: 0.0001,
        maxContextLength: 2048,
        temperature: 0.7,
        responseLength: 'medium',
      })
      onClose()
    } catch (error) {
      console.error('Error creating model:', error)
      setErrors({ name: 'Failed to create model. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
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
            <h2 className="text-xl font-semibold text-gray-900">Create New Model</h2>
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
                {isSubmitting ? 'Creating...' : 'Create Model'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
