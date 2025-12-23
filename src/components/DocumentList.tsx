'use client'

import { FileText, FileCode, FileImage, File, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export interface Document {
  id: string
  fileName: string
  fileType?: string
  status: 'uploaded' | 'processing' | 'processed' | 'failed'
  fileSize?: number
  chunkCount?: number
  processedAt?: string
}

interface DocumentListProps {
  documents: Document[]
  title?: string
  compact?: boolean
  showStatus?: boolean
  className?: string
  emptyMessage?: string
}

function getFileIcon(fileType?: string) {
  if (!fileType) return <File className="w-4 h-4" />

  if (fileType.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />
  if (fileType.includes('text') || fileType.includes('txt'))
    return <FileText className="w-4 h-4 text-gray-500" />
  if (fileType.includes('word') || fileType.includes('docx'))
    return <FileText className="w-4 h-4 text-blue-500" />
  if (fileType.includes('image') || fileType.includes('png') || fileType.includes('jpg'))
    return <FileImage className="w-4 h-4 text-purple-500" />
  if (fileType.includes('code') || fileType.includes('json') || fileType.includes('js'))
    return <FileCode className="w-4 h-4 text-green-500" />

  return <File className="w-4 h-4 text-gray-500" />
}

function getStatusIcon(status: Document['status']) {
  switch (status) {
    case 'processed':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />
    case 'processing':
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />
    default:
      return null
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function truncateFileName(fileName: string, maxLength: number = 30): string {
  if (fileName.length <= maxLength) return fileName

  const extension = fileName.split('.').pop() || ''
  const nameWithoutExt = fileName.slice(0, -(extension.length + 1))
  const truncated = nameWithoutExt.slice(0, maxLength - extension.length - 4)

  return `${truncated}...${extension}`
}

export function DocumentList({
  documents,
  title = 'Documents',
  compact = false,
  showStatus = true,
  className = '',
  emptyMessage = 'No documents uploaded yet',
}: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={className}>
      {title && (
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {title} ({documents.length})
        </h3>
      )}

      <div className="space-y-1.5">
        {documents.map((doc, index) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className={`
              flex items-center gap-2
              ${
                compact
                  ? 'py-1'
                  : 'p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
              }
            `}
          >
            {/* File Icon */}
            <div className="flex-shrink-0">{getFileIcon(doc.fileType)}</div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {truncateFileName(doc.fileName, compact ? 25 : 40)}
              </p>

              {!compact && (
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                  {doc.chunkCount && <span>{doc.chunkCount} chunks</span>}
                  {doc.processedAt && (
                    <span>
                      {new Date(doc.processedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Status Icon */}
            {showStatus && (
              <div className="flex-shrink-0">{getStatusIcon(doc.status)}</div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/**
 * Compact variant for chat interface
 */
export function DocumentListCompact({
  documents,
  className = '',
}: {
  documents: Document[]
  className?: string
}) {
  if (documents.length === 0) return null

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {documents.map((doc) => (
        <motion.div
          key={doc.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="
            inline-flex items-center gap-1.5 px-2 py-1
            rounded-md text-xs font-medium
            bg-blue-50 dark:bg-blue-900/20
            text-blue-700 dark:text-blue-300
            border border-blue-200 dark:border-blue-700
          "
        >
          {getFileIcon(doc.fileType)}
          <span className="max-w-[150px] truncate">{doc.fileName}</span>
        </motion.div>
      ))}
    </div>
  )
}

/**
 * Document count badge
 */
export function DocumentCount({
  count,
  className = '',
}: {
  count: number
  className?: string
}) {
  if (count === 0) return null

  return (
    <div
      className={`
        inline-flex items-center gap-1 px-2 py-1
        rounded-md text-xs font-medium
        bg-gray-100 dark:bg-gray-800
        text-gray-700 dark:text-gray-300
        ${className}
      `}
    >
      <FileText className="w-3 h-3" />
      <span>{count} document{count !== 1 ? 's' : ''}</span>
    </div>
  )
}

/**
 * Example usage:
 *
 * // Full list (dashboard)
 * <DocumentList
 *   documents={[
 *     {
 *       id: '1',
 *       fileName: 'keto-recipes.pdf',
 *       fileType: 'application/pdf',
 *       status: 'processed',
 *       fileSize: 2600000,
 *       chunkCount: 15,
 *       processedAt: '2025-01-10T12:00:00Z'
 *     }
 *   ]}
 *   title="Training Documents"
 *   showStatus
 * />
 *
 * // Compact list (chat sidebar)
 * <DocumentList
 *   documents={documents}
 *   compact
 *   showStatus={false}
 * />
 *
 * // Badge list (chat interface)
 * <DocumentListCompact documents={documents} />
 *
 * // Just the count
 * <DocumentCount count={3} />
 */
