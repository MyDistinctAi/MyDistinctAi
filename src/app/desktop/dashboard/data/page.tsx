'use client'

/**
 * Desktop Training Data Page
 * Upload and manage training documents
 */

import { useEffect, useState } from 'react'
import { Upload, FileText, Trash2 } from 'lucide-react'
import { open } from '@tauri-apps/plugin-dialog'
import { listModels, type Model } from '@/lib/desktop/models-service'
import { listTrainingData, processAndStoreFile, deleteTrainingData, type TrainingData } from '@/lib/desktop/training-data-service'
import { getOfflineUser } from '@/lib/offline-auth'

export default function DesktopDataPage() {
    const [models, setModels] = useState<Model[]>([])
    const [selectedModelId, setSelectedModelId] = useState<string>('')
    const [trainingData, setTrainingData] = useState<TrainingData[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        loadModels()
    }, [])

    useEffect(() => {
        if (selectedModelId) {
            loadTrainingData(selectedModelId)
        }
    }, [selectedModelId])

    const loadModels = async () => {
        try {
            const user = await getOfflineUser()
            if (user) {
                const modelsList = await listModels(user.userId)
                setModels(modelsList)
                if (modelsList.length > 0 && !selectedModelId) {
                    setSelectedModelId(modelsList[0].id)
                }
            }
        } catch (error) {
            console.error('Failed to load models:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadTrainingData = async (modelId: string) => {
        try {
            const data = await listTrainingData(modelId)
            setTrainingData(data)
        } catch (error) {
            console.error('Failed to load training data:', error)
        }
    }

    const handleFileUpload = async () => {
        if (!selectedModelId) {
            alert('Please select a model first')
            return
        }

        try {
            // Use Tauri file dialog
            const selected = await open({
                multiple: false,
                filters: [{
                    name: 'Documents',
                    extensions: ['pdf', 'txt', 'docx', 'md']
                }]
            })

            if (selected && typeof selected === 'string') {
                setUploading(true)
                const fileName = selected.split(/[\\/]/).pop() || 'unknown'

                await processAndStoreFile({
                    modelId: selectedModelId,
                    filePath: selected,
                    fileName: fileName,
                    embeddingModel: 'nomic-embed-text',
                    chunkSize: 500,
                    overlap: 50,
                })

                await loadTrainingData(selectedModelId)
                alert('File processed successfully!')
            }
        } catch (error) {
            console.error('Failed to upload file:', error)
            alert('Failed to upload file: ' + error)
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this training data?')) {
            try {
                await deleteTrainingData(id)
                await loadTrainingData(selectedModelId)
            } catch (error) {
                console.error('Failed to delete:', error)
            }
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (models.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-12 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No models available</h3>
                <p className="text-gray-600">Create a model first before uploading training data</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Training Data</h1>
                <p className="text-gray-600 mt-1">Upload documents to train your AI models</p>
            </div>

            {/* Model Selector */}
            <div className="bg-white rounded-lg shadow p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Model</label>
                <select
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                    {models.map((model) => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                </select>
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Documents</h2>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">Upload PDF, DOCX, TXT, or MD files</p>
                    <button
                        onClick={handleFileUpload}
                        disabled={uploading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {uploading ? 'Processing...' : 'Choose File'}
                    </button>
                </div>
            </div>

            {/* Training Data List */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Uploaded Documents</h2>
                </div>
                {trainingData.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        No training data uploaded yet
                    </div>
                ) : (
                    <div className="divide-y">
                        {trainingData.map((data) => (
                            <div key={data.id} className="px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="font-medium text-gray-900">{data.file_name}</p>
                                        <p className="text-sm text-gray-500">
                                            {data.chunks_count} chunks • {new Date(data.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(data.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
