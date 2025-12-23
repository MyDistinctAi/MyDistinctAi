'use client'

/**
 * Desktop Chat Page
 * Chat with AI models using RAG
 */

import { useEffect, useState } from 'react'
import { Send, Plus } from 'lucide-react'
import { listModels, type Model } from '@/lib/desktop/models-service'
import { listChatSessions, createChatSession, getChatMessages, sendChatMessage, type ChatSession, type ChatMessage } from '@/lib/desktop/chat-service'
import { getOfflineUser } from '@/lib/offline-auth'

export default function DesktopChatPage() {
    const [models, setModels] = useState<Model[]>([])
    const [selectedModelId, setSelectedModelId] = useState<string>('')
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [selectedSessionId, setSelectedSessionId] = useState<string>('')
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)

    useEffect(() => {
        loadModels()
    }, [])

    useEffect(() => {
        if (selectedModelId) {
            loadSessions(selectedModelId)
        }
    }, [selectedModelId])

    useEffect(() => {
        if (selectedSessionId) {
            loadMessages(selectedSessionId)
        }
    }, [selectedSessionId])

    const loadModels = async () => {
        try {
            const user = await getOfflineUser()
            if (user) {
                const modelsList = await listModels(user.userId)
                setModels(modelsList)
                if (modelsList.length > 0 && !selectedModelId) {
                    setSelectedModelId(modelsList[0].id)
                }
            }
        } catch (error) {
            console.error('Failed to load models:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadSessions = async (modelId: string) => {
        try {
            const sessionsList = await listChatSessions(modelId)
            setSessions(sessionsList)
        } catch (error) {
            console.error('Failed to load sessions:', error)
        }
    }

    const loadMessages = async (sessionId: string) => {
        try {
            const messagesList = await getChatMessages(sessionId)
            setMessages(messagesList)
        } catch (error) {
            console.error('Failed to load messages:', error)
        }
    }

    const handleNewSession = async () => {
        if (!selectedModelId) return
        try {
            const newSession = await createChatSession({
                model_id: selectedModelId,
                title: `Chat ${new Date().toLocaleString()}`,
            })
            await loadSessions(selectedModelId)
            setSelectedSessionId(newSession.id)
        } catch (error) {
            console.error('Failed to create session:', error)
        }
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || !selectedSessionId || sending) return

        setSending(true)
        try {
            const result = await sendChatMessage({
                sessionId: selectedSessionId,
                modelId: selectedModelId,
                userMessage: input,
                useRag: true,
            })

            setMessages([...messages, result.userMessage, result.assistantMessage])
            setInput('')
        } catch (error) {
            console.error('Failed to send message:', error)
            alert('Failed to send message: ' + error)
        } finally {
            setSending(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (models.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-12 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No models available</h3>
                <p className="text-gray-600">Create a model first before chatting</p>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-200px)] flex gap-4">
            {/* Sidebar */}
            <div className="w-64 bg-white rounded-lg shadow p-4 flex flex-col">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                    <select
                        value={selectedModelId}
                        onChange={(e) => setSelectedModelId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                        {models.map((model) => (
                            <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleNewSession}
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm mb-4"
                >
                    <Plus className="w-4 h-4" />
                    New Chat
                </button>

                <div className="flex-1 overflow-y-auto space-y-2">
                    {sessions.map((session) => (
                        <button
                            key={session.id}
                            onClick={() => setSelectedSessionId(session.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedSessionId === session.id
                                    ? 'bg-blue-100 text-blue-900'
                                    : 'hover:bg-gray-100'
                                }`}
                        >
                            {session.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white rounded-lg shadow flex flex-col">
                {selectedSessionId ? (
                    <>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-2xl px-4 py-2 rounded-lg ${message.role === 'user'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-900'
                                            }`}
                                    >
                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                </div>
                            ))}
                            {sending && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 px-4 py-2 rounded-lg">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 border-t">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    disabled={sending}
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !input.trim()}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    Send
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        Select or create a chat session to start
                    </div>
                )}
            </div>
        </div>
    )
}
