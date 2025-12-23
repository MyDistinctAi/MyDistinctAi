/**
 * Chat Page
 *
 * Main chat interface for talking to AI models
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { CHAT_QUERY_STEPS, type ProgressStep } from '@/components/ProgressSteps'
import type { ChatMessage, ChatSession, Model } from '@/types/chat'

// Dynamic imports for code splitting and faster initial load
const ChatSidebar = dynamic(() => import('@/components/chat/ChatSidebar'), {
  loading: () => <div className="w-64 bg-gray-50 border-r animate-pulse" />
})
const ChatMessages = dynamic(() => import('@/components/chat/ChatMessages'), {
  loading: () => <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
})
const ChatInput = dynamic(() => import('@/components/chat/ChatInput'))
const DocumentListCompact = dynamic(() => import('@/components/DocumentList').then(mod => ({ default: mod.DocumentListCompact })), {
  loading: () => <div className="animate-pulse h-20 bg-gray-100 rounded" />
})
const ProgressSteps = dynamic(() => import('@/components/ProgressSteps').then(mod => ({ default: mod.ProgressSteps })))

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const modelId = params.modelId as string

  const [model, setModel] = useState<Model | null>(null)
  const [allModels, setAllModels] = useState<Model[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [querySteps, setQuerySteps] = useState<ProgressStep[]>([...CHAT_QUERY_STEPS])
  const [showModelSwitcher, setShowModelSwitcher] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [showSessionInfo, setShowSessionInfo] = useState(false)

  const modelSwitcherRef = useRef<HTMLDivElement>(null)
  const quickActionsRef = useRef<HTMLDivElement>(null)

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelSwitcherRef.current && !modelSwitcherRef.current.contains(event.target as Node)) {
        setShowModelSwitcher(false)
      }
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setShowQuickActions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load model data and documents
  useEffect(() => {
    const loadModel = async () => {
      try {
        // Fetch model from API
        const response = await fetch(`/api/models/${modelId}`)
        if (!response.ok) {
          // If 401 (Unauthorized), use a mock model for local/desktop mode
          if (response.status === 401) {
            console.log('Using local mode - no authentication')
            setModel({
              id: modelId,
              name: modelId,
              description: 'Local model',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as Model)
            return
          }
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('Model load failed:', response.status, errorData)
          throw new Error(`Failed to load model: ${response.status} - ${errorData.error || 'Unknown error'}`)
        }
        const modelData = await response.json()
        setModel(modelData)

        // Fetch processed documents for this model
        const docsResponse = await fetch(`/api/training/data?modelId=${modelId}&status=processed`)
        if (docsResponse.ok) {
          const docsData = await docsResponse.json()
          setDocuments(docsData || [])
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load model'
        setError(errorMessage)
        console.error('Model load error:', err)
      }
    }

    loadModel()
  }, [modelId])

  // Load all models for switcher
  useEffect(() => {
    const loadAllModels = async () => {
      try {
        const response = await fetch('/api/models')
        if (response.ok) {
          const models = await response.json()
          setAllModels(models)
        }
      } catch (err) {
        console.error('Failed to load models:', err)
      }
    }
    loadAllModels()
  }, [])

  // Load chat sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        // Fetch conversations using new API
        const response = await fetch(`/api/conversations?modelId=${modelId}`)
        if (!response.ok) {
          // If 401, create a local session without API
          if (response.status === 401) {
            console.log('Using local session - no authentication')
            const localSession: ChatSession = {
              id: 'local-session',
              user_id: 'local-user',
              model_id: modelId,
              title: 'Local Chat',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            setSessions([localSession])
            setActiveSession(localSession)
            return
          }
          throw new Error('Failed to load conversations')
        }
        const data = await response.json()

        // If no conversations exist, create a new one
        if (!data.conversations || data.conversations.length === 0) {
          const createResponse = await fetch('/api/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              modelId,
              title: 'New Chat',
            }),
          })

          if (createResponse.ok) {
            const newSession = await createResponse.json()
            setSessions([newSession])
            setActiveSession(newSession)
          }
        } else {
          setSessions(data.conversations)
          setActiveSession(data.conversations[0])
        }
      } catch (err) {
        console.error('Failed to load conversations:', err)
      }
    }

    loadSessions()
  }, [modelId])

  // Load messages for active session
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeSession) return

      try {
        // Fetch messages from API
        const response = await fetch(`/api/chat/messages?sessionId=${activeSession.id}`)
        if (response.ok) {
          const messagesData = await response.json()
          setMessages(messagesData || [])
        }
      } catch (err) {
        console.error('Failed to load messages:', err)
        setMessages([])
      }
    }

    loadMessages()
  }, [activeSession])

  const handleSendMessage = async (content: string) => {
    if (!activeSession) return

    setIsLoading(true)
    setError(null)

    // Reset progress steps
    setQuerySteps([
      { ...CHAT_QUERY_STEPS[0], status: 'in_progress' },
      { ...CHAT_QUERY_STEPS[1], status: 'pending' },
      { ...CHAT_QUERY_STEPS[2], status: 'pending' },
    ])

    try {
      // Create user message optimistically
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        session_id: activeSession.id,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMessage])

      // Create AI message placeholder
      const aiMessageId = `msg-${Date.now() + 1}`
      const aiMessage: ChatMessage = {
        id: aiMessageId,
        session_id: activeSession.id,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, aiMessage])

      // Call chat API with streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // NOTE: Do NOT send 'x-desktop-app' header from web app
          // Only Tauri desktop app should send this header
        },
        body: JSON.stringify({
          message: content,
          sessionId: activeSession.id,
          modelId: modelId,
          useRAG: true,
        }),
      })

      // Step 1 complete: Searching documents
      setQuerySteps((prev) => [
        { ...prev[0], status: 'completed' },
        { ...prev[1], status: 'in_progress' },
        { ...prev[2], status: 'pending' },
      ])

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to send message' }))
        throw new Error(error.error || 'AI service unavailable')
      }

      // Step 2 complete: Finding relevant context
      setQuerySteps((prev) => [
        { ...prev[0], status: 'completed' },
        { ...prev[1], status: 'completed' },
        { ...prev[2], status: 'in_progress' },
      ])

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let accumulatedContent = ''
      let hasStartedGenerating = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim() !== '')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              // Handle both 'token' (Ollama) and 'content' (OpenRouter) formats
              const contentChunk = data.token || data.content

              if (contentChunk) {
                // Step 3: Generating response (on first content chunk)
                if (!hasStartedGenerating) {
                  setQuerySteps((prev) => [
                    { ...prev[0], status: 'completed' },
                    { ...prev[1], status: 'completed' },
                    { ...prev[2], status: 'in_progress' },
                  ])
                  hasStartedGenerating = true
                }

                accumulatedContent += contentChunk

                // Update AI message with accumulated content
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  )
                )
              }

              if (data.done) {
                // All steps complete
                setQuerySteps((prev) => [
                  { ...prev[0], status: 'completed' },
                  { ...prev[1], status: 'completed' },
                  { ...prev[2], status: 'completed' },
                ])
                setIsLoading(false)
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError)
            }
          }
        }
      }

      setIsLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      setIsLoading(false)
      console.error(err)
    }
  }

  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId)
    if (session) {
      setActiveSession(session)
    }
  }

  const handleNewChat = async () => {
    try {
      // Create new conversation via API
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          title: 'New Chat',
        }),
      })

      if (response.ok) {
        const newSession = await response.json()
        setSessions((prev) => [newSession, ...prev])
        setActiveSession(newSession)
        setMessages([])
      } else {
        console.error('Failed to create new conversation')
      }
    } catch (err) {
      console.error('Error creating new conversation:', err)
    }
  }

  const handleRenameChat = async (sessionId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/conversations/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      })

      if (response.ok) {
        const updated = await response.json()
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle } : s))
        )
        if (activeSession?.id === sessionId) {
          setActiveSession((prev) => prev ? { ...prev, title: newTitle } : null)
        }
      } else {
        console.error('Failed to rename conversation')
      }
    } catch (err) {
      console.error('Error renaming conversation:', err)
    }
  }

  const handleDeleteChat = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/conversations/${sessionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId))

        // If deleted session was active, switch to another
        if (activeSession?.id === sessionId) {
          const remainingSessions = sessions.filter((s) => s.id !== sessionId)
          if (remainingSessions.length > 0) {
            setActiveSession(remainingSessions[0])
          } else {
            // Create a new conversation if none left
            handleNewChat()
          }
        }
      } else {
        console.error('Failed to delete conversation')
      }
    } catch (err) {
      console.error('Error deleting conversation:', err)
    }
  }

  const handleRegenerateResponse = async (messageId: string) => {
    // Find the user message before this AI message
    const messageIndex = messages.findIndex((m) => m.id === messageId)
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1]
      if (userMessage.role === 'user') {
        // Remove the AI message and regenerate
        setMessages((prev) => prev.slice(0, messageIndex))
        await handleSendMessage(userMessage.content)
      }
    }
  }

  const handleExportChat = async (sessionId: string, format: 'pdf' | 'txt' | 'json' | 'md') => {
    try {
      // Trigger export via API
      const response = await fetch(`/api/conversations/${sessionId}/export?format=${format}`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `conversation-${sessionId}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Failed to export conversation')
      }
    } catch (err) {
      console.error('Error exporting conversation:', err)
    }
  }

  const handleSwitchModel = (newModelId: string) => {
    setShowModelSwitcher(false)
    router.push(`/dashboard/chat/${newModelId}`)
  }

  const handleClearMessages = () => {
    if (confirm('Clear all messages in this conversation? This cannot be undone.')) {
      setMessages([])
      setShowQuickActions(false)
    }
  }

  const handleViewModelDetails = () => {
    setShowQuickActions(false)
    router.push(`/dashboard/models`)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  if (!model) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSession?.id}
        modelName={model.name}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onExportChat={handleExportChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeSession ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {activeSession.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {/* Model Switcher Button */}
                    <div className="relative" ref={modelSwitcherRef}>
                      <button
                        onClick={() => setShowModelSwitcher(!showModelSwitcher)}
                        className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        Chat with {model.name}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Model Switcher Dropdown */}
                      {showModelSwitcher && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[250px] max-h-[400px] overflow-y-auto">
                          <div className="p-2 border-b border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 px-2">SWITCH TO MODEL</p>
                          </div>
                          {allModels.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => handleSwitchModel(m.id)}
                              className={`w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors ${m.id === modelId ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                            >
                              <div className="font-medium text-sm">{m.name}</div>
                              {m.base_model && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {m.base_model.includes('google/') ? '🤖 Gemini Flash' :
                                    m.base_model.includes('meta-llama/') ? '🦙 Llama 3.3' :
                                      m.base_model.includes('qwen/') ? '🔮 Qwen 2.5' :
                                        m.base_model}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {model.base_model && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                          {model.base_model.includes('google/') ? '🤖 Gemini Flash' :
                            model.base_model.includes('meta-llama/') ? '🦙 Llama 3.3' :
                              model.base_model.includes('qwen/') ? '🔮 Qwen 2.5' :
                                model.base_model}
                        </span>
                      </>
                    )}
                    {/* Document List */}
                    {documents.length > 0 && (
                      <>
                        <span className="text-gray-300">•</span>
                        <DocumentListCompact documents={documents.map(doc => ({
                          id: doc.id,
                          fileName: doc.file_name,
                          fileType: doc.file_type,
                          status: doc.status
                        }))} />
                      </>
                    )}
                  </div>
                </div>

                {/* Quick Actions Menu */}
                <div className="relative ml-4" ref={quickActionsRef}>
                  <button
                    onClick={() => setShowQuickActions(!showQuickActions)}
                    className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Quick Actions"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>

                  {/* Quick Actions Dropdown */}
                  {showQuickActions && (
                    <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
                      <button
                        onClick={() => setShowSessionInfo(!showSessionInfo)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Session Info
                      </button>
                      <button
                        onClick={handleClearMessages}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm text-orange-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Clear Messages
                      </button>
                      <button
                        onClick={handleViewModelDetails}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm border-t border-gray-100"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        View Model Settings
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Session Info Panel */}
              {showSessionInfo && activeSession && (
                <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Session Information</h3>
                    <button
                      onClick={() => setShowSessionInfo(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Messages</p>
                      <p className="font-semibold text-gray-900">{messages.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Documents</p>
                      <p className="font-semibold text-gray-900">{documents.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Created</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(activeSession.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Last Updated</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(activeSession.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Steps (shown while loading) */}
              {isLoading && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <ProgressSteps steps={querySteps} compact={true} showPercentages={false} />
                </div>
              )}
            </div>

            {/* Messages */}
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              onRegenerateResponse={handleRegenerateResponse}
            />

            {/* Input */}
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              placeholder={`Ask ${model.name} anything...`}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No chat selected
              </h2>
              <p className="text-gray-600 mb-4">
                Create a new chat to get started
              </p>
              <button
                onClick={handleNewChat}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                New Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
