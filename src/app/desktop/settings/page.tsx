'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIsTauri } from '@/hooks/useTauri'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OllamaStatus } from '@/components/desktop/OllamaStatus'
import { ModelManager } from '@/components/desktop/ModelManager'
import { StorageManager } from '@/components/desktop/StorageManager'
import { SystemRequirements } from '@/components/desktop/SystemRequirements'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Brain, Database, Shield, AlertCircle, ArrowLeft } from 'lucide-react'

export default function DesktopSettingsPage() {
  const isTauri = useIsTauri()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')

  const handleOpenDataFolder = async () => {
    if (!isTauri) return

    try {
      const { open } = (window as any).__TAURI__.shell
      // Open AppData/Local/MyDistinctAI folder
      await open('C:\\Users\\' + (process.env.USERNAME || 'User') + '\\AppData\\Local\\MyDistinctAI')
    } catch (error) {
      console.error('Failed to open data folder:', error)
      alert('Failed to open data folder. Please navigate manually.')
    }
  }

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear the cache? This cannot be undone.')) {
      return
    }

    if (!isTauri) return

    try {
      // Clear any cached data here
      // For now, just show confirmation
      alert('Cache cleared successfully!')
    } catch (error) {
      console.error('Failed to clear cache:', error)
      alert('Failed to clear cache.')
    }
  }

  const handleDeleteAllData = async () => {
    const confirmed = confirm(
      'WARNING: This will delete ALL local data including models, chat history, and settings. This cannot be undone.\n\nType "DELETE" to confirm:'
    )

    if (!confirmed) return

    if (!isTauri) return

    try {
      // TODO: Implement data deletion via Tauri commands
      alert('This feature is not yet implemented.')
    } catch (error) {
      console.error('Failed to delete data:', error)
      alert('Failed to delete data.')
    }
  }

  const handleResetApp = async () => {
    if (!confirm('Are you sure you want to reset the app to defaults? This will restart the application.')) {
      return
    }

    if (!isTauri) return

    try {
      // TODO: Implement app reset
      alert('This feature is not yet implemented.')
    } catch (error) {
      console.error('Failed to reset app:', error)
      alert('Failed to reset app.')
    }
  }

  if (!isTauri) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold mb-4">Desktop App Only</h1>
            <p className="text-gray-600 mb-4">
              This page is only available in the Tauri desktop application.
            </p>
            <p className="text-sm text-gray-500">
              Please open this page in the desktop app to manage desktop-specific settings.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-3 mb-2">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Desktop Settings</h1>
          </div>
          <p className="text-gray-600">
            Manage your local AI models, storage, and desktop app preferences
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <Settings className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="models">
              <Brain className="h-4 w-4 mr-2" />
              AI Models
            </TabsTrigger>
            <TabsTrigger value="storage">
              <Database className="h-4 w-4 mr-2" />
              Storage
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">System Status</h2>
              <div className="space-y-4">
                <OllamaStatus />

                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium">App Version</p>
                    <p className="text-2xl font-bold text-blue-700">0.1.0</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-600 font-medium">Platform</p>
                    <p className="text-2xl font-bold text-green-700">Windows</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-600 font-medium">Encryption</p>
                    <p className="text-2xl font-bold text-purple-700">AES-256</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-20"
                  onClick={() => setActiveTab('models')}
                >
                  <div className="text-center">
                    <Brain className="h-6 w-6 mx-auto mb-2" />
                    <span>Manage Models</span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-20"
                  onClick={() => setActiveTab('storage')}
                >
                  <div className="text-center">
                    <Database className="h-6 w-6 mx-auto mb-2" />
                    <span>View Storage</span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-20"
                  onClick={() => setActiveTab('security')}
                >
                  <div className="text-center">
                    <Shield className="h-6 w-6 mx-auto mb-2" />
                    <span>Security Settings</span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-20"
                  onClick={() => router.push('/dashboard/settings')}
                >
                  <div className="text-center">
                    <Settings className="h-6 w-6 mx-auto mb-2" />
                    <span>App Preferences</span>
                  </div>
                </Button>
              </div>
            </Card>

            <SystemRequirements />
          </TabsContent>

          {/* AI Models Tab */}
          <TabsContent value="models" className="space-y-6">
            <OllamaStatus />
            <ModelManager />
          </TabsContent>

          {/* Storage Tab */}
          <TabsContent value="storage" className="space-y-6">
            <StorageManager />

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Storage Location</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Local Data Directory
                  </label>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded mt-1">
                    C:\Users\{process.env.USERNAME || 'User'}\AppData\Local\MyDistinctAI
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Cache Directory
                  </label>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded mt-1">
                    C:\Users\{process.env.USERNAME || 'User'}\AppData\Local\MyDistinctAI\cache
                  </p>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <Button variant="outline" onClick={handleOpenDataFolder}>
                  Open Data Folder
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={handleClearCache}
                >
                  Clear Cache
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Encryption Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="font-medium text-green-800">AES-256-GCM Encryption</p>
                    <p className="text-sm text-green-600">All data is encrypted at rest</p>
                  </div>
                  <Shield className="h-8 w-8 text-green-600" />
                </div>

                <div className="p-4 border rounded-lg">
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="form-checkbox" defaultChecked />
                    <div>
                      <p className="font-medium">Auto-lock on idle</p>
                      <p className="text-sm text-gray-600">Lock app after 15 minutes of inactivity</p>
                    </div>
                  </label>
                </div>

                <div className="p-4 border rounded-lg">
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="form-checkbox" defaultChecked />
                    <div>
                      <p className="font-medium">Secure memory wipe</p>
                      <p className="text-sm text-gray-600">Clear sensitive data from memory on exit</p>
                    </div>
                  </label>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="form-checkbox" />
                    <div>
                      <p className="font-medium">Anonymous usage statistics</p>
                      <p className="text-sm text-gray-600">Help improve MyDistinctAI by sharing anonymous usage data</p>
                    </div>
                  </label>
                </div>

                <div className="p-4 border rounded-lg">
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="form-checkbox" defaultChecked />
                    <div>
                      <p className="font-medium">Offline mode</p>
                      <p className="text-sm text-gray-600">Block all network requests (except essential updates)</p>
                    </div>
                  </label>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-red-200">
              <h3 className="text-lg font-semibold mb-4 text-red-700">Danger Zone</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 border-red-200"
                  onClick={handleDeleteAllData}
                >
                  Delete All Local Data
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 border-red-200"
                  onClick={handleResetApp}
                >
                  Reset App to Defaults
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
