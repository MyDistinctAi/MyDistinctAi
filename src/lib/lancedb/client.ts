/**
 * LanceDB Client
 * 
 * Vector database for storing and retrieving document embeddings
 */

import * as lancedb from 'vectordb'

const DB_PATH = process.env.LANCEDB_PATH || './lancedb'

let db: lancedb.Connection | null = null

/**
 * Initialize LanceDB connection
 */
export async function initLanceDB(): Promise<lancedb.Connection> {
  if (db) {
    return db
  }

  try {
    db = await lancedb.connect(DB_PATH)
    console.log(`[LanceDB] Connected to database at ${DB_PATH}`)
    return db
  } catch (error) {
    console.error('[LanceDB] Failed to connect:', error)
    throw new Error('Failed to initialize LanceDB')
  }
}

/**
 * Get LanceDB connection (creates if doesn't exist)
 */
export async function getLanceDB(): Promise<lancedb.Connection> {
  if (!db) {
    return await initLanceDB()
  }
  return db
}

/**
 * Vector schema for document embeddings
 */
export interface VectorDocument {
  id: string
  model_id: string
  file_id: string
  chunk_index: number
  text: string
  vector: number[] // 768-dimensional for nomic-embed-text
  filename: string
  created_at: string
}

/**
 * Create or get the vectors table
 */
export async function getVectorsTable() {
  const connection = await getLanceDB()
  
  try {
    // Try to open existing table
    const table = await connection.openTable('document_vectors')
    return table
  } catch (error) {
    // Table doesn't exist, create it
    console.log('[LanceDB] Creating document_vectors table...')
    
    // Create with empty data (will add schema on first insert)
    const table = await connection.createTable('document_vectors', [])
    return table
  }
}

/**
 * Close LanceDB connection
 */
export async function closeLanceDB() {
  if (db) {
    // LanceDB auto-closes, just reset reference
    db = null
    console.log('[LanceDB] Connection closed')
  }
}
