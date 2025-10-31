import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Use a test embedding - this is a very short embedding just for testing
const testEmbedding = '[0.1,0.2,0.3,0.4,0.5]'

console.log('\nCalling match_documents with:')
console.log('- Embedding string type:', typeof testEmbedding)
console.log('- Embedding string length:', testEmbedding.length)

const { data, error } = await supabase.rpc('match_documents', {
  query_embedding: testEmbedding,
  match_model_id: '353608a6-c981-4dfb-9e75-c70fcdeeba2b',
  match_count: 5,
  similarity_threshold: 0.0
})

console.log('\nResult:')
console.log('- Error:', error)
console.log('- Matches:', data?.length || 0)
if (data && data.length > 0) {
  console.log('- First match similarity:', data[0].similarity)
  console.log('- First match text:', data[0].chunk_text.substring(0, 100))
}

process.exit(0)
