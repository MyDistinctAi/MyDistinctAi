/**
 * Chat Messages Component
 *
 * Display area for chat messages with syntax highlighting
 */

'use client'

import { useEffect, useRef } from 'react'
import { User, Bot, Copy, RotateCcw } from 'lucide-react'
import type { ChatMessage } from '@/types/chat'
import { cleanChatMessage } from '@/lib/text-cleaner'

interface ChatMessagesProps {
  messages: ChatMessage[]
  isLoading?: boolean
  onRegenerateResponse?: (messageId: string) => void
}

export default function ChatMessages({
  messages,
  isLoading = false,
  onRegenerateResponse,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      // TODO: Show toast notification
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const renderMessageContent = (content: string, isAssistant: boolean) => {
    // Clean assistant messages to remove markdown characters
    const cleanedContent = isAssistant ? cleanChatMessage(content) : content

    // Simple code block detection with ```
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    const parts: JSX.Element[] = []
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(cleanedContent)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <p key={`text-${lastIndex}`} className="whitespace-pre-wrap">
            {cleanedContent.slice(lastIndex, match.index)}
          </p>
        )
      }

      // Add code block
      const language = match[1] || 'text'
      const code = match[2].trim()
      parts.push(
        <div key={`code-${match.index}`} className="my-2 rounded-lg overflow-hidden">
          <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">{language}</span>
            <button
              onClick={() => handleCopyMessage(code)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto">
            <code className={`language-${language}`}>{code}</code>
          </pre>
        </div>
      )

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < cleanedContent.length) {
      parts.push(
        <p key={`text-${lastIndex}`} className="whitespace-pre-wrap">
          {cleanedContent.slice(lastIndex)}
        </p>
      )
    }

    return parts.length > 0 ? parts : <p className="whitespace-pre-wrap">{cleanedContent}</p>
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && !isLoading && (
        <div className="flex items-center justify-center h-full text-gray-400">
          <p>No messages yet. Start a conversation!</p>
        </div>
      )}

      {messages.map((message, index) => {
        const isUser = message.role === 'user'
        const isLastAssistant =
          message.role === 'assistant' &&
          index === messages.length - 1

        return (
          <div
            key={message.id}
            className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isUser ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              {isUser ? (
                <User className="h-5 w-5 text-white" />
              ) : (
                <Bot className="h-5 w-5 text-white" />
              )}
            </div>

            {/* Message bubble */}
            <div className={`flex-1 max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
              <div
                className={`rounded-lg px-4 py-2 ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {renderMessageContent(message.content, !isUser)}
              </div>

              {/* Message footer */}
              <div className={`flex items-center gap-2 mt-1 px-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                <span className="text-xs text-gray-500">
                  {formatTime(message.created_at)}
                </span>

                {!isUser && (
                  <>
                    <button
                      onClick={() => handleCopyMessage(message.content)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy message"
                    >
                      <Copy className="h-3 w-3" />
                    </button>

                    {isLastAssistant && onRegenerateResponse && (
                      <button
                        onClick={() => onRegenerateResponse(message.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Regenerate response"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Typing indicator */}
      {isLoading && (
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div className="bg-gray-100 rounded-lg px-4 py-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
