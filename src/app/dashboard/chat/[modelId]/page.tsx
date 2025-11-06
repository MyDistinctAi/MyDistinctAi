/**
 * Chat Page
 *
 * Main chat interface for talking to AI models
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ChatSidebar from '@/components/chat/ChatSidebar'
import ChatMessages from '@/components/chat/ChatMessages'
import ChatInput from '@/components/chat/ChatInput'
import type { ChatMessage, ChatSession, Model } from '@/types/chat'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const modelId = params.modelId as string

  const [model, setModel] = useState<Model | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load model data
  useEffect(() => {
    const loadModel = async () => {
      try {
        // Fetch model from API
        const response = await fetch(`/api/models/${modelId}`)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('Model load failed:', response.status, errorData)
          throw new Error(`Failed to load model: ${response.status} - ${errorData.error || 'Unknown error'}`)
        }
        const modelData = await response.json()
        setModel(modelData)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load model'
        setError(errorMessage)
        console.error('Model load error:', err)
      }
    }

    loadModel()
  }, [modelId])

  // Load chat sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        // Fetch sessions from API
        const response = await fetch(`/api/chat/sessions?modelId=${modelId}`)
        if (!response.ok) {
          throw new Error('Failed to load sessions')
        }
        const sessionsData = await response.json()

        // If no sessions exist, create a new one
        if (!sessionsData || sessionsData.length === 0) {
          const createResponse = await fetch('/api/chat/sessions', {
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
          setSessions(sessionsData)
          setActiveSession(sessionsData[0])
        }
      } catch (err) {
        console.error('Failed to load sessions:', err)
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
        },
        body: JSON.stringify({
          modelId: modelId,
          message: content,
          sessionId: activeSession.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim() !== '')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.content) {
                accumulatedContent += data.content

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
      // Create new session via API
      const response = await fetch('/api/chat/sessions', {
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
        console.error('Failed to create new session')
      }
    } catch (err) {
      console.error('Error creating new session:', err)
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

  const handleExportChat = async (sessionId: string, format: 'pdf' | 'txt') => {
    // TODO: Implement export functionality
    console.log(`Exporting session ${sessionId} as ${format}`)
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
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeSession ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {activeSession.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-500">
                      Chat with {model.name}
                    </p>
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
                  </div>
                </div>
              </div>
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
