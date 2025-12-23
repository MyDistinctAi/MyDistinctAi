/**
 * Text Chunker
 * Smart text chunking with configurable size and overlap
 */

export interface TextChunk {
    text: string
    index: number
    startChar: number
    endChar: number
}

export interface ChunkOptions {
    chunkSize?: number      // Target chunk size in characters (default: 1000)
    chunkOverlap?: number   // Overlap between chunks (default: 200)
    minChunkSize?: number   // Minimum chunk size (default: 100)
}

/**
 * Split text into overlapping chunks
 */
export function chunkText(
    text: string,
    options: ChunkOptions = {}
): TextChunk[] {
    const {
        chunkSize = 1000,
        chunkOverlap = 200,
        minChunkSize = 100
    } = options

    console.log('[CHUNK] Starting chunking:', {
        textLength: text.length,
        chunkSize,
        chunkOverlap,
        timestamp: new Date().toISOString()
    })

    // Clean the text
    const cleanedText = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()

    if (cleanedText.length === 0) {
        console.log('[CHUNK] No text to chunk')
        return []
    }

    // If text is smaller than chunk size, return as single chunk
    if (cleanedText.length <= chunkSize) {
        console.log('[CHUNK] Text fits in single chunk')
        return [{
            text: cleanedText,
            index: 0,
            startChar: 0,
            endChar: cleanedText.length
        }]
    }

    const chunks: TextChunk[] = []
    let startIndex = 0
    let chunkIndex = 0

    while (startIndex < cleanedText.length) {
        // Calculate end index
        let endIndex = Math.min(startIndex + chunkSize, cleanedText.length)

        // Try to break at a sentence boundary
        if (endIndex < cleanedText.length) {
            const searchStart = Math.max(startIndex + minChunkSize, endIndex - 200)
            const searchText = cleanedText.slice(searchStart, endIndex)

            // Look for sentence boundaries (. ! ?)
            const sentenceEnd = searchText.search(/[.!?]\s+(?=[A-Z])/g)
            if (sentenceEnd !== -1) {
                endIndex = searchStart + sentenceEnd + 2
            } else {
                // Try paragraph boundary
                const paraEnd = searchText.lastIndexOf('\n\n')
                if (paraEnd !== -1 && paraEnd > 50) {
                    endIndex = searchStart + paraEnd + 2
                } else {
                    // Try word boundary
                    const wordEnd = searchText.lastIndexOf(' ')
                    if (wordEnd !== -1 && wordEnd > 50) {
                        endIndex = searchStart + wordEnd + 1
                    }
                }
            }
        }

        // Extract chunk
        const chunkText = cleanedText.slice(startIndex, endIndex).trim()

        if (chunkText.length >= minChunkSize) {
            chunks.push({
                text: chunkText,
                index: chunkIndex,
                startChar: startIndex,
                endChar: endIndex
            })
            chunkIndex++
        }

        // Move start index with overlap
        // CRITICAL: Ensure we always advance to prevent infinite loops
        const nextStart = endIndex - chunkOverlap

        // Ensure we advance by at least minChunkSize to prevent infinite loop
        if (nextStart <= startIndex) {
            startIndex = startIndex + minChunkSize
        } else {
            startIndex = nextStart
        }

        // Safety: If we're near the end and would loop forever, break
        if (startIndex >= cleanedText.length - 10) {
            break
        }

        // Extra safety: Limit total chunks to prevent memory issues
        if (chunks.length >= 1000) {
            console.warn('[CHUNK] Maximum chunk limit reached (1000)')
            break
        }
    }

    console.log('[CHUNK] Chunking complete:', {
        totalChunks: chunks.length,
        avgChunkSize: Math.round(chunks.reduce((sum, c) => sum + c.text.length, 0) / chunks.length)
    })

    return chunks
}

/**
 * Get statistics about chunks
 */
export function getChunkStats(chunks: TextChunk[]) {
    if (chunks.length === 0) {
        return { count: 0, avgSize: 0, minSize: 0, maxSize: 0, totalChars: 0 }
    }

    const sizes = chunks.map(c => c.text.length)
    return {
        count: chunks.length,
        avgSize: Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length),
        minSize: Math.min(...sizes),
        maxSize: Math.max(...sizes),
        totalChars: sizes.reduce((a, b) => a + b, 0)
    }
}
