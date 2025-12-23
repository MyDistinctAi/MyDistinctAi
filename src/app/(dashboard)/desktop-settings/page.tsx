'use client'

/**
 * Desktop Settings Page
 *
 * Settings specific to the desktop app:
 * - Ollama configuration
 * - Local storage management
 * - Security settings
 * - Auto-update preferences
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Settings,
  Database,
  Shield,
  Cpu,
  HardDrive,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Download,
  ArrowLeft
} from 'lucide-react'
import { useIsTauri } from '@/hooks/useTauri'

export default function DesktopSettingsPage() {
  const router = useRouter()
  const isTauri = useIsTauri()
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434')
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [autoUpdate, setAutoUpdate] = useState(true)
  const [startOnBoot, setStartOnBoot] = useState(false)
  const [encryptionEnabled, setEncryptionEnabled] = useState(true)
  const [chunkSize, setChunkSize] = useState(512)
  const [overlap, setOverlap] = useState(50)
  const [isSaving, setIsSaving] = useState(false)

  // Check Ollama status on mount
  useEffect(() => {
    if (isTauri) {
      checkOllamaStatus()
    }
  }, [isTauri])

  const checkOllamaStatus = async () => {
    setOllamaStatus('checking')
    try {
      const response = await fetch(`${ollamaUrl}/api/tags`)
      if (response.ok) {
        setOllamaStatus('online')
      } else {
        setOllamaStatus('offline')
      }
    } catch (error) {
      setOllamaStatus('offline')
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save settings to local storage
      const settings = {
        ollamaUrl,
        autoUpdate,
        startOnBoot,
        encryptionEnabled,
        chunkSize,
        overlap,
      }

      if (isTauri) {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('save_user_data', {
          key: 'desktop_settings',
          data: JSON.stringify(settings),
        })
      } else {
        localStorage.setItem('desktop_settings', JSON.stringify(settings))
      }

      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        let settingsData: string | null = null

        if (isTauri) {
          try {
            const { invoke } = await import('@tauri-apps/api/core')
            settingsData = await invoke<string>('load_user_data', {
              key: 'desktop_settings',
            })
          } catch (tauriError: any) {
            // Settings don't exist yet (first run) - use defaults
            console.log('Desktop settings not found, using defaults')
            settingsData = null
          }
        } else {
          settingsData = localStorage.getItem('desktop_settings')
        }

        if (settingsData) {
          const settings = JSON.parse(settingsData)
          setOllamaUrl(settings.ollamaUrl || 'http://localhost:11434')
          setAutoUpdate(settings.autoUpdate ?? true)
          setStartOnBoot(settings.startOnBoot ?? false)
          setEncryptionEnabled(settings.encryptionEnabled ?? true)
          setChunkSize(settings.chunkSize || 512)
          setOverlap(settings.overlap || 50)
        }
        // If no settings exist (first run), defaults are already set in useState
      } catch (error) {
        console.log('Settings load error (first run):', error)
        // Use default values - already set in useState
      }
    }

    loadSettings()
  }, [isTauri])

  // If not in desktop app, show placeholder
  if (!isTauri) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Card className="p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertCircle className="h-16 w-16 text-yellow-500" />
            <h1 className="text-2xl font-bold">Desktop App Only</h1>
            <p className="text-gray-600">
              This page is only available in the MyDistinctAI desktop application.
              Desktop settings allow you to configure local AI processing, file storage,
              and security options.
            </p>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg w-full">
              <h3 className="font-semibold text-blue-900 mb-2">Download Desktop App</h3>
              <p className="text-sm text-blue-800 mb-4">
                Get the full MyDistinctAI experience with local AI processing,
                offline capabilities, and complete privacy.
              </p>
              <Button disabled className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Back Navigation */}
      <div className="mb-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Desktop Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Configure your local AI environment and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Ollama Configuration */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Cpu className="h-5 w-5" />
            Ollama Configuration
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="ollamaUrl">Ollama Server URL</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="ollamaUrl"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                />
                <Button onClick={checkOllamaStatus} variant="outline">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {ollamaStatus === 'checking' && (
                  <span className="text-sm text-gray-500">Checking...</span>
                )}
                {ollamaStatus === 'online' && (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Connected</span>
                  </>
                )}
                {ollamaStatus === 'offline' && (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">Not connected</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* General Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5" />
            General
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-update</Label>
                <p className="text-sm text-gray-500">Automatically download and install updates</p>
              </div>
              <Switch checked={autoUpdate} onCheckedChange={setAutoUpdate} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Start on boot</Label>
                <p className="text-sm text-gray-500">Launch MyDistinctAI when system starts</p>
              </div>
              <Switch checked={startOnBoot} onCheckedChange={setStartOnBoot} />
            </div>
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5" />
            Security
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable encryption</Label>
                <p className="text-sm text-gray-500">Encrypt document chunks with AES-256-GCM</p>
              </div>
              <Switch checked={encryptionEnabled} onCheckedChange={setEncryptionEnabled} />
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Privacy Guarantee</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• All data stays on your device</li>
                <li>• No cloud uploads or tracking</li>
                <li>• GDPR & HIPAA compliant</li>
                <li>• AES-256 encryption at rest</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Advanced Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Database className="h-5 w-5" />
            Advanced
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="chunkSize">Chunk Size (tokens)</Label>
              <Input
                id="chunkSize"
                type="number"
                value={chunkSize}
                onChange={(e) => setChunkSize(parseInt(e.target.value))}
                min={128}
                max={2048}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Smaller = better precision, Larger = more context
              </p>
            </div>

            <div>
              <Label htmlFor="overlap">Chunk Overlap (tokens)</Label>
              <Input
                id="overlap"
                type="number"
                value={overlap}
                onChange={(e) => setOverlap(parseInt(e.target.value))}
                min={0}
                max={512}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Overlap between consecutive chunks for better context
              </p>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}
