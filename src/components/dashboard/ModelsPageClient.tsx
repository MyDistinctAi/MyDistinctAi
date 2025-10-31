'use client'

/**
 * Models Page Client Component
 *
 * Client-side wrapper for models page with modal state management
 */

import { useState } from 'react'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import CreateModelModal, { type ModelFormData } from './CreateModelModal'
import TrainingProgress from './TrainingProgress'

interface ModelsPageClientProps {
  initialModels: any[]
}

export default function ModelsPageClient({ initialModels }: ModelsPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [models, setModels] = useState(initialModels)
  const [trainingModelId, setTrainingModelId] = useState<string | null>(null)

  const handleCreateModel = async (data: ModelFormData) => {
    try {
      // Send to API to create model in Supabase
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create model')
      }

      const newModel = await response.json()

      // Add to models list (optimistic update)
      setModels((prev) => [newModel, ...prev])

      // Close modal
      setIsModalOpen(false)

      // Show training progress if model status is 'training'
      if (newModel.status === 'training') {
        setTrainingModelId(newModel.id)
      }
    } catch (error) {
      console.error('Error creating model:', error)
      throw error
    }
  }

  const handleTrainingClose = () => {
    setTrainingModelId(null)
    // Optionally refresh models list to get updated status
    window.location.reload()
  }

  return (
    <>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Models</h1>
            <p className="text-gray-600 mt-1">
              Manage your custom AI models and training data
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Model
          </button>
        </div>

        {/* Filter and Search */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="search"
                placeholder="Search models..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All Status</option>
                <option>Training</option>
                <option>Ready</option>
                <option>Failed</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Sort by: Date</option>
                <option>Sort by: Name</option>
                <option>Sort by: Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Models Grid */}
        {models.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12">
            <div className="text-center">
              <div className="mx-auto h-24 w-24 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No models yet</h3>
              <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                Get started by creating your first AI model. Upload training data and customize it
                to match your needs.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Model
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {models.map((model) => (
              <div
                key={model.id}
                className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{model.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{model.description}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      model.status === 'ready'
                        ? 'bg-green-100 text-green-800'
                        : model.status === 'training'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {model.status === 'ready'
                      ? 'Ready'
                      : model.status === 'training'
                      ? 'Training'
                      : 'Failed'}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <span>Updated {new Date(model.updated_at).toLocaleDateString()}</span>
                  <div className="flex space-x-2">
                    {model.status === 'training' ? (
                      <button
                        onClick={() => setTrainingModelId(model.id)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Progress
                      </button>
                    ) : (
                      <>
                        <Link
                          href={`/dashboard/chat/${model.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Chat
                        </Link>
                        <span className="text-gray-300">|</span>
                        <button className="text-gray-600 hover:text-gray-700 font-medium">
                          Edit
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Model Modal */}
      <CreateModelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateModel}
      />

      {/* Training Progress Modal */}
      {trainingModelId && (
        <TrainingProgress modelId={trainingModelId} onClose={handleTrainingClose} />
      )}
    </>
  )
}
