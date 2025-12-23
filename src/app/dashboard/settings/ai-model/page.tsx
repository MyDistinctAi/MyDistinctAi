/**
 * AI Model Settings Page
 * 
 * Allows users to select their preferred AI model for chat
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAllModels, FREE_MODELS } from '@/lib/openrouter/client'
import { Check, Zap, Brain, Globe } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AIModelSettingsPage() {
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  // Load user's current preference
  useEffect(() => {
    async function loadPreference() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: userData } = await supabase
          .from('users')
          .select('preferred_ai_model')
          .eq('id', user.id)
          .single()

        if (userData?.preferred_ai_model) {
          setSelectedModel(userData.preferred_ai_model)
        } else {
          setSelectedModel(FREE_MODELS.GEMINI_FLASH.id)
        }
      } catch (error) {
        console.error('Error loading preference:', error)
        setSelectedModel(FREE_MODELS.GEMINI_FLASH.id)
      } finally {
        setLoading(false)
      }
    }

    loadPreference()
  }, [supabase])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('users')
        .update({ preferred_ai_model: selectedModel })
        .eq('id', user.id)

      if (error) throw error

      toast.success('AI model preference saved!')
    } catch (error) {
      console.error('Error saving preference:', error)
      toast.error('Failed to save preference')
    } finally {
      setSaving(false)
    }
  }

  const models = getAllModels()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Model Settings</h1>
        <p className="text-gray-600">
          Choose your preferred AI model for chat. All models are completely free!
        </p>
      </div>

      {/* Model Selection Cards */}
      <div className="space-y-4 mb-8">
        {models.map((model) => {
          const isSelected = selectedModel === model.id
          
          return (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`w-full text-left p-6 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {model.name}
                    </h3>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                      FREE
                    </span>
                    {isSelected && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">{model.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-600" />
                      <span className="text-gray-700">
                        <strong>Speed:</strong> {model.speed}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-600" />
                      <span className="text-gray-700">
                        <strong>Quality:</strong> {model.quality}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700">
                        <strong>Context:</strong> {(model.contextWindow / 1000).toLocaleString()}K tokens
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500">
                    Provider: {model.provider}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Model Comparison</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Context Window
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Speed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Best For
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {models.map((model) => (
                <tr key={model.id} className={selectedModel === model.id ? 'bg-blue-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{model.name}</div>
                    <div className="text-xs text-gray-500">{model.provider}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(model.contextWindow / 1000).toLocaleString()}K
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {model.speed}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {model.description.replace('Best for ', '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Preference'}
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Pro Tip</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>DeepSeek Chat</strong>: Best for coding and technical tasks</li>
          <li>• <strong>Gemini 2.0 Flash</strong>: Best for long documents (1M tokens context)</li>
          <li>• <strong>Llama 3.3 70B</strong>: Best for complex reasoning and quality responses</li>
          <li>• <strong>Qwen 2.5 72B</strong>: Best for multilingual conversations</li>
          <li>• All models are completely free with no usage limits!</li>
        </ul>
      </div>
    </div>
  )
}
