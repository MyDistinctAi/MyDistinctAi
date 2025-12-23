'use client'

/**
 * Desktop Models Page
 * 
 * Matches webapp design with:
 * - Model grid with search/sort
 * - Create modal with file upload
 * - Files processed as training data after model creation
 */

import { useEffect, useState, useMemo } from 'react'
import { Plus, Trash2, Search, Brain, MessageSquare, FileText, Upload, X, Check } from 'lucide-react'
import Link from 'next/link'
import { open } from '@tauri-apps/plugin-dialog'
import { getOfflineUser } from '@/lib/offline-auth'
import { listModels, createModel, deleteModel, type Model } from '@/lib/desktop/models-service'
import { listTrainingData, processAndStoreFile } from '@/lib/desktop/training-data-service'

// Local Ollama models
const LOCAL_MODELS = [
    { value: 'mistral:7b', label: 'Mistral 7B' },
    { value: 'llama2:7b', label: 'Llama 2 7B' },
    { value: 'llama3:8b', label: 'Llama 3 8B' },
    { value: 'phi:2', label: 'Phi-2' },
    { value: 'codellama:7b', label: 'Code Llama 7B' },
]

interface ModelWithDocs extends Model {
    documentCount: number
    documents: any[]
}

export default function DesktopModelsPage() {
    const [models, setModels] = useState<ModelWithDocs[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState('date')

    // Create modal state
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        baseModel: 'mistral:7b',
        systemPrompt: ''
    })
    const [selectedFiles, setSelectedFiles] = useState<{ name: string; path: string; size: number }[]>([])
    const [uploadStatus, setUploadStatus] = useState('')
    const [errors, setErrors] = useState<{ name?: string }>({})

    // Delete state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [modelToDelete, setModelToDelete] = useState<Model | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        loadModels()
    }, [])

    const loadModels = async () => {
        try {
            const user = await getOfflineUser()
            if (user) {
                const modelsList = await listModels(user.userId)

                // Fetch document counts for each model
                const modelsWithDocs: ModelWithDocs[] = await Promise.all(
                    modelsList.map(async (model) => {
                        try {
                            const docs = await listTrainingData(model.id)
                            return {
                                ...model,
                                documentCount: docs.length,
                                documents: docs.slice(0, 3) // First 3 for preview
                            }
                        } catch {
                            return { ...model, documentCount: 0, documents: [] }
                        }
                    })
                )
                setModels(modelsWithDocs)
            }
        } catch (error) {
            console.error('Failed to load models:', error)
        } finally {
            setLoading(false)
        }
    }

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

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name)
                case 'date':
                default:
                    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            }
        })

        return filtered
    }, [models, searchQuery, sortBy])

    const handleSelectFiles = async () => {
        try {
            const selected = await open({
                multiple: true,
                filters: [
                    { name: 'Documents', extensions: ['txt', 'pdf', 'docx', 'md'] }
                ]
            })

            if (selected && Array.isArray(selected)) {
                const files = selected.map(path => ({
                    name: path.split(/[\\/]/).pop() || 'Unknown',
                    path: path,
                    size: 0 // Size will be determined during processing
                }))
                setSelectedFiles(prev => [...prev, ...files])
            }
        } catch (error) {
            console.error('Failed to select files:', error)
        }
    }

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleCreateModel = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate
        if (!formData.name.trim()) {
            setErrors({ name: 'Model name is required' })
            return
        }

        setIsSubmitting(true)
        setUploadStatus('Creating model...')

        try {
            const user = await getOfflineUser()
            if (!user) throw new Error('No user found')

            // Create model
            const newModel = await createModel({
                user_id: user.userId,
                name: formData.name,
                description: formData.description,
                system_prompt: formData.systemPrompt || null,
            })

            // Process files if any
            if (selectedFiles.length > 0) {
                for (let i = 0; i < selectedFiles.length; i++) {
                    const file = selectedFiles[i]
                    setUploadStatus(`Processing file ${i + 1}/${selectedFiles.length}: ${file.name}...`)

                    try {
                        // Use existing processAndStoreFile from training-data-service
                        await processAndStoreFile({
                            modelId: newModel.id,
                            filePath: file.path,
                            fileName: file.name,
                            embeddingModel: 'nomic-embed-text',
                            chunkSize: 500,
                            overlap: 50,
                            encrypt: false,
                            password: null
                        })
                        setUploadStatus(`✅ Processed ${file.name}`)
                    } catch (err) {
                        console.error(`Failed to process ${file.name}:`, err)
                        setUploadStatus(`❌ Failed to process ${file.name}`)
                    }
                }
                setUploadStatus('✅ All files processed!')
            }

            // Reset form
            setFormData({ name: '', description: '', baseModel: 'mistral:7b', systemPrompt: '' })
            setSelectedFiles([])
            setUploadStatus('')
            setErrors({})

            // Close modal and refresh
            setTimeout(() => {
                setShowCreateModal(false)
                loadModels()
            }, 1000)

        } catch (error) {
            console.error('Failed to create model:', error)
            setErrors({ name: 'Failed to create model. Please try again.' })
            setUploadStatus('')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteModel = async () => {
        if (!modelToDelete) return

        setIsDeleting(true)
        try {
            await deleteModel(modelToDelete.id)
            setModels(prev => prev.filter(m => m.id !== modelToDelete.id))
            setDeleteDialogOpen(false)
            setModelToDelete(null)
        } catch (error) {
            console.error('Failed to delete model:', error)
            alert('Failed to delete model')
        } finally {
            setIsDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
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
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Create New Model
                </button>
            </div>

            {/* Search and Filter */}
            <div className="bg-white shadow rounded-lg p-4">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="search"
                            placeholder="Search models..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="date">Sort by: Date</option>
                        <option value="name">Sort by: Name</option>
                    </select>
                </div>
            </div>

            {/* Models Grid */}
            {filteredModels.length === 0 ? (
                <div className="bg-white shadow rounded-lg p-12">
                    <div className="text-center">
                        <Brain className="mx-auto h-16 w-16 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">
                            {searchQuery ? 'No models found' : 'No models yet'}
                        </h3>
                        <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                            {searchQuery
                                ? 'Try adjusting your search'
                                : 'Get started by creating your first AI model. Upload training data and customize it to match your needs.'}
                        </p>
                        {!searchQuery && (
                            <div className="mt-6">
                                <button
                                    onClick={() => setShowCreateModal(true)}
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
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{model.description}</p>

                                    {/* Document Count Badge */}
                                    {model.documentCount > 0 && (
                                        <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            <FileText className="h-3 w-3 mr-1" />
                                            {model.documentCount} document{model.documentCount !== 1 ? 's' : ''}
                                        </div>
                                    )}

                                    {/* Document Names */}
                                    {model.documents.length > 0 && (
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
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Ready
                                </span>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                                <span>Updated {new Date(model.updated_at).toLocaleDateString()}</span>
                                <div className="flex space-x-2">
                                    <Link
                                        href={`/desktop/dashboard/chat?modelId=${model.id}`}
                                        className="text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Chat
                                    </Link>
                                    <span className="text-gray-300">|</span>
                                    <button
                                        onClick={() => {
                                            setModelToDelete(model)
                                            setDeleteDialogOpen(true)
                                        }}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Model Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                        onClick={() => !isSubmitting && setShowCreateModal(false)}
                    />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">Create New Model</h2>
                                <button
                                    onClick={() => !isSubmitting && setShowCreateModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleCreateModel} className="p-6 space-y-6">
                                {/* Model Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Model Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => {
                                            setFormData(prev => ({ ...prev, name: e.target.value }))
                                            setErrors({})
                                        }}
                                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="e.g., Customer Support Bot"
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Describe what this model will be used for..."
                                    />
                                </div>

                                {/* Base Model */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        AI Model
                                    </label>
                                    <select
                                        value={formData.baseModel}
                                        onChange={(e) => setFormData(prev => ({ ...prev, baseModel: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {LOCAL_MODELS.map((model) => (
                                            <option key={model.value} value={model.value}>
                                                {model.label}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Local Ollama model for chat responses</p>
                                </div>

                                {/* System Prompt */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        System Prompt
                                    </label>
                                    <textarea
                                        value={formData.systemPrompt}
                                        onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., You are a helpful assistant that answers questions based on the provided documents..."
                                    />
                                </div>

                                {/* Training Data Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Training Data (Optional)
                                    </label>
                                    <div
                                        onClick={handleSelectFiles}
                                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                                    >
                                        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                        <span className="text-sm text-gray-600 block mb-1">
                                            Click to select files
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            PDF, TXT, DOCX, MD files supported
                                        </span>
                                    </div>

                                    {/* Selected Files */}
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
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            <p className="text-xs text-gray-600">
                                                💡 These files will be processed as training data after model creation
                                            </p>
                                        </div>
                                    )}

                                    {/* Upload Status */}
                                    {uploadStatus && (
                                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                {uploadStatus.includes('✅') ? (
                                                    <Check className="h-4 w-4 text-green-600" />
                                                ) : uploadStatus.includes('❌') ? (
                                                    <X className="h-4 w-4 text-red-600" />
                                                ) : (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                )}
                                                <p className="text-sm font-medium text-blue-900">{uploadStatus}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Form Actions */}
                                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => !isSubmitting && setShowCreateModal(false)}
                                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                        disabled={isSubmitting}
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
            )}

            {/* Delete Confirmation Dialog */}
            {deleteDialogOpen && modelToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50"
                        onClick={() => !isDeleting && setDeleteDialogOpen(false)}
                    />
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Model</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete <strong>{modelToDelete.name}</strong>?
                            This will also delete all associated training data and chat sessions.
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteDialogOpen(false)}
                                disabled={isDeleting}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteModel}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
