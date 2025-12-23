'use client'

/**
 * Desktop Settings Page
 * Manage desktop app preferences
 */

import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Database, Cpu } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'
import { getOfflineUser } from '@/lib/offline-auth'

export default function DesktopSettingsPage() {
    const [ollamaModels, setOllamaModels] = useState<string[]>([])
    const [selectedEmbeddingModel, setSelectedEmbeddingModel] = useState('nomic-embed-text')
    const [selectedChatModel, setSelectedChatModel] = useState('mistral:7b')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            // Load available Ollama models
            const models = await invoke<string[]>('list_ollama_models')
            setOllamaModels(models)

            // Load saved preferences
            try {
                const embeddingPref = await invoke<string>('load_user_data', { key: 'pref_embedding_model' })
                if (embeddingPref) setSelectedEmbeddingModel(JSON.parse(embeddingPref))
            } catch { }

            try {
                const chatPref = await invoke<string>('load_user_data', { key: 'pref_chat_model' })
                if (chatPref) setSelectedChatModel(JSON.parse(chatPref))
            } catch { }
        } catch (error) {
            console.error('Failed to load settings:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            await invoke('save_user_data', {
                key: 'pref_embedding_model',
                data: JSON.stringify(selectedEmbeddingModel)
            })
            await invoke('save_user_data', {
                key: 'pref_chat_model',
                data: JSON.stringify(selectedChatModel)
            })
            alert('Settings saved successfully!')
        } catch (error) {
            console.error('Failed to save settings:', error)
            alert('Failed to save settings')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-1">Configure your desktop app preferences</p>
            </div>

            {/* AI Model Settings */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Cpu className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">AI Model Preferences</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Embedding Model
                        </label>
                        <select
                            value={selectedEmbeddingModel}
                            onChange={(e) => setSelectedEmbeddingModel(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {ollamaModels.filter(m => m.includes('embed')).map((model) => (
                                <option key={model} value={model}>{model}</option>
                            ))}
                            <option value="nomic-embed-text">nomic-embed-text (default)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Used for generating vector embeddings from training data
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chat Model
                        </label>
                        <select
                            value={selectedChatModel}
                            onChange={(e) => setSelectedChatModel(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {ollamaModels.filter(m => !m.includes('embed')).map((model) => (
                                <option key={model} value={model}>{model}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Used for AI chat responses
                        </p>
                    </div>
                </div>
            </div>

            {/* Data Management */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Database className="w-5 h-5 text-green-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h3 className="font-medium text-gray-900">Local Database</h3>
                            <p className="text-sm text-gray-600">All data is stored locally on your device</p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                            Active
                        </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h3 className="font-medium text-gray-900">Vector Database (LanceDB)</h3>
                            <p className="text-sm text-gray-600">Stores embeddings for RAG</p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                            Active
                        </span>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Save Settings
                </button>
            </div>
        </div>
    )
}
