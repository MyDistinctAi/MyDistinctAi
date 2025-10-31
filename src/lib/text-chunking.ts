/**
 * Text Chunking Utility
 * Splits text into chunks suitable for embedding generation
 */

export interface TextChunk {
  text: string
  index: number
  startChar: number
  endChar: number
}

export interface ChunkingOptions {
  chunkSize?: number // Number of characters per chunk
  overlap?: number // Number of characters to overlap between chunks
  preserveParagraphs?: boolean // Try to keep paragraphs intact
  minChunkSize?: number // Minimum chunk size (discard smaller chunks)
}

const DEFAULT_OPTIONS: Required<ChunkingOptions> = {
  chunkSize: 1000, // ~250 words, ~150 tokens
  overlap: 200, // 20% overlap for context
  preserveParagraphs: true,
  minChunkSize: 100,
}

/**
 * Split text into sentences (simple implementation)
 */
function splitIntoSentences(text: string): string[] {
  // Split on periods, exclamation marks, and question marks followed by space or newline
  return text
    .split(/([.!?]+[\s\n]+)/)
    .reduce((acc: string[], curr, i, arr) => {
      if (i % 2 === 0 && curr.trim()) {
        const sentence = curr + (arr[i + 1] || '')
        acc.push(sentence)
      }
      return acc
    }, [])
    .filter((s) => s.trim().length > 0)
}

/**
 * Split text into paragraphs
 */
function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

/**
 * Create chunks from text with overlap
 */
export function chunkText(text: string, options: ChunkingOptions = {}): TextChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const chunks: TextChunk[] = []

  // Clean up the text
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  if (cleanText.length === 0) {
    return chunks
  }

  // If preserveParagraphs is true, try to split by paragraphs first
  if (opts.preserveParagraphs) {
    const paragraphs = splitIntoParagraphs(cleanText)
    let currentChunk = ''
    let currentStartChar = 0

    for (const paragraph of paragraphs) {
      // If adding this paragraph would exceed chunk size
      if (currentChunk.length + paragraph.length > opts.chunkSize && currentChunk.length > 0) {
        // Save current chunk
        if (currentChunk.length >= opts.minChunkSize) {
          chunks.push({
            text: currentChunk.trim(),
            index: chunks.length,
            startChar: currentStartChar,
            endChar: currentStartChar + currentChunk.length,
          })
        }

        // Start new chunk with overlap
        const overlapText = currentChunk.slice(-opts.overlap)
        currentChunk = overlapText + '\n\n' + paragraph
        currentStartChar += currentChunk.length - overlapText.length - paragraph.length - 2
      } else {
        // Add paragraph to current chunk
        currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + paragraph
      }
    }

    // Add final chunk
    if (currentChunk.length >= opts.minChunkSize) {
      chunks.push({
        text: currentChunk.trim(),
        index: chunks.length,
        startChar: currentStartChar,
        endChar: currentStartChar + currentChunk.length,
      })
    }
  } else {
    // Simple sliding window approach
    let startChar = 0

    while (startChar < cleanText.length) {
      const endChar = Math.min(startChar + opts.chunkSize, cleanText.length)
      let chunkText = cleanText.slice(startChar, endChar)

      // Try to end at a sentence boundary if not at the end of the text
      if (endChar < cleanText.length) {
        const lastSentenceEnd = Math.max(
          chunkText.lastIndexOf('. '),
          chunkText.lastIndexOf('! '),
          chunkText.lastIndexOf('? ')
        )

        if (lastSentenceEnd > opts.chunkSize * 0.7) {
          // If we found a sentence boundary in the last 30% of the chunk
          chunkText = chunkText.slice(0, lastSentenceEnd + 1)
        }
      }

      // Only add chunk if it meets minimum size
      if (chunkText.trim().length >= opts.minChunkSize) {
        chunks.push({
          text: chunkText.trim(),
          index: chunks.length,
          startChar,
          endChar: startChar + chunkText.length,
        })
      }

      // Move start position with overlap
      startChar += chunkText.length - opts.overlap
    }
  }

  return chunks
}

/**
 * Chunk text by sentence count instead of character count
 */
export function chunkBySentences(
  text: string,
  sentencesPerChunk: number = 5,
  overlapSentences: number = 1
): TextChunk[] {
  const sentences = splitIntoSentences(text)
  const chunks: TextChunk[] = []

  let currentChar = 0

  for (let i = 0; i < sentences.length; i += sentencesPerChunk - overlapSentences) {
    const chunkSentences = sentences.slice(i, i + sentencesPerChunk)
    const chunkText = chunkSentences.join(' ')

    chunks.push({
      text: chunkText.trim(),
      index: chunks.length,
      startChar: currentChar,
      endChar: currentChar + chunkText.length,
    })

    currentChar += chunkText.length
  }

  return chunks
}

/**
 * Get statistics about chunks
 */
export function getChunkStats(chunks: TextChunk[]) {
  if (chunks.length === 0) {
    return {
      count: 0,
      avgLength: 0,
      minLength: 0,
      maxLength: 0,
      totalLength: 0,
    }
  }

  const lengths = chunks.map((c) => c.text.length)

  return {
    count: chunks.length,
    avgLength: Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length),
    minLength: Math.min(...lengths),
    maxLength: Math.max(...lengths),
    totalLength: lengths.reduce((a, b) => a + b, 0),
  }
}
