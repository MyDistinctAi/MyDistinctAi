/**
 * File Content Extraction Service
 * Extracts text content from various file types (PDF, DOCX, TXT, MD, CSV)
 */

import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import Papa from 'papaparse'

export type SupportedFileType = 'pdf' | 'docx' | 'txt' | 'md' | 'csv' | 'unknown'

export interface ExtractionResult {
  success: boolean
  text?: string
  error?: string
  metadata?: {
    fileType: SupportedFileType
    pageCount?: number
    wordCount?: number
  }
}

/**
 * Detect file type from filename or MIME type
 */
export function detectFileType(fileName: string, mimeType?: string): SupportedFileType {
  const ext = fileName.split('.').pop()?.toLowerCase()

  if (ext === 'pdf' || mimeType === 'application/pdf') return 'pdf'
  if (ext === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return 'docx'
  }
  if (ext === 'txt' || mimeType === 'text/plain') return 'txt'
  if (ext === 'md' || ext === 'markdown') return 'md'
  if (ext === 'csv' || mimeType === 'text/csv') return 'csv'

  return 'unknown'
}

/**
 * Extract text from PDF file
 */
async function extractFromPDF(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const data = await pdf(buffer)

    return {
      success: true,
      text: data.text,
      metadata: {
        fileType: 'pdf',
        pageCount: data.numpages,
        wordCount: data.text.split(/\s+/).length,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to extract PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Extract text from DOCX file
 */
async function extractFromDOCX(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const result = await mammoth.extractRawText({ buffer })

    return {
      success: true,
      text: result.value,
      metadata: {
        fileType: 'docx',
        wordCount: result.value.split(/\s+/).length,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to extract DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Extract text from plain text or markdown file
 */
async function extractFromText(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const text = buffer.toString('utf-8')

    return {
      success: true,
      text,
      metadata: {
        fileType: 'txt',
        wordCount: text.split(/\s+/).length,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Extract text from CSV file
 * Converts CSV to readable text format
 */
async function extractFromCSV(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const csvText = buffer.toString('utf-8')

    // Parse CSV
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    })

    if (parsed.errors.length > 0) {
      return {
        success: false,
        error: `CSV parsing errors: ${parsed.errors.map((e) => e.message).join(', ')}`,
      }
    }

    // Convert CSV data to readable text format
    const lines: string[] = []

    // Add headers
    if (parsed.meta.fields) {
      lines.push(`Headers: ${parsed.meta.fields.join(', ')}`)
      lines.push('') // Empty line
    }

    // Add rows in a readable format
    parsed.data.forEach((row: any, index: number) => {
      lines.push(`Row ${index + 1}:`)
      Object.entries(row).forEach(([key, value]) => {
        lines.push(`  ${key}: ${value}`)
      })
      lines.push('') // Empty line between rows
    })

    const text = lines.join('\n')

    return {
      success: true,
      text,
      metadata: {
        fileType: 'csv',
        wordCount: text.split(/\s+/).length,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to extract CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Main extraction function that handles all file types
 */
export async function extractTextFromFile(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<ExtractionResult> {
  const fileType = detectFileType(fileName, mimeType)

  switch (fileType) {
    case 'pdf':
      return extractFromPDF(buffer)
    case 'docx':
      return extractFromDOCX(buffer)
    case 'txt':
    case 'md':
      return extractFromText(buffer)
    case 'csv':
      return extractFromCSV(buffer)
    default:
      return {
        success: false,
        error: `Unsupported file type: ${fileType}`,
      }
  }
}

/**
 * Fetch file from URL and extract text
 */
export async function extractTextFromURL(
  url: string,
  fileName: string,
  mimeType?: string
): Promise<ExtractionResult> {
  try {
    console.log('[File Extraction] Fetching file from URL:', url)
    const response = await fetch(url)

    console.log('[File Extraction] Fetch response:', {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch file: ${response.status} ${response.statusText}`,
      }
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('[File Extraction] Downloaded file, size:', buffer.length, 'bytes')

    return extractTextFromFile(buffer, fileName, mimeType)
  } catch (error) {
    console.error('[File Extraction] Error:', error)
    return {
      success: false,
      error: `Failed to fetch and extract file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
