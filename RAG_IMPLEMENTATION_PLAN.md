# RAG System Implementation Plan

**Created**: October 28, 2025, 4:46 AM  
**Status**: 🚧 In Progress  
**Priority**: HIGH - Required for file context in chat

---

## 🎯 Objective

Implement a complete RAG (Retrieval Augmented Generation) system that allows the AI to reference uploaded training documents when answering questions.

---

## 📋 Implementation Checklist

### Phase 1: Setup & Dependencies ⏳

- [ ] **1.1** Install LanceDB package
  ```bash
  npm install vectordb
  ```

- [ ] **1.2** Install text extraction libraries
  ```bash
  npm install pdf-parse mammoth
  ```

- [ ] **1.3** Create LanceDB initialization script
  - Location: `src/lib/lancedb/client.ts`
  - Initialize database connection
  - Create tables if not exist

---

### Phase 2: Text Extraction Service ⏳

- [ ] **2.1** Create text extraction utility
  - Location: `src/lib/text-extraction.ts`
  - Support formats: TXT, PDF, DOCX, MD, CSV
  
- [ ] **2.2** Implement TXT file reader
  - Simple file read with encoding detection
  
- [ ] **2.3** Implement PDF text extraction
  - Use `pdf-parse` library
  - Handle multi-page PDFs
  
- [ ] **2.4** Implement DOCX text extraction
  - Use `mammoth` library
  - Extract plain text from Word documents
  
- [ ] **2.5** Implement MD and CSV readers
  - Markdown: Read as plain text
  - CSV: Convert to readable format

---

### Phase 3: Embedding Generation ⏳

- [ ] **3.1** Create embedding service
  - Location: `src/lib/embeddings/ollama-embeddings.ts`
  - Use Ollama's `nomic-embed-text` model
  
- [ ] **3.2** Implement text chunking
  - Split large documents into chunks (500-1000 tokens)
  - Maintain context overlap between chunks
  
- [ ] **3.3** Create embedding generation function
  - Call Ollama API: `POST /api/embeddings`
  - Model: `nomic-embed-text`
  - Return vector embeddings
  
- [ ] **3.4** Add batch processing
  - Process multiple chunks efficiently
  - Handle rate limiting

---

### Phase 4: Vector Storage ⏳

- [ ] **4.1** Create vector storage service
  - Location: `src/lib/vector-store.ts`
  - Interface with LanceDB
  
- [ ] **4.2** Define vector schema
  ```typescript
  {
    id: string,
    model_id: string,
    file_id: string,
    chunk_index: number,
    text: string,
    embedding: number[],
    metadata: {
      filename: string,
      page: number,
      created_at: string
    }
  }
  ```
  
- [ ] **4.3** Implement vector insertion
  - Store embeddings in LanceDB
  - Link to model_id and file_id
  
- [ ] **4.4** Implement vector search
  - Cosine similarity search
  - Return top K most relevant chunks
  - Filter by model_id

---

### Phase 5: File Processing Job Handler ⏳

- [ ] **5.1** Update `/api/jobs/process-next` route
  - Location: `src/app/api/jobs/process-next/route.ts`
  - Add file processing logic
  
- [ ] **5.2** Implement processing workflow
  1. Get pending job from queue
  2. Download file from Supabase Storage
  3. Extract text based on file type
  4. Chunk text into segments
  5. Generate embeddings for each chunk
  6. Store vectors in LanceDB
  7. Update training_data status to 'processed'
  8. Mark job as completed
  
- [ ] **5.3** Add error handling
  - Retry failed jobs
  - Log errors to database
  - Update job status appropriately
  
- [ ] **5.4** Add progress tracking
  - Update job payload with progress percentage
  - Store processing metadata

---

### Phase 6: Context Retrieval Service ⏳

- [ ] **6.1** Update RAG service
  - Location: `src/lib/rag-service.ts` (already exists)
  - Implement actual retrieval logic
  
- [ ] **6.2** Implement semantic search
  1. Generate embedding for user query
  2. Search LanceDB for similar vectors
  3. Filter by model_id
  4. Return top 5 most relevant chunks
  
