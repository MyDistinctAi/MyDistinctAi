/**
 * Document Processor
 * Extracts text from PDFs and text files
 */

import pdfParse from 'pdf-parse'

export interface DocumentExtractionResult {
    success: boolean
    text?: string
    error?: string
    metadata?: {
        pageCount?: number
        wordCount?: number
        characterCount?: number
    }
}

/**
 * Extract text from a file buffer
 */
export async function extractTextFromBuffer(
    buffer: Buffer,
    fileName: string,
    mimeType?: string
): Promise<DocumentExtractionResult> {
    const startTime = Date.now()
    console.log('[EXTRACT] Starting text extraction:', {
        fileName,
        mimeType,
        bufferSize: buffer.length,
        timestamp: new Date().toISOString()
    })

    try {
        const extension = fileName.split('.').pop()?.toLowerCase()
        const isPdf = mimeType === 'application/pdf' || extension === 'pdf'

        let text: string

        if (isPdf) {
            // Extract text from PDF
            console.log('[EXTRACT] Processing as PDF...')
            const pdfData = await pdfParse(buffer)
            text = pdfData.text

            const elapsed = Date.now() - startTime
            console.log('[EXTRACT] PDF extraction complete:', {
                pages: pdfData.numpages,
                textLength: text.length,
                elapsed: `${elapsed}ms`
            })

            return {
                success: true,
                text,
                metadata: {
                    pageCount: pdfData.numpages,
                    wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
                    characterCount: text.length
                }
            }
        } else {
            // Treat as plain text
            console.log('[EXTRACT] Processing as text file...')
            text = buffer.toString('utf-8')

            const elapsed = Date.now() - startTime
            console.log('[EXTRACT] Text extraction complete:', {
                textLength: text.length,
                elapsed: `${elapsed}ms`
            })

            return {
                success: true,
                text,
                metadata: {
                    wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
                    characterCount: text.length
                }
            }
        }
    } catch (error) {
        console.error('[EXTRACT] ❌ Error extracting text:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown extraction error'
        }
    }
}

/**
 * Extract text from a URL (fetches the file first)
 */
export async function extractTextFromUrl(
    url: string,
    fileName: string
): Promise<DocumentExtractionResult> {
    console.log('[EXTRACT] Fetching file from URL:', url)

    try {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const mimeType = response.headers.get('content-type') || undefined

        return extractTextFromBuffer(buffer, fileName, mimeType)
    } catch (error) {
        console.error('[EXTRACT] ❌ Error fetching file:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown fetch error'
        }
    }
}
