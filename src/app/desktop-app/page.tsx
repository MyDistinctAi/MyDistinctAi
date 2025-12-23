'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut, MessageSquare, Upload, Database, Settings } from 'lucide-react'
import { clearCredentials, loadSession } from '@/lib/offline-auth'

export default function DesktopAppPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await loadSession()

        if (!session) {
          // No session - redirect to login
          router.push('/desktop-app/login')
          return
        }

        setUserEmail(session.email)
        setIsLoading(false)
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/desktop-app/login')
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    await clearCredentials()
    router.push('/desktop-app/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src="/images/logo.jpg"
            alt="MyDistinctAI Logo"
            className="w-14 h-14 rounded-xl object-cover"
          />
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">MyDistinctAI</h1>
            <p className="text-slate-400">Offline AI Studio • {userEmail}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Quick Access Cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Chat Card */}
        <button
          onClick={() => router.push('/dashboard/chat/select')}
          className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-2xl p-6 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
            <MessageSquare className="w-6 h-6 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Chat</h3>
          <p className="text-sm text-slate-400">Chat with your AI models</p>
        </button>

        {/* Upload Card */}
        <button
          onClick={() => router.push('/dashboard/data')}
          className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-2xl p-6 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
            <Upload className="w-6 h-6 text-purple-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Upload Files</h3>
          <p className="text-sm text-slate-400">Train your AI with documents</p>
        </button>

        {/* Models Card */}
        <button
          onClick={() => router.push('/dashboard/models')}
          className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-2xl p-6 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-green-500/10 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
            <Database className="w-6 h-6 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Models</h3>
          <p className="text-sm text-slate-400">Manage your AI models</p>
        </button>

        {/* Settings Card */}
        <button
          onClick={() => router.push('/dashboard/settings')}
          className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-2xl p-6 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/10 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
            <Settings className="w-6 h-6 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Settings</h3>
          <p className="text-sm text-slate-400">Configure your workspace</p>
        </button>
      </div>

      {/* Status Bar */}
      <div className="max-w-6xl mx-auto mt-8 bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Ollama Connected
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">All systems operational</span>
          </div>
          <span className="text-slate-500">Offline Mode • All data stays local</span>
        </div>
      </div>
    </div>
  )
}
