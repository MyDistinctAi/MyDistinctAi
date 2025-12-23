/**
 * File Processing Utility
 *
 * Extract text content from various file formats and chunk for AI processing
 */

import pdf from 'pdf-parse'
import mammoth from 'mammoth'

export interface ProcessedFile {
  text: string
  chunks: string[]
  metadata: {
    totalChunks: number
    totalCharacters: number
    processingTime: number
  }
}

const CHUNK_SIZE = 512 // tokens (roughly 2000 characters)
const CHUNK_OVERLAP = 50 // tokens overlap between chunks

/**
 * Process a file based on its type and extract text content
 */
export async function processFile(
  fileBuffer: Buffer,
  fileName: string,
  fileType: string
): Promise<ProcessedFile> {
  const startTime = Date.now()

  try {
    // Extract text based on file type
    let text: string

    if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
      text = await extractFromPDF(fileBuffer)
    } else if (
      fileType.includes('wordprocessingml') ||
      fileType.includes('docx') ||
      fileName.endsWith('.docx')
    ) {
      text = await extractFromDOCX(fileBuffer)
    } else if (
      fileType.includes('text/') ||
      fileName.endsWith('.txt') ||
      fileName.endsWith('.md') ||
      fileName.endsWith('.csv')
    ) {
      text = extractFromText(fileBuffer)
    } else {
      throw new Error(`Unsupported file type: ${fileType}`)
    }

    // Clean and normalize text
    text = cleanText(text)

    // Chunk the text
    const chunks = chunkText(text)

    const processingTime = Date.now() - startTime

    return {
      text,
      chunks,
      metadata: {
        totalChunks: chunks.length,
        totalCharacters: text.length,
        processingTime,
      },
    }
  } catch (error) {
    console.error('Error processing file:', error)
    throw new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text from PDF files
 */
async function extractFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer)
    return data.text
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text from DOCX files
 */
async function extractFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  } catch (error) {
    throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract text from plain text files
 */
function extractFromText(buffer: Buffer): string {
  try {
    return buffer.toString('utf-8')
  } catch (error) {
    throw new Error(`Failed to extract text from file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Clean and normalize extracted text
 */
function cleanText(text: string): string {
  return (
    text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove excessive newlines
      .replace(/\n{3,}/g, '\n\n')
      // Trim leading/trailing whitespace
      .trim()
  )
}

/**
 * Chunk text into manageable pieces for AI processing
 * Using a simple character-based chunking with overlap
 */
function chunkText(text: string): string[] {
  const chunks: string[] = []

  // Approximate tokens to characters (1 token ≈ 4 characters)
  const chunkCharSize = CHUNK_SIZE * 4
  const overlapCharSize = CHUNK_OVERLAP * 4

  if (text.length <= chunkCharSize) {
    return [text]
  }

  let startIndex = 0

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkCharSize, text.length)

    // Try to break at sentence boundary
    let chunk = text.substring(startIndex, endIndex)

    // If not at the end, try to find a good break point
    if (endIndex < text.length) {
      const sentenceBreak = chunk.lastIndexOf('. ')
      const paragraphBreak = chunk.lastIndexOf('\n\n')
      const lineBreak = chunk.lastIndexOf('\n')

      // Prefer sentence breaks, then paragraph, then line
      const breakPoint =
        sentenceBreak > chunkCharSize * 0.7
          ? sentenceBreak + 2
          : paragraphBreak > chunkCharSize * 0.7
            ? paragraphBreak + 2
            : lineBreak > chunkCharSize * 0.7
              ? lineBreak + 1
              : chunk.length

      chunk = chunk.substring(0, breakPoint)
    }

    chunks.push(chunk.trim())

    // Move to next chunk with overlap
    startIndex += chunk.length - overlapCharSize
  }

  return chunks
}

/**
 * Download file from URL (Supabase Storage)
 */
export async function downloadFile(url: string): Promise<Buffer> {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validate file before processing
 */
export function validateFile(fileSize: number, fileType: string): { valid: boolean; error?: string } {
  // Check file size (max 10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024
  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of 10MB`,
    }
  }

  // Check file type
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'text/csv',
  ]

  const isAllowedType = allowedTypes.some((type) => fileType.includes(type))

  if (!isAllowedType) {
    return {
      valid: false,
      error: `File type not supported: ${fileType}`,
    }
  }

  return { valid: true }
}
