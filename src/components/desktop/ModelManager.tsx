'use client'

import { useState, useEffect } from 'react'
import { useOllama } from '@/hooks/useTauri'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Brain, Download, Trash2, Loader2, AlertCircle } from 'lucide-react'

export function ModelManager() {
  const { isTauri, listModels, pullModel } = useOllama()
  const [models, setModels] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [pulling, setPulling] = useState<string | null>(null)
  const [newModel, setNewModel] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isTauri) {
      loadModels()
    }
  }, [isTauri])

  const loadModels = async () => {
    setLoading(true)
    setError(null)
    try {
      const modelList = await listModels()
      setModels(modelList)
    } catch (err: any) {
      setError(err.toString())
    } finally {
      setLoading(false)
    }
  }

  const handlePullModel = async () => {
    if (!newModel.trim()) return

    setPulling(newModel)
    setError(null)
    try {
      await pullModel(newModel)
      await loadModels()
      setNewModel('')
    } catch (err: any) {
      setError(`Failed to pull model: ${err.toString()}`)
    } finally {
      setPulling(null)
    }
  }

  if (!isTauri) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>Model management is only available in the desktop app.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold">Local AI Models</h3>
            <p className="text-sm text-gray-600">
              Manage Ollama models on your device
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadModels} disabled={loading}>
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

      {/* Pull New Model */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Pull New Model
        </label>
        <div className="flex space-x-2">
          <Input
            placeholder="e.g., mistral:7b, llama2:latest"
            value={newModel}
            onChange={(e) => setNewModel(e.target.value)}
            disabled={!!pulling}
          />
          <Button
            onClick={handlePullModel}
            disabled={!newModel.trim() || !!pulling}
          >
            {pulling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Pulling...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Pull
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Popular models: mistral:7b, llama2:7b, codellama:latest
        </p>
      </div>

      {/* Model List */}
      <div>
        <h4 className="text-sm font-medium mb-3">
          Installed Models ({models.length})
        </h4>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : models.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No models installed</p>
            <p className="text-sm">Pull a model to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {models.map((model) => (
              <div
                key={model}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <Brain className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{model}</p>
                    <p className="text-xs text-gray-500">
                      Ready to use
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
