import { useState, useCallback, useMemo } from 'react'
import {
  cleanText,
  cleanChatMessage,
  getCleaningStats,
  CleanTextOptions,
  CleaningStats,
} from '@/lib/text-cleaner'

/**
 * Hook for cleaning text with various options
 *
 * @param initialText - Initial text to clean
 * @param options - Cleaning options
 * @returns Object with cleaned text, stats, and utility functions
 *
 * @example
 * ```tsx
 * function ChatMessage({ message }) {
 *   const { cleanedText, stats, clean, reset } = useTextCleaner(message)
 *
 *   return (
 *     <div>
 *       <p>{cleanedText}</p>
 *       <button onClick={clean}>Clean</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useTextCleaner(
  initialText: string = '',
  options?: CleanTextOptions
) {
  const [originalText, setOriginalText] = useState(initialText)
  const [cleanedText, setCleanedText] = useState('')
  const [isClean, setIsClean] = useState(false)

  // Clean the text
  const clean = useCallback(() => {
    const result = options
      ? cleanText(originalText, options)
      : cleanChatMessage(originalText)

    setCleanedText(result)
    setIsClean(true)

    return result
  }, [originalText, options])

  // Reset to original
  const reset = useCallback(() => {
    setCleanedText('')
    setIsClean(false)
  }, [])

  // Update original text
  const setText = useCallback((text: string) => {
    setOriginalText(text)
    setCleanedText('')
    setIsClean(false)
  }, [])

  // Copy to clipboard
  const copyToClipboard = useCallback(async () => {
    if (!cleanedText) return false

    try {
      await navigator.clipboard.writeText(cleanedText)
      return true
    } catch (err) {
      console.error('Failed to copy:', err)
      return false
    }
  }, [cleanedText])

  // Get statistics
  const stats = useMemo<CleaningStats>(() => {
    return getCleaningStats(originalText)
  }, [originalText])

  // Auto-clean version (always returns cleaned text)
  const autoCleanedText = useMemo(() => {
    return cleanChatMessage(originalText)
  }, [originalText])

  return {
    // State
    originalText,
    cleanedText,
    isClean,
    autoCleanedText,

    // Actions
    clean,
    reset,
    setText,
    copyToClipboard,

    // Stats
    stats,
  }
}

/**
 * Hook for automatically cleaning text (no manual action required)
 *
 * @param text - Text to clean
 * @param options - Cleaning options
 * @returns Cleaned text
 *
 * @example
 * ```tsx
 * function ChatMessage({ message }) {
 *   const cleanedMessage = useAutoCleanText(message)
 *   return <p>{cleanedMessage}</p>
 * }
 * ```
 */
export function useAutoCleanText(
  text: string,
  options?: CleanTextOptions
): string {
  return useMemo(() => {
    return options ? cleanText(text, options) : cleanChatMessage(text)
  }, [text, options])
}

/**
 * Hook for cleaning an array of messages
 *
 * @param messages - Array of message strings
 * @returns Array of cleaned messages
 *
 * @example
 * ```tsx
 * function ChatHistory({ messages }) {
 *   const cleanedMessages = useCleanMessages(messages)
 *
 *   return (
 *     <div>
 *       {cleanedMessages.map((msg, i) => (
 *         <p key={i}>{msg}</p>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useCleanMessages(messages: string[]): string[] {
  return useMemo(() => {
    return messages.map((msg) => cleanChatMessage(msg))
  }, [messages])
}

/**
 * Hook for toggling between original and cleaned text
 *
 * @param text - Original text
 * @returns Object with current display text and toggle function
 *
 * @example
 * ```tsx
 * function ToggleableText({ message }) {
 *   const { displayText, isShowingCleaned, toggle } = useToggleCleanText(message)
 *
 *   return (
 *     <div>
 *       <p>{displayText}</p>
 *       <button onClick={toggle}>
 *         {isShowingCleaned ? 'Show Original' : 'Show Cleaned'}
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useToggleCleanText(text: string) {
  const [isShowingCleaned, setIsShowingCleaned] = useState(false)

  const cleanedText = useMemo(() => cleanChatMessage(text), [text])

  const toggle = useCallback(() => {
    setIsShowingCleaned((prev) => !prev)
  }, [])

  const showCleaned = useCallback(() => {
    setIsShowingCleaned(true)
  }, [])

  const showOriginal = useCallback(() => {
    setIsShowingCleaned(false)
  }, [])

  return {
    displayText: isShowingCleaned ? cleanedText : text,
    isShowingCleaned,
    toggle,
    showCleaned,
    showOriginal,
    originalText: text,
    cleanedText,
  }
}
