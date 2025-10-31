'use client'

import { useState, useEffect } from 'react'
import { useLocalStorage } from '@/hooks/useTauri'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, Trash2, Eye, EyeOff, Loader2, AlertCircle, Copy, Check } from 'lucide-react'

export function StorageManager() {
  const { isTauri, listKeys, load, remove } = useLocalStorage()
  const [keys, setKeys] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [keyData, setKeyData] = useState<Record<string, any>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isTauri) {
      loadKeys()
    }
  }, [isTauri])

  const loadKeys = async () => {
    setLoading(true)
    setError(null)
    try {
      const keyList = await listKeys()
      setKeys(keyList)
    } catch (err: any) {
      setError(err.toString())
    } finally {
      setLoading(false)
    }
  }

  const toggleKey = async (key: string) => {
    if (expandedKey === key) {
      setExpandedKey(null)
      return
    }

    setExpandedKey(key)
    if (!keyData[key]) {
      try {
        const data = await load(key)
        setKeyData((prev) => ({ ...prev, [key]: data }))
      } catch (err: any) {
        setError(`Failed to load ${key}: ${err.toString()}`)
      }
    }
  }

  const handleDelete = async (key: string) => {
    if (!confirm(`Are you sure you want to delete "${key}"?`)) return

    try {
      await remove(key)
      setKeys((prev) => prev.filter((k) => k !== key))
      setKeyData((prev) => {
        const newData = { ...prev }
        delete newData[key]
        return newData
      })
      if (expandedKey === key) setExpandedKey(null)
    } catch (err: any) {
      setError(`Failed to delete ${key}: ${err.toString()}`)
    }
  }

  const copyToClipboard = async (key: string, data: any) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (!isTauri) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>Storage management is only available in the desktop app.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Database className="h-6 w-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold">Local Storage</h3>
            <p className="text-sm text-gray-600">
              View and manage local data on your device
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadKeys} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Refresh'
          )}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Storage Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-600 font-medium">Total Keys</p>
          <p className="text-2xl font-bold text-purple-700">{keys.length}</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Storage Used</p>
          <p className="text-2xl font-bold text-blue-700">
            {formatBytes(JSON.stringify(keyData).length)}
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-600 font-medium">Encrypted</p>
          <p className="text-2xl font-bold text-green-700">Yes</p>
        </div>
      </div>

      {/* Key List */}
      <div>
        <h4 className="text-sm font-medium mb-3">
          Stored Data ({keys.length} items)
        </h4>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No data stored locally</p>
            <p className="text-sm">Data will appear here when saved</p>
          </div>
        ) : (
          <div className="space-y-2">
            {keys.map((key) => (
              <div key={key} className="border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-gray-50">
                  <div className="flex items-center space-x-3 flex-1">
                    <Database className="h-5 w-5 text-purple-600" />
                    <div className="flex-1">
                      <p className="font-medium">{key}</p>
                      {keyData[key] && (
                        <p className="text-xs text-gray-500">
                          {formatBytes(JSON.stringify(keyData[key]).length)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {keyData[key] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(key, keyData[key])}
                      >
                        {copiedKey === key ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleKey(key)}
                    >
                      {expandedKey === key ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(key)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {expandedKey === key && keyData[key] && (
                  <div className="p-3 bg-white border-t">
                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto max-h-64 overflow-y-auto">
                      {JSON.stringify(keyData[key], null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
