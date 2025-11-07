import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { embedding, modelId, limit = 5, threshold = 0.35 } = await req.json()

    // Validate input
    if (!embedding || !modelId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: embedding, modelId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!Array.isArray(embedding) || (embedding.length !== 768 && embedding.length !== 1536)) {
      return new Response(
        JSON.stringify({ error: 'Embedding must be an array of 768 or 1536 numbers' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Format embedding as PostgreSQL array literal
    const vectorString = `[${embedding.join(',')}]`

    console.log(`[Edge Function] Searching for similar documents`)
    console.log(`[Edge Function] Model ID: ${modelId}`)
    console.log(`[Edge Function] Embedding dimensions: ${embedding.length}`)
    console.log(`[Edge Function] Limit: ${limit}, Threshold: ${threshold}`)

    // Execute raw SQL query directly
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: vectorString,
      match_model_id: modelId,
      match_count: limit,
      similarity_threshold: threshold
    })

    if (error) {
      console.error('[Edge Function] Error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[Edge Function] Found ${data?.length || 0} matches`)

    return new Response(
      JSON.stringify({ matches: data || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Edge Function] Exception:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
