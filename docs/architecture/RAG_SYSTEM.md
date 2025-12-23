# RAG (Retrieval-Augmented Generation) System

MyDistinctAI uses RAG to enhance AI responses with context from user-uploaded documents.

## How It Works

```
1. User uploads document
   ↓
2. Extract text (PDF, DOCX, TXT)
   ↓
3. Chunk into segments (512 tokens, 50 overlap)
   ↓
4. Generate embeddings (OpenRouter or Ollama)
   ↓
5. Store in vector database (Supabase pgvector)
   ↓
6. On chat query:
   - Generate query embedding
   - Find similar chunks (cosine similarity)
   - Inject context into prompt
   - Generate AI response
```

## Components

### Web App (Supabase)
- **Vector DB**: pgvector extension
- **Embeddings**: OpenRouter API
- **Table**: `embeddings` with 1536-dim vectors

### Desktop App (Local)
- **Vector DB**: LanceDB
- **Embeddings**: Ollama (nomic-embed-text)
- **Vectors**: 768-dimensional

## API Endpoints

### Upload & Process
```
POST /api/training/upload
Content-Type: multipart/form-data

file: [binary]
modelId: string
```

### Chat with RAG
```
POST /api/chat
Content-Type: application/json

{
  "modelId": "...",
  "message": "What does the document say about X?",
  "sessionId": "..."
}
```

## Configuration

### Chunk Size
- **Default**: 512 tokens
- **Overlap**: 50 tokens
- **Configurable**: Desktop settings page

### Similarity Threshold
- **Default**: 0.7 (70% similarity)
- **Max Results**: 5 chunks per query

## Database Schema

```sql
CREATE TABLE embeddings (
  id UUID PRIMARY KEY,
  model_id UUID REFERENCES models(id),
  content TEXT,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ
);

-- Similarity search function
CREATE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_model_id uuid
) RETURNS TABLE (...);
```

## Hybrid Search

Combines vector similarity with keyword matching:
1. Vector search (semantic meaning)
2. Full-text search (exact keywords)
3. Merge and re-rank results
