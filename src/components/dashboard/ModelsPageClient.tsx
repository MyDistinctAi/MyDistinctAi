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
import dynamic from 'next/dynamic'
import { type ModelFormData } from './CreateModelModal'
import { DocumentCount } from '@/components/DocumentList'

// Dynamically import heavy components to reduce initial bundle size
const CreateModelModal = dynamic(() => import('./CreateModelModal'), {
  loading: () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>
})
const DeleteConfirmDialog = dynamic(() => import('./DeleteConfirmDialog'))
const TrainingProgress = dynamic(() => import('./TrainingProgress'))

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

  // Bulk delete state
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set())
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // Models and training states
  const [models, setModels] = useState(initialModels)
  const [trainingModelId, setTrainingModelId] = useState<string | null>(null)

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

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

  // Paginated models
  const paginatedModels = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredModels.slice(startIndex, endIndex)
  }, [filteredModels, currentPage, ITEMS_PER_PAGE])

  // Pagination info
  const totalPages = Math.ceil(filteredModels.length / ITEMS_PER_PAGE)
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, sortBy])

  const handleCreateModel = async (data: ModelFormData, files?: File[], onProgress?: (status: string) => void) => {
    try {
      // Send to API to create model in Supabase
      onProgress?.('Creating model...')
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
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          onProgress?.(`Processing file ${i + 1}/${files.length}: ${file.name}...`)
          
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
              onProgress?.(`❌ Failed to process ${file.name}`)
            } else {
              const result = await uploadResponse.json()
              console.log(`✅ Uploaded and processed ${file.name}`, result)
              onProgress?.(`✅ Processed ${file.name} (${result.file?.stats?.embeddings || 0} embeddings)`)
            }
          } catch (uploadError) {
            console.error(`Error uploading ${file.name}:`, uploadError)
            onProgress?.(`❌ Error processing ${file.name}`)
          }
        }
        
        onProgress?.(`✅ All files processed successfully!`)

        // Refresh the model to get updated document count
        onProgress?.('Refreshing model data...')
        const refreshResponse = await fetch(`/api/models/${newModel.id}`)
        if (refreshResponse.ok) {
          const updatedModel = await refreshResponse.json()
          setModels((prev) => prev.map(m => m.id === updatedModel.id ? updatedModel : m))
          console.log(`✅ Model refreshed with ${updatedModel.document_count || 0} documents`)
        }
      }

      // Close modal after a brief delay to show success message
      setTimeout(() => {
        setIsModalOpen(false)
      }, 1500)

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

  const handleBulkDelete = async () => {
    if (selectedModels.size === 0) return

    setIsBulkDeleting(true)
    try {
      const deletePromises = Array.from(selectedModels).map(modelId =>
        fetch(`/api/models/${modelId}`, { method: 'DELETE' })
      )

      const results = await Promise.allSettled(deletePromises)

      const failedCount = results.filter(r => r.status === 'rejected').length
      const successCount = results.filter(r => r.status === 'fulfilled').length

      // Remove successfully deleted models from the list
      setModels((prev) => prev.filter((model) => !selectedModels.has(model.id)))

      // Clear selection
      setSelectedModels(new Set())

      // Close dialog
      setBulkDeleteDialogOpen(false)

      if (failedCount > 0) {
        alert(`Deleted ${successCount} models. ${failedCount} failed to delete.`)
      }
    } catch (error) {
      console.error('Error bulk deleting models:', error)
      alert('Failed to delete models. Please try again.')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const toggleModelSelection = (modelId: string) => {
    setSelectedModels(prev => {
      const newSet = new Set(prev)
      if (newSet.has(modelId)) {
        newSet.delete(modelId)
      } else {
        newSet.add(modelId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedModels.size === paginatedModels.length) {
      setSelectedModels(new Set())
    } else {
      setSelectedModels(new Set(paginatedModels.map(m => m.id)))
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
          <div className="flex gap-2">
            {selectedModels.size > 0 && (
              <button
                onClick={() => setBulkDeleteDialogOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Delete Selected ({selectedModels.size})
              </button>
            )}
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
        </div>

        {/* Filter and Search */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {paginatedModels.length > 0 && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedModels.size === paginatedModels.length && paginatedModels.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <label className="text-sm text-gray-700 whitespace-nowrap">
                  Select All
                </label>
              </div>
            )}
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
            {paginatedModels.map((model) => (
              <div
                key={model.id}
                className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow relative"
              >
                {/* Checkbox for bulk selection */}
                <div className="absolute top-4 left-4">
                  <input
                    type="checkbox"
                    checked={selectedModels.has(model.id)}
                    onChange={() => toggleModelSelection(model.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />
                </div>
                <div className="flex items-start justify-between pl-8">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{model.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{model.description}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      AI Model: {model.base_model}
                    </p>

                    {/* Document Count Badge */}
                    {model.documentCount > 0 && (
                      <div className="mt-2">
                        <DocumentCount count={model.documentCount} />
                      </div>
                    )}

                    {/* Document Names (truncated) */}
                    {model.documents && model.documents.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500 space-y-1">
                        {model.documents.slice(0, 2).map((doc: any) => (
                          <div key={doc.id} className="truncate flex items-center">
                            <span className="text-gray-400 mr-1">•</span>
                            <span>{doc.file_name}</span>
                          </div>
                        ))}
                        {model.documents.length > 2 && (
                          <div className="text-gray-400 italic">
                            +{model.documents.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
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

        {/* Pagination Controls */}
        {filteredModels.length > ITEMS_PER_PAGE && (
          <div className="mt-8 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow">
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
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredModels.length)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{filteredModels.length}</span> models
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        currentPage === page
                          ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
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

      {/* Bulk Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Multiple Models"
        description={`Are you sure you want to delete ${selectedModels.size} selected model${selectedModels.size !== 1 ? 's' : ''}? This will also delete all associated training data, embeddings, and chat sessions. This action cannot be undone.`}
        itemName={`${selectedModels.size} model${selectedModels.size !== 1 ? 's' : ''}`}
        isDeleting={isBulkDeleting}
      />

      {/* Training Progress Modal */}
      {trainingModelId && (
        <TrainingProgress modelId={trainingModelId} onClose={handleTrainingClose} />
      )}
    </>
  )
}
