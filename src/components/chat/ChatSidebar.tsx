/**
 * Chat Sidebar Component
 *
 * List of chat sessions with new chat button
 */

'use client'

import { Plus, MessageSquare, Download } from 'lucide-react'
import type { ChatSession } from '@/types/chat'

interface ChatSidebarProps {
  sessions: ChatSession[]
  activeSessionId?: string
  modelName: string
  onSelectSession: (sessionId: string) => void
  onNewChat: () => void
  onExportChat?: (sessionId: string, format: 'pdf' | 'txt') => void
}

export default function ChatSidebar({
  sessions,
  activeSessionId,
  modelName,
  onSelectSession,
  onNewChat,
  onExportChat,
}: ChatSidebarProps) {
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    }
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {modelName}
        </h2>
        <p className="text-xs text-gray-500">Chat Sessions</p>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            No chat sessions yet
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId

              return (
                <div
                  key={session.id}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <button
                    onClick={() => onSelectSession(session.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                        isActive ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isActive ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {session.title || 'Untitled Chat'}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {session.last_message || 'No messages yet'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(session.updated_at)}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Export buttons (shown for active session) */}
                  {onExportChat && isActive && (
                    <div className="mt-2 pt-2 border-t border-gray-200 flex gap-2">
                      <button
                        onClick={() => onExportChat(session.id, 'txt')}
                        className="flex-1 text-xs text-gray-600 hover:text-gray-900 py-1 px-2 rounded hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        TXT
                      </button>
                      <button
                        onClick={() => onExportChat(session.id, 'pdf')}
                        className="flex-1 text-xs text-gray-600 hover:text-gray-900 py-1 px-2 rounded hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        PDF
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
