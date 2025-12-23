/**
 * API Keys Management Page
 *
 * Allows users to create, view, and manage API keys for programmatic access
 */

'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Key, Plus, Copy, Eye, EyeOff, Trash2, Check, Code } from 'lucide-react'
import Link from 'next/link'

interface APIKey {
  id: string
  name: string
  key: string
  created_at: string
  last_used: string | null
}

export default function APIKeysPage() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      id: '1',
      name: 'Production Key',
      key: 'sk_live_1234567890abcdef',
      created_at: new Date().toISOString(),
      last_used: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Development Key',
      key: 'sk_test_abcdef1234567890',
      created_at: new Date().toISOString(),
      last_used: null,
    },
  ])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return

    const newKey: APIKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `sk_live_${Math.random().toString(36).substring(2, 18)}`,
      created_at: new Date().toISOString(),
      last_used: null,
    }

    setApiKeys([...apiKeys, newKey])
    setNewlyCreatedKey(newKey.key)
    setNewKeyName('')
    setShowCreateModal(false)
  }

  const handleDeleteKey = (id: string) => {
    if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      setApiKeys(apiKeys.filter(key => key.id !== id))
    }
  }

  const toggleKeyVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(id)) {
      newVisible.delete(id)
    } else {
      newVisible.add(id)
    }
    setVisibleKeys(newVisible)
  }

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const maskKey = (key: string) => {
    if (key.length < 12) return key
    return key.substring(0, 8) + '•'.repeat(key.length - 12) + key.substring(key.length - 4)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
            <p className="text-gray-600 mt-1">Manage API keys for programmatic access</p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="h-5 w-5" />
          Create API Key
        </button>
      </div>

      {/* Newly Created Key Alert */}
      {newlyCreatedKey && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Key className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">API Key Created Successfully</h3>
              <p className="text-sm text-blue-700 mt-1">
                Make sure to copy your API key now. You will not be able to see it again!
              </p>
              <div className="mt-3 flex items-center gap-2 bg-white border border-blue-300 rounded-lg p-3">
                <code className="flex-1 text-sm font-mono text-gray-900">{newlyCreatedKey}</code>
                <button
                  onClick={() => copyToClipboard(newlyCreatedKey)}
                  className="p-2 hover:bg-blue-50 rounded transition-colors"
                  aria-label="Copy API key"
                >
                  {copiedKey === newlyCreatedKey ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              </div>
              <button
                onClick={() => setNewlyCreatedKey(null)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                I have saved my API key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {apiKeys.length === 0 ? (
          <div className="p-12 text-center">
            <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No API keys yet</h3>
            <p className="text-gray-600 mb-4">Create your first API key to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="h-5 w-5" />
              Create API Key
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{apiKey.name}</h3>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <code className="text-sm font-mono text-gray-700 bg-gray-100 px-3 py-1.5 rounded">
                        {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                      </code>
                      <button
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                        aria-label={visibleKeys.has(apiKey.id) ? 'Hide key' : 'Show key'}
                      >
                        {visibleKeys.has(apiKey.id) ? (
                          <EyeOff className="h-4 w-4 text-gray-600" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-600" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(apiKey.key)}
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                        aria-label="Copy API key"
                      >
                        {copiedKey === apiKey.key ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-600" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Created {new Date(apiKey.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>
                        {apiKey.last_used
                          ? `Last used ${new Date(apiKey.last_used).toLocaleDateString()}`
                          : 'Never used'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteKey(apiKey.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Delete API key"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Documentation */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Code className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">API Documentation</h2>
        </div>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Authentication</h3>
            <p className="text-gray-600 mb-2">Include your API key in the Authorization header:</p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`curl https://api.mydistinctai.com/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "your-model-id",
    "message": "Hello, AI!"
  }'`}
            </pre>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Base URL</h3>
            <code className="text-gray-700 bg-gray-100 px-2 py-1 rounded">
              https://api.mydistinctai.com/v1
            </code>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Rate Limits</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Free tier: 100 requests per day</li>
              <li>Pro tier: 10,000 requests per day</li>
              <li>Enterprise: Custom limits</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Create API Key</h2>
              <p className="text-sm text-gray-600 mt-1">Give your API key a descriptive name</p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Name
              </label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production Key"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewKeyName('')
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKey}
                disabled={!newKeyName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
