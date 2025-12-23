/**
 * Text Cleaner Utility
 * Removes unwanted markdown characters and formatting from chat responses
 */

/**
 * Configuration for text cleaning operations
 */
export interface CleanTextOptions {
  /** Remove markdown headers (###, ##, #) */
  removeHeaders?: boolean
  /** Remove bold/italic markers (**text**, *text*) */
  removeEmphasis?: boolean
  /** Remove extra whitespace and newlines */
  trimWhitespace?: boolean
  /** Remove specific characters or patterns */
  customPatterns?: RegExp[]
  /** Preserve line breaks */
  preserveLineBreaks?: boolean
}

/**
 * Default cleaning options
 */
const DEFAULT_OPTIONS: CleanTextOptions = {
  removeHeaders: true,
  removeEmphasis: true,
  trimWhitespace: true,
  preserveLineBreaks: true,
}

/**
 * Clean text by removing unwanted markdown characters
 *
 * @param text - The text to clean
 * @param options - Cleaning options
 * @returns Cleaned text
 *
 * @example
 * ```typescript
 * const dirtyText = "### **Key Components:**\n- **Item 1**\n- Item 2"
 * const cleaned = cleanText(dirtyText)
 * // Result: "Key Components:\n- Item 1\n- Item 2"
 * ```
 */
export function cleanText(
  text: string,
  options: CleanTextOptions = {}
): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  const opts = { ...DEFAULT_OPTIONS, ...options }
  let cleaned = text

  // Remove markdown headers (###, ##, #) - must be at start of line
  if (opts.removeHeaders) {
    cleaned = cleaned.replace(/^#{1,6}\s*/gm, '')
  }

  // Remove bold markers (**text**)
  if (opts.removeEmphasis) {
    // Remove all instances of ** (bold markers)
    // This handles cases like **text**, **text:**, multiple **words** on same line
    while (cleaned.includes('**')) {
      cleaned = cleaned.replace('**', '')
    }
  }

  // Remove italic markers (*text*) - but preserve list bullets (- *)
  if (opts.removeEmphasis) {
    // Remove standalone single asterisks used for emphasis
    // But preserve asterisks that are list bullets (at start of line after dash and space)
    // Pattern: match * that is NOT part of "- *" pattern
    cleaned = cleaned
      .split('\n')
      .map(line => {
        // If line starts with "- *" (list bullet), keep it
        if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
          return line
        }
        // Otherwise remove all single asterisks
        return line.replace(/\*/g, '')
      })
      .join('\n')
  }

  // Remove custom patterns if provided
  if (opts.customPatterns && opts.customPatterns.length > 0) {
    opts.customPatterns.forEach((pattern) => {
      cleaned = cleaned.replace(pattern, '')
    })
  }

  // Trim whitespace
  if (opts.trimWhitespace) {
    // Remove leading/trailing whitespace from each line
    cleaned = cleaned
      .split('\n')
      .map((line) => line.trim())
      .join('\n')

    // Remove multiple consecutive blank lines (keep max 2)
    if (opts.preserveLineBreaks) {
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
    } else {
      cleaned = cleaned.replace(/\n{2,}/g, '\n')
    }

    // Trim overall
    cleaned = cleaned.trim()
  }

  return cleaned
}

/**
 * Clean text specifically for chat messages
 * Removes common markdown formatting while preserving structure
 *
 * @param text - The chat message text
 * @returns Cleaned text
 */
export function cleanChatMessage(text: string): string {
  return cleanText(text, {
    removeHeaders: true,
    removeEmphasis: true,
    trimWhitespace: true,
    preserveLineBreaks: true,
  })
}

/**
 * Clean text for display in UI
 * More aggressive cleaning, suitable for compact displays
 *
 * @param text - The text to clean
 * @returns Cleaned text
 */
export function cleanForDisplay(text: string): string {
  return cleanText(text, {
    removeHeaders: true,
    removeEmphasis: true,
    trimWhitespace: true,
    preserveLineBreaks: false,
  })
}

/**
 * Preview cleaning results
 * Shows before/after comparison
 *
 * @param text - The text to preview
 * @returns Object with original and cleaned text
 */
export function previewCleaning(text: string): {
  original: string
  cleaned: string
  removedCount: number
  removedPatterns: string[]
} {
  const cleaned = cleanChatMessage(text)
  const removedPatterns: string[] = []

  // Count removed patterns
  if (/#{1,6}\s+/.test(text)) removedPatterns.push('Headers (###)')
  if (/\*\*[^*]+\*\*/.test(text)) removedPatterns.push('Bold (**)')
  if (/\*[^*]+\*/.test(text)) removedPatterns.push('Italic (*)')

  const removedCount = text.length - cleaned.length

  return {
    original: text,
    cleaned,
    removedCount,
    removedPatterns,
  }
}

/**
 * Batch clean multiple messages
 *
 * @param messages - Array of message strings
 * @returns Array of cleaned messages
 */
export function cleanMessages(messages: string[]): string[] {
  return messages.map((msg) => cleanChatMessage(msg))
}

/**
 * Clean text while preserving code blocks
 * Useful for technical chat messages
 *
 * @param text - The text to clean
 * @returns Cleaned text with code blocks preserved
 */
export function cleanWithCodeBlocks(text: string): string {
  // Extract code blocks
  const codeBlocks: string[] = []
  const placeholder = '___CODE_BLOCK___'

  let textWithPlaceholders = text.replace(
    /```[\s\S]*?```/g,
    (match) => {
      codeBlocks.push(match)
      return placeholder
    }
  )

  // Clean the text (excluding code blocks)
  textWithPlaceholders = cleanChatMessage(textWithPlaceholders)

  // Restore code blocks
  codeBlocks.forEach((block) => {
    textWithPlaceholders = textWithPlaceholders.replace(
      placeholder,
      block
    )
  })

  return textWithPlaceholders
}

/**
 * Statistics about cleaned text
 */
export interface CleaningStats {
  originalLength: number
  cleanedLength: number
  bytesRemoved: number
  percentageReduced: number
  patternsFound: {
    headers: number
    bold: number
    italic: number
  }
}

/**
 * Get statistics about the cleaning operation
 *
 * @param text - The original text
 * @returns Cleaning statistics
 */
export function getCleaningStats(text: string): CleaningStats {
  const cleaned = cleanChatMessage(text)

  return {
    originalLength: text.length,
    cleanedLength: cleaned.length,
    bytesRemoved: text.length - cleaned.length,
    percentageReduced: Math.round(
      ((text.length - cleaned.length) / text.length) * 100
    ),
    patternsFound: {
      headers: (text.match(/#{1,6}\s+/g) || []).length,
      bold: (text.match(/\*\*[^*]+\*\*/g) || []).length,
      italic: (text.match(/\*[^*]+\*/g) || []).length,
    },
  }
}
