'use client'

import React, { useState, useEffect } from 'react'
import { cleanText, cleanChatMessage, previewCleaning, CleanTextOptions } from '@/lib/text-cleaner'

/**
 * TextCleaner Component Props
 */
interface TextCleanerProps {
  /** The text to clean */
  text: string
  /** Auto-clean on mount */
  autoClean?: boolean
  /** Show preview mode (before/after comparison) */
  showPreview?: boolean
  /** Custom cleaning options */
  options?: CleanTextOptions
  /** Callback when text is cleaned */
  onClean?: (cleanedText: string) => void
  /** CSS classes */
  className?: string
}

/**
 * TextCleaner Component
 *
 * Displays and cleans text by removing unwanted markdown characters
 *
 * @example
 * ```tsx
 * <TextCleaner
 *   text="### **Hello World**"
 *   autoClean
 *   showPreview
 * />
 * ```
 */
export function TextCleaner({
  text,
  autoClean = false,
  showPreview = false,
  options,
  onClean,
  className = '',
}: TextCleanerProps) {
  const [cleanedText, setCleanedText] = useState('')
  const [isClean, setIsClean] = useState(false)

  // Auto-clean on mount if enabled
  useEffect(() => {
    if (autoClean && text) {
      handleClean()
    }
  }, [text, autoClean])

  const handleClean = () => {
    const result = options
      ? cleanText(text, options)
      : cleanChatMessage(text)

    setCleanedText(result)
    setIsClean(true)

    if (onClean) {
      onClean(result)
    }
  }

  const handleReset = () => {
    setCleanedText('')
    setIsClean(false)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanedText)
      alert('Cleaned text copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Preview mode shows before/after
  if (showPreview) {
    const preview = previewCleaning(text)

    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Before */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">
              Original (with formatting)
            </h3>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg min-h-[200px] font-mono text-sm whitespace-pre-wrap">
              {text}
            </div>
          </div>

          {/* After */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-green-700">
              Cleaned (no formatting)
            </h3>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg min-h-[200px] font-mono text-sm whitespace-pre-wrap">
              {preview.cleaned}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Removed:</span> {preview.removedCount} characters
          </p>
          {preview.removedPatterns.length > 0 && (
            <p className="text-sm text-blue-900 mt-1">
              <span className="font-semibold">Patterns found:</span>{' '}
              {preview.removedPatterns.join(', ')}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Copy Cleaned Text
          </button>
        </div>
      </div>
    )
  }

  // Normal mode (single display with clean button)
  return (
    <div className={`space-y-4 ${className}`}>
      {!isClean ? (
        <>
          {/* Original text */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm whitespace-pre-wrap">
            {text}
          </div>

          {/* Clean button */}
          <button
            onClick={handleClean}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Clean Text
          </button>
        </>
      ) : (
        <>
          {/* Cleaned text */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg font-mono text-sm whitespace-pre-wrap">
            {cleanedText}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Copy
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Reset
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Inline text cleaner that automatically cleans and displays text
 */
export function CleanTextDisplay({ text, className = '' }: { text: string; className?: string }) {
  const cleaned = cleanChatMessage(text)

  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {cleaned}
    </div>
  )
}
