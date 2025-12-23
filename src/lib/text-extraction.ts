/**
 * Text Extraction Service
 * 
 * Extract text from various file formats (TXT, PDF, DOCX, MD, CSV)
 */

import fs from 'fs/promises'
import path from 'path'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'

/**
 * Extract text from a file based on its extension
 */
export async function extractTextFromFile(
  filePath: string,
  fileType: string
): Promise<string> {
  const extension = fileType.toLowerCase()

  try {
    // Handle MIME types
    if (extension.includes('text/plain') || extension.includes('text/markdown')) {
      return await extractFromText(filePath)
    }
    if (extension.includes('application/pdf')) {
      return await extractFromPDF(filePath)
    }
    if (extension.includes('application/vnd.openxmlformats')) {
      return await extractFromDOCX(filePath)
    }
    if (extension.includes('text/csv')) {
      return await extractFromCSV(filePath)
    }

    // Handle file extensions
    switch (extension) {
      case 'txt':
      case 'md':
        return await extractFromText(filePath)
      
      case 'pdf':
        return await extractFromPDF(filePath)
      
      case 'docx':
        return await extractFromDOCX(filePath)
      
      case 'csv':
        return await extractFromCSV(filePath)
      
      default:
        throw new Error(`Unsupported file type: ${extension}`)
    }
  } catch (error) {
    console.error(`[Text Extraction] Error extracting from ${extension}:`, error)
    throw error
  }
}

/**
 * Extract text from TXT/MD files
 */
async function extractFromText(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath)
  return buffer.toString('utf-8')
}

/**
 * Extract text from PDF files
 */
async function extractFromPDF(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath)
  const data = await pdf(buffer)
  return data.text
}

/**
 * Extract text from DOCX files
 */
async function extractFromDOCX(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath)
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

/**
 * Extract text from CSV files
 */
async function extractFromCSV(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, 'utf-8')
  
  // Convert CSV to readable text format
  const lines = content.split('\n')
  const formattedLines = lines.map((line, index) => {
    if (index === 0) {
      return `Headers: ${line}`
    }
    return `Row ${index}: ${line}`
  })
  
  return formattedLines.join('\n')
}

/**
 * Chunk text into smaller segments with overlap
 */
export function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 100
): string[] {
  const chunks: string[] = []
  let startIndex = 0

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length)
    let chunk = text.substring(startIndex, endIndex)

    // Try to end at sentence boundary
    if (endIndex < text.length) {
      const lastPeriod = chunk.lastIndexOf('.')
      const lastNewline = chunk.lastIndexOf('\n')
      const boundary = Math.max(lastPeriod, lastNewline)

      if (boundary > chunkSize * 0.5) {
        chunk = chunk.substring(0, boundary + 1)
      }
    }

    chunks.push(chunk.trim())
    
    // Move start index with overlap
    startIndex = endIndex - overlap
    
    // Prevent infinite loop
    if (startIndex <= chunks.length * chunkSize - overlap) {
      startIndex = endIndex
    }
  }

  return chunks.filter(chunk => chunk.length > 0)
}

/**
 * Download file from Supabase Storage
 */
export async function downloadFileFromStorage(
  storageUrl: string,
  tempPath: string
): Promise<void> {
  const response = await fetch(storageUrl)
  
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`)
  }

  const buffer = await response.arrayBuffer()
  await fs.writeFile(tempPath, Buffer.from(buffer))
}

/**
 * Clean up temporary file
 */
export async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath)
  } catch (error) {
    console.error('[Text Extraction] Failed to cleanup temp file:', error)
  }
}
