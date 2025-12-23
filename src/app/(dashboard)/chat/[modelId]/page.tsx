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
        // TODO: Fetch model from API
        // For now, using mock data
        setModel({
          id: modelId,
          user_id: 'user-123',
          name: 'My Custom Model',
          description: 'A custom trained AI model',
          status: 'ready',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      } catch (err) {
        setError('Failed to load model')
        console.error(err)
      }
    }

    if (modelId) {
      loadModel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId])

  // Load chat sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        // TODO: Fetch sessions from API
        // For now, using mock data
        const mockSessions = [
          {
            id: 'session-1',
            model_id: modelId,
            user_id: 'user-123',
            title: 'Introduction to AI',
            last_message: 'What is machine learning?',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'session-2',
            model_id: modelId,
            user_id: 'user-123',
            title: 'Code Review',
            last_message: 'Can you review this Python code?',
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
        ]

        setSessions(mockSessions)

        // Set first session as active
        setActiveSession(mockSessions[0])
      } catch (err) {
        console.error('Failed to load sessions:', err)
      }
    }

    if (modelId) {
      loadSessions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId])

  // Load messages for active session
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeSession) return

      try {
        // TODO: Fetch messages from API
        // For now, using mock data
        setMessages([
          {
            id: 'msg-1',
            session_id: activeSession.id,
            role: 'user',
            content: 'What is machine learning?',
            created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'msg-2',
            session_id: activeSession.id,
            role: 'assistant',
            content: 'Machine learning is a subset of artificial intelligence that enables computers to learn from data and improve their performance without being explicitly programmed.\n\nHere\'s a simple example in Python:\n\n```python\nfrom sklearn.linear_model import LinearRegression\nimport numpy as np\n\n# Training data\nX = np.array([[1], [2], [3], [4], [5]])\ny = np.array([2, 4, 6, 8, 10])\n\n# Create and train model\nmodel = LinearRegression()\nmodel.fit(X, y)\n\n# Make predictions\nprint(model.predict([[6]]))  # Output: [12.]\n```\n\nThis demonstrates supervised learning where the model learns the relationship between input and output.',
            created_at: new Date(Date.now() - 59 * 60 * 1000).toISOString(),
          },
        ])
      } catch (err) {
        console.error('Failed to load messages:', err)
      }
    }

    if (activeSession) {
      loadMessages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession?.id])

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

              if (data.token) {
                accumulatedContent += data.token

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

  const handleNewChat = () => {
    // Create new session
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      model_id: modelId,
      user_id: 'user-123',
      title: 'New Chat',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setSessions((prev) => [newSession, ...prev])
    setActiveSession(newSession)
    setMessages([])
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
              <h1 className="text-xl font-semibold text-gray-900">
                {activeSession.title}
              </h1>
              <p className="text-sm text-gray-500">
                Chat with {model.name}
              </p>
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
