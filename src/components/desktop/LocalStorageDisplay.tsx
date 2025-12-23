'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  HardDrive,
  Database,
  FileText,
  Trash2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'

interface StorageInfo {
  totalUsed: number // in bytes
  models: number
  documents: number
  embeddings: number
  cacheSize: number
  lastUpdated: Date
}

export function LocalStorageDisplay() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    totalUsed: 0,
    models: 0,
    documents: 0,
    embeddings: 0,
    cacheSize: 0,
    lastUpdated: new Date()
  })
  const [isLoading, setIsLoading] = useState(false)
  const [maxStorage] = useState(10 * 1024 * 1024 * 1024) // 10GB limit

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const usagePercentage = (storageInfo.totalUsed / maxStorage) * 100
  const isNearLimit = usagePercentage > 80

  const refreshStorage = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement actual Tauri command to get storage info
      // const info = await invoke('get_storage_info')
      // setStorageInfo(info)

      // Mock data for now
      setTimeout(() => {
        setStorageInfo({
          totalUsed: 3.2 * 1024 * 1024 * 1024, // 3.2GB
          models: 5,
          documents: 127,
          embeddings: 45000,
          cacheSize: 256 * 1024 * 1024, // 256MB
          lastUpdated: new Date()
        })
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to refresh storage:', error)
      setIsLoading(false)
    }
  }

  const clearCache = async () => {
    if (!confirm('Clear all cached data? This will not affect your models or documents.')) {
      return
    }

    try {
      // TODO: Implement actual Tauri command to clear cache
      // await invoke('clear_cache')
      await refreshStorage()
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  useEffect(() => {
    refreshStorage()
  }, [])

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <HardDrive className="h-6 w-6 text-blue-500" />
          <div>
            <h3 className="font-semibold text-lg">Local Storage</h3>
            <p className="text-sm text-gray-600">
              Data stored on your device
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshStorage}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Overall Usage */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Total Usage
          </span>
          <span className="text-sm text-gray-600">
            {formatBytes(storageInfo.totalUsed)} / {formatBytes(maxStorage)}
          </span>
        </div>
        <Progress
          value={usagePercentage}
          className={`h-2 ${isNearLimit ? 'bg-red-100' : ''}`}
        />
        {isNearLimit && (
          <div className="flex items-center space-x-2 mt-2 text-yellow-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs">
              Storage is running low. Consider cleaning up unused data.
            </span>
          </div>
        )}
      </div>

      {/* Storage Breakdown */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-medium text-gray-700">Storage Breakdown</h4>

        {/* Models */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Database className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium">AI Models</p>
              <p className="text-xs text-gray-600">{storageInfo.models} models</p>
            </div>
          </div>
          <span className="text-sm font-medium">
            {formatBytes(storageInfo.totalUsed * 0.4)}
          </span>
        </div>

        {/* Documents */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Documents</p>
              <p className="text-xs text-gray-600">{storageInfo.documents} files</p>
            </div>
          </div>
          <span className="text-sm font-medium">
            {formatBytes(storageInfo.totalUsed * 0.3)}
          </span>
        </div>

        {/* Embeddings */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Database className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Vector Embeddings</p>
              <p className="text-xs text-gray-600">
                {storageInfo.embeddings.toLocaleString()} vectors
              </p>
            </div>
          </div>
          <span className="text-sm font-medium">
            {formatBytes(storageInfo.totalUsed * 0.25)}
          </span>
        </div>

        {/* Cache */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <HardDrive className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Cache</p>
              <p className="text-xs text-gray-600">Temporary data</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {formatBytes(storageInfo.cacheSize)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCache}
              className="h-7 px-2"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-xs text-gray-500 text-center">
        Last updated: {storageInfo.lastUpdated.toLocaleTimeString()}
      </div>

      {/* Storage Location Info */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Storage Location:</strong> All data is stored locally on your device.
          Your files and models are encrypted and never leave your computer.
        </p>
      </div>
    </Card>
  )
}
