/**
 * Desktop Chat Service
 * Manages chat sessions and messages using local SQLite database
 */

import { invoke } from '@tauri-apps/api/core'

export interface ChatSession {
    id: string
    model_id: string
    title: string
    created_at: string
    updated_at: string
}

export interface NewChatSession {
    model_id: string
    title: string
}

export interface ChatMessage {
    id: string
    session_id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    created_at: string
}

export interface NewChatMessage {
    session_id: string
    role: 'user' | 'assistant' | 'system'
    content: string
}

// ============ CHAT SESSIONS ============

/**
 * Create a new chat session
 */
export async function createChatSession(session: NewChatSession): Promise<ChatSession> {
    try {
        return await invoke('db_create_chat_session', { session })
    } catch (error) {
        console.error('Failed to create chat session:', error)
        throw new Error(error as string)
    }
}

/**
 * List all chat sessions for a model
 */
export async function listChatSessions(modelId: string): Promise<ChatSession[]> {
    try {
        return await invoke('db_list_chat_sessions', { modelId })
    } catch (error) {
        console.error('Failed to list chat sessions:', error)
        throw new Error(error as string)
    }
}

/**
 * Get a chat session by ID
 */
export async function getChatSession(id: string): Promise<ChatSession | null> {
    try {
        return await invoke('db_get_chat_session', { id })
    } catch (error) {
        console.error('Failed to get chat session:', error)
        throw new Error(error as string)
    }
}

/**
 * Delete a chat session
 */
export async function deleteChatSession(id: string): Promise<void> {
    try {
        await invoke('db_delete_chat_session', { id })
    } catch (error) {
        console.error('Failed to delete chat session:', error)
        throw new Error(error as string)
    }
}

// ============ CHAT MESSAGES ============

/**
 * Add a message to a chat session
 */
export async function addChatMessage(message: NewChatMessage): Promise<ChatMessage> {
    try {
        return await invoke('db_add_chat_message', { message })
    } catch (error) {
        console.error('Failed to add chat message:', error)
        throw new Error(error as string)
    }
}

/**
 * Get all messages for a chat session
 */
export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
        return await invoke('db_get_chat_messages', { sessionId })
    } catch (error) {
        console.error('Failed to get chat messages:', error)
        throw new Error(error as string)
    }
}

// ============ CHAT AI INTEGRATION ============

/**
 * Send a message and get AI response with RAG context
 */
export async function sendChatMessage(params: {
    sessionId: string
    modelId: string
    userMessage: string
    ollamaModel?: string
    useRag?: boolean
}): Promise<{
    userMessage: ChatMessage
    assistantMessage: ChatMessage
}> {
    try {
        // 1. Save user message
        const userMsg = await addChatMessage({
            session_id: params.sessionId,
            role: 'user',
            content: params.userMessage,
        })

        // 2. Get RAG context if enabled
        let context: string | null = null
        if (params.useRag) {
            try {
                // Generate embedding for user message
                const embedding = await invoke<number[]>('generate_embeddings', {
                    model: 'nomic-embed-text',
                    text: params.userMessage,
                })

                // Get relevant context from vector database
                context = await invoke<string>('get_rag_context', {
                    modelId: params.modelId,
                    queryEmbedding: embedding,
                    maxChunks: 5,
                    encrypted: false,
                    password: null,
                })
            } catch (error) {
                console.warn('RAG context retrieval failed, continuing without it:', error)
            }
        }

        // 3. Generate AI response
        const prompt = context
            ? `Context from training data:\n\n${context}\n\nUser question: ${params.userMessage}`
            : params.userMessage

        const aiResponse = await invoke<string>('generate_response', {
            model: params.ollamaModel || 'mistral:7b',
            prompt,
            context: null,
        })

        // 4. Save assistant message
        const assistantMsg = await addChatMessage({
            session_id: params.sessionId,
            role: 'assistant',
            content: aiResponse,
        })

        return {
            userMessage: userMsg,
            assistantMessage: assistantMsg,
        }
    } catch (error) {
        console.error('Failed to send chat message:', error)
        throw new Error(error as string)
    }
}
