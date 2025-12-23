/**
 * Chat Sidebar Component
 *
 * List of chat sessions with new chat button
 */

'use client'

import { useState } from 'react'
import { Plus, MessageSquare, Download, Edit2, Trash2, FileText, FileJson } from 'lucide-react'
import type { ChatSession } from '@/types/chat'

interface ChatSidebarProps {
  sessions: ChatSession[]
  activeSessionId?: string
  modelName: string
  onSelectSession: (sessionId: string) => void
  onNewChat: () => void
  onExportChat?: (sessionId: string, format: 'pdf' | 'txt' | 'json' | 'md') => void
  onRenameChat?: (sessionId: string, newTitle: string) => void
  onDeleteChat?: (sessionId: string) => void
}

export default function ChatSidebar({
  sessions,
  activeSessionId,
  modelName,
  onSelectSession,
  onNewChat,
  onExportChat,
  onRenameChat,
  onDeleteChat,
}: ChatSidebarProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [showExportMenu, setShowExportMenu] = useState<string | null>(null)

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

  const handleStartEdit = (session: ChatSession) => {
    setEditingSessionId(session.id)
    setEditTitle(session.title || 'Untitled Chat')
  }

  const handleSaveEdit = (sessionId: string) => {
    if (onRenameChat && editTitle.trim()) {
      onRenameChat(sessionId, editTitle.trim())
    }
    setEditingSessionId(null)
    setEditTitle('')
  }

  const handleCancelEdit = () => {
    setEditingSessionId(null)
    setEditTitle('')
  }

  const handleDelete = (sessionId: string) => {
    if (onDeleteChat && confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
      onDeleteChat(sessionId)
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
              const isEditing = editingSessionId === session.id

              return (
                <div
                  key={session.id}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  {isEditing ? (
                    /* Edit Mode */
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(session.id)
                          if (e.key === 'Escape') handleCancelEdit()
                        }}
                        className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(session.id)}
                          className="flex-1 text-xs bg-blue-600 text-white py-1 px-2 rounded hover:bg-blue-700 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 text-xs bg-gray-200 text-gray-700 py-1 px-2 rounded hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <>
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

                      {/* Action buttons (shown for active session) */}
                      {isActive && (
                        <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                          {/* Rename and Delete */}
                          <div className="flex gap-2">
                            {onRenameChat && (
                              <button
                                onClick={() => handleStartEdit(session)}
                                className="flex-1 text-xs text-gray-600 hover:text-gray-900 py-1 px-2 rounded hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
                                title="Rename conversation"
                              >
                                <Edit2 className="h-3 w-3" />
                                Rename
                              </button>
                            )}
                            {onDeleteChat && (
                              <button
                                onClick={() => handleDelete(session.id)}
                                className="flex-1 text-xs text-red-600 hover:text-red-900 py-1 px-2 rounded hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                                title="Delete conversation"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </button>
                            )}
                          </div>

                          {/* Export options */}
                          {onExportChat && (
                            <div className="relative">
                              <button
                                onClick={() => setShowExportMenu(showExportMenu === session.id ? null : session.id)}
                                className="w-full text-xs text-gray-600 hover:text-gray-900 py-1 px-2 rounded hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
                              >
                                <Download className="h-3 w-3" />
                                Export
                              </button>

                              {showExportMenu === session.id && (
                                <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                  <button
                                    onClick={() => {
                                      onExportChat(session.id, 'json')
                                      setShowExportMenu(null)
                                    }}
                                    className="w-full text-left text-xs text-gray-700 hover:bg-gray-50 py-2 px-3 flex items-center gap-2 rounded-t-lg"
                                  >
                                    <FileJson className="h-3 w-3" />
                                    JSON (Structured)
                                  </button>
                                  <button
                                    onClick={() => {
                                      onExportChat(session.id, 'md')
                                      setShowExportMenu(null)
                                    }}
                                    className="w-full text-left text-xs text-gray-700 hover:bg-gray-50 py-2 px-3 flex items-center gap-2"
                                  >
                                    <FileText className="h-3 w-3" />
                                    Markdown
                                  </button>
                                  <button
                                    onClick={() => {
                                      onExportChat(session.id, 'txt')
                                      setShowExportMenu(null)
                                    }}
                                    className="w-full text-left text-xs text-gray-700 hover:bg-gray-50 py-2 px-3 flex items-center gap-2 rounded-b-lg"
                                  >
                                    <FileText className="h-3 w-3" />
                                    Plain Text
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
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