- [ ] **6.3** Create context formatting
  - Combine retrieved chunks
  - Add source citations
  - Format for AI consumption
  
- [ ] **6.4** Add relevance filtering
  - Set similarity threshold (0.7)
  - Only return highly relevant results
  - Handle no-results case

---

### Phase 7: Chat API Integration ✅ (Already Done)

- [x] **7.1** Chat API already calls `retrieveContext()`
  - Location: `src/app/api/chat/route.ts` line 163
  
- [x] **7.2** Context already added to prompt
  - Lines 182-191 build prompt with context
  
- [ ] **7.3** Test integration
  - Verify context is retrieved
  - Verify AI uses context in responses

---

### Phase 8: Testing & Validation ⏳

- [ ] **8.1** Unit tests
  - Test text extraction for each file type
  - Test embedding generation
  - Test vector storage and retrieval
  
- [ ] **8.2** Integration tests
  - Upload file → Process → Embed → Retrieve
  - End-to-end workflow
  
- [ ] **8.3** Manual testing
  - Upload test-ai-knowledge.txt
  - Process file
  - Ask: "What is the secret code?"
  - Verify AI responds with "ALPHA-BRAVO-2025"
  
- [ ] **8.4** Performance testing
  - Test with large files (5-10MB)
  - Test with multiple files
  - Measure embedding generation time
  - Measure retrieval speed

---

## 📁 Files to Create/Modify

### New Files
1. `src/lib/lancedb/client.ts` - LanceDB initialization
2. `src/lib/text-extraction.ts` - Text extraction utilities
3. `src/lib/embeddings/ollama-embeddings.ts` - Embedding generation
4. `src/lib/vector-store.ts` - Vector storage interface

### Files to Modify
1. `src/lib/rag-service.ts` - Implement actual retrieval
2. `src/app/api/jobs/process-next/route.ts` - Add file processing
3. `package.json` - Add new dependencies

---

## 🔧 Technical Specifications

### Ollama Embedding API
```typescript
POST http://localhost:11434/api/embeddings
{
  "model": "nomic-embed-text",
  "prompt": "text to embed"
}

Response:
{
  "embedding": [0.123, 0.456, ...] // 768-dimensional vector
}
```

### LanceDB Schema
```typescript
const schema = {
  id: 'string',
  model_id: 'string',
  file_id: 'string',
  chunk_index: 'int',
  text: 'string',
  embedding: 'vector(768)', // nomic-embed-text dimension
  filename: 'string',
  created_at: 'timestamp'
}
```

### Text Chunking Strategy
- Chunk size: 500-1000 characters
- Overlap: 100 characters
- Preserve sentence boundaries
- Maintain context

---

## 🎯 Success Criteria

✅ **RAG is working when**:
1. Files are processed and embedded after upload
2. Vector search returns relevant chunks
3. AI mentions "ALPHA-BRAVO-2025" when asked about secret code
4. AI references specific details from uploaded files
5. AI provides accurate answers based on training data

---

## 📊 Progress Tracking

**Current Status**: 0% Complete

- [ ] Phase 1: Setup & Dependencies (0/3)
- [ ] Phase 2: Text Extraction (0/5)
- [ ] Phase 3: Embedding Generation (0/4)
- [ ] Phase 4: Vector Storage (0/4)
- [ ] Phase 5: File Processing (0/4)
- [ ] Phase 6: Context Retrieval (0/4)
- [x] Phase 7: Chat Integration (3/3) ✅
- [ ] Phase 8: Testing (0/4)

**Total**: 3/31 tasks complete (10%)

---

## 🚀 Next Steps

1. Start with Phase 1: Install dependencies
2. Create LanceDB client
3. Implement text extraction
4. Build embedding service
5. Connect everything in job processor

**Estimated Time**: 2-3 hours for full implementation

---

## 📝 Notes

- Ollama's `nomic-embed-text` model is already installed
- LanceDB will store vectors locally (desktop) or in Supabase (cloud)
- RAG service skeleton already exists, just needs implementation
- Chat API already has RAG integration points

**Ready to start implementation!** 🎉
