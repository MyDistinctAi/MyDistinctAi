'use client'

/**
 * Models Page Client Component
 *
 * Client-side wrapper for models page with modal state management,
 * edit/delete functionality, and search/filter/sort features
 */

import { useState, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import CreateModelModal, { type ModelFormData } from './CreateModelModal'
import DeleteConfirmDialog from './DeleteConfirmDialog'
import TrainingProgress from './TrainingProgress'

interface ModelsPageClientProps {
  initialModels: any[]
}

export default function ModelsPageClient({ initialModels }: ModelsPageClientProps) {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingModel, setEditingModel] = useState<any>(null)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [modelToDelete, setModelToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Models and training states
  const [models, setModels] = useState(initialModels)
  const [trainingModelId, setTrainingModelId] = useState<string | null>(null)

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')

  // Filtered and sorted models
  const filteredModels = useMemo(() => {
    let filtered = [...models]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (model) =>
          model.name.toLowerCase().includes(query) ||
          model.description?.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((model) => model.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'status':
          return a.status.localeCompare(b.status)
        case 'date':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
    })

    return filtered
  }, [models, searchQuery, statusFilter, sortBy])

  const handleCreateModel = async (data: ModelFormData, files?: File[]) => {
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

      // Upload training files if any
      if (files && files.length > 0) {
        console.log(`Uploading ${files.length} training files for model ${newModel.id}`)
        
        for (const file of files) {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('modelId', newModel.id)

          try {
            const uploadResponse = await fetch('/api/training/upload', {
              method: 'POST',
              body: formData,
            })

            if (!uploadResponse.ok) {
              console.error(`Failed to upload ${file.name}`)
            } else {
              console.log(`✅ Uploaded ${file.name}`)
            }
          } catch (uploadError) {
            console.error(`Error uploading ${file.name}:`, uploadError)
          }
        }
      }

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

  const handleEditModel = async (data: ModelFormData) => {
    if (!editingModel) return

    try {
      const response = await fetch(`/api/models/${editingModel.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update model')
      }

      const updatedModel = await response.json()

      // Update in models list
      setModels((prev) =>
        prev.map((model) => (model.id === updatedModel.id ? updatedModel : model))
      )

      // Close modal
      setIsModalOpen(false)
      setEditingModel(null)
    } catch (error) {
      console.error('Error updating model:', error)
      throw error
    }
  }

  const handleDeleteModel = async () => {
    if (!modelToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/models/${modelToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete model')
      }

      // Remove from models list
      setModels((prev) => prev.filter((model) => model.id !== modelToDelete.id))

      // Close dialog
      setDeleteDialogOpen(false)
      setModelToDelete(null)
    } catch (error) {
      console.error('Error deleting model:', error)
      alert('Failed to delete model. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const openEditModal = (model: any) => {
    setEditingModel(model)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const openDeleteDialog = (model: any) => {
    setModelToDelete(model)
    setDeleteDialogOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingModel(null)
    setModalMode('create')
  }

  const handleTrainingClose = () => {
    setTrainingModelId(null)
    // Optionally refresh models list to get updated status
    window.location.reload()
  }

  // Prepare initial data for edit mode
  const modalInitialData = editingModel
    ? {
        name: editingModel.name,
        description: editingModel.description || '',
        baseModel: editingModel.base_model,
        trainingMode: editingModel.config?.trainingMode || 'standard',
        personality: editingModel.config?.personality || '',
        learningRate: editingModel.config?.learningRate,
        maxContextLength: editingModel.config?.maxContextLength,
        temperature: editingModel.config?.temperature,
        responseLength: editingModel.config?.responseLength,
      }
    : undefined

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
            onClick={() => {
              setModalMode('create')
              setEditingModel(null)
              setIsModalOpen(true)
            }}
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="training">Training</option>
                <option value="ready">Ready</option>
                <option value="failed">Failed</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Sort by: Date</option>
                <option value="name">Sort by: Name</option>
                <option value="status">Sort by: Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Models Grid */}
        {filteredModels.length === 0 ? (
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
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {searchQuery || statusFilter !== 'all' ? 'No models found' : 'No models yet'}
              </h3>
              <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first AI model. Upload training data and customize it to match your needs.'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setModalMode('create')
                      setEditingModel(null)
                      setIsModalOpen(true)
                    }}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Model
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredModels.map((model) => (
              <div
                key={model.id}
                className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{model.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{model.description}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      AI Model: {model.base_model}
                    </p>
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
                        <button
                          onClick={() => openEditModal(model)}
                          className="text-gray-600 hover:text-gray-700 font-medium"
                        >
                          Edit
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => openDeleteDialog(model)}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Create/Edit Model Modal */}
      <CreateModelModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={modalMode === 'edit' ? handleEditModel : handleCreateModel}
        mode={modalMode}
        initialData={modalInitialData}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setModelToDelete(null)
        }}
        onConfirm={handleDeleteModel}
        title="Delete Model"
        description="Are you sure you want to delete this model? This will also delete all associated training data, embeddings, and chat sessions. This action cannot be undone."
        itemName={modelToDelete?.name}
        isDeleting={isDeleting}
      />

      {/* Training Progress Modal */}
      {trainingModelId && (
        <TrainingProgress modelId={trainingModelId} onClose={handleTrainingClose} />
      )}
    </>
  )
}
