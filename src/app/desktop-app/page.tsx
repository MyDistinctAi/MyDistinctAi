'use client'

import { useState, useEffect } from 'react'

// Declare Tauri types
declare global {
  interface Window {
    __TAURI__?: {
      core: {
        invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>
      }
    }
  }
}

export default function DesktopAppPage() {
  const [isTauri, setIsTauri] = useState(false)
  const [ollamaStatus, setOllamaStatus] = useState<string>('Checking...')
  const [models, setModels] = useState<string[]>([])

  useEffect(() => {
    // Check if running in Tauri
    setIsTauri(typeof window !== 'undefined' && window.__TAURI__ !== undefined)

    if (window.__TAURI__) {
      checkOllamaStatus()
    }
  }, [])

  const checkOllamaStatus = async () => {
    try {
      const result = await window.__TAURI__!.core.invoke('check_ollama_status') as { status: string }
      setOllamaStatus(result.status)

      if (result.status === 'running') {
        listModels()
      }
    } catch (error) {
      setOllamaStatus('Error: ' + (error as Error).message)
    }
  }

  const listModels = async () => {
    try {
      const result = await window.__TAURI__!.core.invoke('list_ollama_models') as { models: { name: string }[] }
      setModels(result.models.map(m => m.name))
    } catch (error) {
      console.error('Error listing models:', error)
    }
  }

  if (!isTauri) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Desktop App (Web Preview)
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            This is the desktop app interface. To run it as a true offline desktop app:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6">
            <li>Build the desktop app: <code className="bg-gray-100 px-2 py-1 rounded">npm run tauri:build</code></li>
            <li>Run the .exe file from: <code className="bg-gray-100 px-2 py-1 rounded">src-tauri/target/release/mydistinctai.exe</code></li>
            <li>The desktop app will work completely offline with Ollama</li>
          </ol>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> The web app (on Vercel) is separate and uses cloud AI.
              The desktop app uses local Ollama for complete privacy and offline operation.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            MyDistinctAI Desktop
          </h1>
          <p className="text-xl text-gray-300">
            Your Private AI Studio - Completely Offline
          </p>
        </div>

        {/* Ollama Status Card */}
        <div className="bg-slate-800 rounded-lg shadow-xl p-6 mb-6 border border-slate-700">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <span className="mr-2">🤖</span>
            Ollama Status
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Connection:</span>
            <span className={`font-mono px-3 py-1 rounded ${
              ollamaStatus === 'running'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {ollamaStatus}
            </span>
          </div>
        </div>

        {/* Models Card */}
        {models.length > 0 && (
          <div className="bg-slate-800 rounded-lg shadow-xl p-6 mb-6 border border-slate-700">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <span className="mr-2">📦</span>
              Available Models ({models.length})
            </h2>
            <ul className="space-y-2">
              {models.map((model, index) => (
                <li
                  key={index}
                  className="bg-slate-700/50 px-4 py-3 rounded flex items-center"
                >
                  <span className="mr-3 text-blue-400">●</span>
                  <span className="font-mono text-sm">{model}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Features Card */}
        <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <span className="mr-2">✨</span>
            Desktop Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-700/50 p-4 rounded">
              <h3 className="font-semibold text-blue-400 mb-2">🔒 100% Offline</h3>
              <p className="text-sm text-gray-300">All processing happens on your device. No internet required.</p>
            </div>
            <div className="bg-slate-700/50 p-4 rounded">
              <h3 className="font-semibold text-green-400 mb-2">🔐 Encrypted</h3>
              <p className="text-sm text-gray-300">AES-256-GCM encryption for all your data.</p>
            </div>
            <div className="bg-slate-700/50 p-4 rounded">
              <h3 className="font-semibold text-purple-400 mb-2">🧠 Local AI</h3>
              <p className="text-sm text-gray-300">Powered by Ollama running on your machine.</p>
            </div>
            <div className="bg-slate-700/50 p-4 rounded">
              <h3 className="font-semibold text-yellow-400 mb-2">📁 File Processing</h3>
              <p className="text-sm text-gray-300">PDF, DOCX, TXT extraction and RAG.</p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        {ollamaStatus !== 'running' && (
          <div className="mt-6 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">
              Ollama Not Running
            </h3>
            <p className="text-sm text-gray-300 mb-3">
              To use the desktop app, you need to start Ollama:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
              <li>Install Ollama from <a href="https://ollama.ai" className="text-blue-400 underline" target="_blank" rel="noopener noreferrer">ollama.ai</a></li>
              <li>Run: <code className="bg-slate-700 px-2 py-1 rounded">ollama serve</code></li>
              <li>Pull a model: <code className="bg-slate-700 px-2 py-1 rounded">ollama pull mistral</code></li>
              <li>Restart this app</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
