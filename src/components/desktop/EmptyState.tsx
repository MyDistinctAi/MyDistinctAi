'use client'

/**
 * Desktop Empty State Components
 * 
 * Helpful empty states with CTAs when no data exists
 */

import React from 'react'
import Link from 'next/link'
import {
    Brain,
    Database,
    MessageSquare,
    Upload,
    Plus,
    FileText
} from 'lucide-react'

interface EmptyStateProps {
    icon: React.ElementType
    title: string
    description: string
    actionLabel?: string
    actionHref?: string
    onAction?: () => void
}

/**
 * Generic empty state component
 */
export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionHref,
    onAction
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
                <Icon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 text-center max-w-sm mb-6">{description}</p>
            {actionLabel && (actionHref || onAction) && (
                actionHref ? (
                    <Link
                        href={actionHref}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        {actionLabel}
                    </Link>
                ) : (
                    <button
                        onClick={onAction}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        {actionLabel}
                    </button>
                )
            )}
        </div>
    )
}

/**
 * Empty state for models list
 */
export function NoModelsState() {
    return (
        <EmptyState
            icon={Brain}
            title="No models yet"
            description="Create your first AI model to get started with custom training and chat."
            actionLabel="Create Model"
            actionHref="/desktop/dashboard/models"
        />
    )
}

/**
 * Empty state for training data
 */
export function NoTrainingDataState({ onUpload }: { onUpload?: () => void }) {
    return (
        <EmptyState
            icon={Database}
            title="No training data"
            description="Upload documents to train your AI models with custom knowledge."
            actionLabel="Upload Files"
            onAction={onUpload}
        />
    )
}

/**
 * Empty state for chat sessions
 */
export function NoChatSessionsState({ onNewChat }: { onNewChat?: () => void }) {
    return (
        <EmptyState
            icon={MessageSquare}
            title="No chat sessions"
            description="Start a new chat to interact with your AI model."
            actionLabel="New Chat"
            onAction={onNewChat}
        />
    )
}

/**
 * Empty state for messages in a chat
 */
export function NoChatMessagesState() {
    return (
        <div className="flex flex-col items-center justify-center py-8 px-4">
            <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">
                No messages yet. Start the conversation!
            </p>
        </div>
    )
}

/**
 * Empty state for file list
 */
export function NoFilesState({ onUpload }: { onUpload?: () => void }) {
    return (
        <EmptyState
            icon={FileText}
            title="No files uploaded"
            description="Upload PDF, DOCX, TXT, or MD files to use as training data."
            actionLabel="Upload Files"
            onAction={onUpload}
        />
    )
}

/**
 * Compact empty state for inline use
 */
export function EmptyStateInline({
    message,
    icon: Icon = FileText
}: {
    message: string
    icon?: React.ElementType
}) {
    return (
        <div className="flex items-center gap-3 py-4 px-4 bg-gray-50 rounded-lg">
            <Icon className="h-5 w-5 text-gray-400" />
            <span className="text-gray-600 text-sm">{message}</span>
        </div>
    )
}
