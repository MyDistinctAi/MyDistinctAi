/**
 * Check if PDF file was processed and has embeddings
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPDFEmbeddings() {
  console.log('🔍 Checking for REGISTER.pdf...\n')

  // 1. Find the PDF file in training_data
  const { data: pdfFiles, error: filesError } = await supabase
    .from('training_data')
    .select('*')
    .ilike('file_name', '%REGISTER%')
    .order('created_at', { ascending: false })

  if (filesError) {
    console.error('❌ Error:', filesError)
    return
  }

  if (!pdfFiles || pdfFiles.length === 0) {
    console.log('❌ No REGISTER.pdf file found in training_data table')
    console.log('💡 The PDF might not have been uploaded yet')
    return
  }

  console.log(`📄 Found ${pdfFiles.length} file(s) matching "REGISTER":\n`)

  for (const file of pdfFiles) {
    console.log(`File: ${file.file_name}`)
    console.log(`  ID: ${file.id}`)
    console.log(`  Model ID: ${file.model_id}`)
    console.log(`  Status: ${file.status}`)
    console.log(`  Uploaded: ${new Date(file.created_at).toLocaleString()}`)
    if (file.processed_at) {
      console.log(`  Processed: ${new Date(file.processed_at).toLocaleString()}`)
    }
    console.log(`  File URL: ${file.file_url}`)

    // Check for embeddings
    const { count, error: countError } = await supabase
      .from('document_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('training_data_id', file.id)

    if (countError) {
      console.error('  ❌ Error checking embeddings:', countError)
    } else if (count === 0) {
      console.log('  ❌ NO EMBEDDINGS FOUND')
      console.log('  💡 File needs to be processed!')
    } else {
      console.log(`  ✅ Has ${count} embeddings`)
      
      // Show sample embeddings
      const { data: samples } = await supabase
        .from('document_embeddings')
        .select('chunk_text')
        .eq('training_data_id', file.id)
        .limit(3)

      if (samples && samples.length > 0) {
        console.log('  📝 Sample chunks:')
        samples.forEach((s, i) => {
          const preview = s.chunk_text.substring(0, 100).replace(/\n/g, ' ')
          console.log(`     ${i + 1}. "${preview}..."`)
        })
      }
    }
    console.log('')
  }

  // Check which model this belongs to
  if (pdfFiles.length > 0) {
    const modelId = pdfFiles[0].model_id
    const { data: model } = await supabase
      .from('models')
      .select('name')
      .eq('id', modelId)
      .single()

    if (model) {
      console.log(`📊 Model: ${model.name} (${modelId})`)
    }
  }
}

checkPDFEmbeddings().catch(console.error)
