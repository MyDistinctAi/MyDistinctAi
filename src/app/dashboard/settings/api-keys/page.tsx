/**
 * API Keys Management Page
 *
 * Generate and manage API keys for integration
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Key, Copy, Trash2, Plus, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  key: string
  created_at: string
  last_used: string | null
  usage_count: number
}

export default function ApiKeysPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push('/login')
        return
      }

      // Get API keys from database
      const { data: keysData, error: keysError } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (keysError) {
        console.error('Error fetching API keys:', keysError)
        setError('Failed to load API keys')
      } else if (keysData) {
        setKeys(keysData as ApiKey[])
      }
    } catch (err) {
      console.error('Error in fetchApiKeys:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      setError('Please enter a name for the API key')
      return
    }

    try {
      setCreating(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Not authenticated')
        return
      }

      // Generate API key
      const apiKey = `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`

      // Save to database
      const { data, error: insertError } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: newKeyName,
          key: apiKey,
          usage_count: 0,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating API key:', insertError)
        setError('Failed to create API key')
        return
      }

      // Show the newly created key (only time it's visible in full)
      setNewlyCreatedKey(apiKey)
      setNewKeyName('')
      await fetchApiKeys()
    } catch (err) {
      console.error('Error in handleCreateKey:', err)
      setError('An unexpected error occurred')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return
    }

    try {
      const { error: deleteError } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)

      if (deleteError) {
        console.error('Error deleting API key:', deleteError)
        setError('Failed to delete API key')
        return
      }

      await fetchApiKeys()
    } catch (err) {
      console.error('Error in handleDeleteKey:', err)
      setError('An unexpected error occurred')
    }
  }

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(keyId)) {
        newSet.delete(keyId)
      } else {
        newSet.add(keyId)
      }
      return newSet
    })
  }

  const copyToClipboard = async (key: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(key)
      setCopiedKey(keyId)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const maskKey = (key: string) => {
    return `${key.substring(0, 8)}${'*'.repeat(key.length - 12)}${key.substring(key.length - 4)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/dashboard/settings')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Settings
        </button>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">API Keys</h1>
            <p className="text-gray-600">
              Generate and manage API keys for programmatic access
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create API Key
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Newly Created Key Notice */}
        {newlyCreatedKey && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <Check className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-900">API Key Created Successfully</h3>
            </div>
            <p className="text-sm text-green-700 mb-3">
              Make sure to copy your API key now. You won't be able to see it again!
            </p>
            <div className="flex items-center gap-2 bg-white p-3 rounded border border-green-300">
              <code className="flex-1 text-sm font-mono text-gray-900 break-all">
                {newlyCreatedKey}
              </code>
              <button
                onClick={() => copyToClipboard(newlyCreatedKey, 'new')}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
              >
                {copiedKey === 'new' ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5 text-gray-600" />
                )}
              </button>
            </div>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="mt-3 text-sm text-green-700 hover:text-green-900 underline"
            >
              I've saved my API key
            </button>
          </div>
        )}

        {/* API Keys List */}
        <div className="space-y-4">
          {keys.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No API Keys Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first API key to start integrating with MyDistinctAI
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Create API Key
              </button>
            </div>
          ) : (
            keys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{apiKey.name}</h3>
                    <p className="text-sm text-gray-600">
                      Created {new Date(apiKey.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteKey(apiKey.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 bg-gray-50 p-3 rounded border border-gray-200">
                    <code className="flex-1 text-sm font-mono text-gray-900">
                      {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                    </code>
                    <button
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                    >
                      {visibleKeys.has(apiKey.id) ? (
                        <EyeOff className="h-5 w-5 text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                    >
                      {copiedKey === apiKey.id ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <Copy className="h-5 w-5 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Usage:</span> {apiKey.usage_count} requests
                  </div>
                  {apiKey.last_used && (
                    <div>
                      <span className="font-medium">Last used:</span>{' '}
                      {new Date(apiKey.last_used).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* API Documentation */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">API Documentation</h3>
          <p className="text-sm text-blue-700 mb-4">
            Use your API keys to authenticate requests to the MyDistinctAI API. Include the key in the
            Authorization header:
          </p>
          <code className="block bg-white p-3 rounded border border-blue-300 text-sm font-mono text-gray-900">
            Authorization: Bearer YOUR_API_KEY
          </code>
          <a
            href="/dashboard/docs"
            className="inline-block mt-4 text-sm text-blue-700 hover:text-blue-900 underline"
          >
            View full API documentation →
          </a>
        </div>
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create API Key</h2>

            <div className="mb-6">
              <label
                htmlFor="keyName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Key Name
              </label>
              <input
                type="text"
                id="keyName"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production Server"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Choose a descriptive name to help you identify this key later
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewKeyName('')
                  setError(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKey}
                disabled={creating || !newKeyName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? 'Creating...' : 'Create Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
