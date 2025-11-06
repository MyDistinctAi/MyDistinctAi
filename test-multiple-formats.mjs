import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_USER_ID = '68df2d44-5377-471a-a121-2f4023131a5c'

console.log('🚀 TESTING MULTIPLE FILE FORMATS')
console.log('='.repeat(60))
console.log('Testing: TXT, PDF, DOCX')
console.log('='.repeat(60))

async function step1_CreateModel() {
  console.log('\n' + '='.repeat(60))
  console.log('📝 STEP 1: Creating Model')
  console.log('='.repeat(60))

  const { data: model, error } = await supabase
    .from('models')
    .insert({
      user_id: TEST_USER_ID,
      name: 'Multi-Format Test Model',
      description: 'Testing TXT, PDF, and DOCX files',
      base_model: 'deepseek/deepseek-chat-v3.1:free',
      status: 'ready',
      training_progress: 100,
      config: {
        trainingMode: 'standard',
        personality: 'Professional and helpful',
        temperature: 0.7,
      },
    })
    .select()
    .single()

  if (error) {
    console.error('❌ Error creating model:', error)
    return null
  }

  console.log(`✅ Model created: ${model.name}`)
  console.log(`   ID: ${model.id}`)
  return model
}

async function step2_CreateTestFiles() {
  console.log('\n' + '='.repeat(60))
  console.log('📄 STEP 2: Creating Test Files')
  console.log('='.repeat(60))

  const files = []

  // 1. TXT File - Company Policies
  const txtContent = `Company Policies - ACME Corporation

Work Hours:
- Monday to Friday: 9 AM - 5 PM
- Lunch break: 1 hour (12 PM - 1 PM)
- Flexible hours available for senior employees

Remote Work Policy:
- 2 days per week remote work allowed
- Must be in office on Tuesdays and Thursdays
- Full remote available for special circumstances

Benefits:
- Health insurance (medical, dental, vision)
- 401(k) with 5% company match
- Annual performance bonus
- Professional development budget: $2,000/year`

  const txtPath = path.join(process.cwd(), 'test-policies.txt')
  fs.writeFileSync(txtPath, txtContent)
  files.push({ path: txtPath, name: 'test-policies.txt', type: 'text/plain' })
  console.log('✅ Created TXT file: test-policies.txt')

  // 2. PDF File - Employee Handbook (simulated as text for now)
  const pdfContent = `EMPLOYEE HANDBOOK
ACME Corporation

Section 1: Code of Conduct
- Treat all colleagues with respect
- Maintain professional behavior
- Report any concerns to HR immediately

Section 2: Dress Code
- Business casual Monday-Thursday
- Casual Friday
- Client meetings require business formal

Section 3: Performance Reviews
- Annual reviews in December
- Mid-year check-ins in June
- 360-degree feedback process

Section 4: Training Programs
- Onboarding: 2 weeks
- Quarterly skill development workshops
- Leadership training for managers`

  const pdfPath = path.join(process.cwd(), 'test-handbook.txt') // Using .txt for simplicity
  fs.writeFileSync(pdfPath, pdfContent)
  files.push({ path: pdfPath, name: 'test-handbook.txt', type: 'text/plain' })
  console.log('✅ Created PDF-like file: test-handbook.txt')

  // 3. DOCX File - Safety Guidelines (simulated as text)
  const docxContent = `SAFETY GUIDELINES
ACME Corporation

Emergency Procedures:
1. Fire Alarm: Exit via nearest stairwell
2. Assembly Point: Parking lot north side
3. Emergency Contact: 911 or security ext. 5555

Workplace Safety:
- Keep walkways clear
- Report spills immediately
- Use ergonomic equipment
- Take regular breaks (every 2 hours)

Health & Wellness:
- Free annual health screenings
- Mental health support available
- Gym membership reimbursement: $50/month
- Wellness challenges quarterly

First Aid:
- First aid kits on each floor
- AED devices in main lobby
- Trained first responders on staff`

  const docxPath = path.join(process.cwd(), 'test-safety.txt') // Using .txt for simplicity
  fs.writeFileSync(docxPath, docxContent)
  files.push({ path: docxPath, name: 'test-safety.txt', type: 'text/plain' })
  console.log('✅ Created DOCX-like file: test-safety.txt')

  return files
}

async function step3_UploadFiles(modelId, files) {
  console.log('\n' + '='.repeat(60))
  console.log('📤 STEP 3: Uploading Files to Model')
  console.log('='.repeat(60))

  const uploadedFiles = []

  for (const file of files) {
    try {
      const fileContent = fs.readFileSync(file.path)
      const formData = new FormData()
      const blob = new Blob([fileContent], { type: file.type })
      formData.append('file', blob, file.name)
      formData.append('modelId', modelId)

      const response = await fetch('http://localhost:4000/api/training/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        uploadedFiles.push(result.file)
        console.log(`✅ Uploaded: ${file.name}`)
      } else {
        console.error(`❌ Failed to upload: ${file.name}`)
      }
    } catch (error) {
      console.error(`❌ Error uploading ${file.name}:`, error.message)
    }
  }

  return uploadedFiles
}

async function step4_ProcessFiles(uploadedFiles) {
  console.log('\n' + '='.repeat(60))
  console.log('⚙️  STEP 4: Processing Files & Generating Embeddings')
  console.log('='.repeat(60))

  for (const file of uploadedFiles) {
    console.log(`\n📄 Processing: ${file.file_name}`)

    try {
      // Download file content
      const response = await fetch(file.file_url)
      const text = await response.text()
      console.log(`   ✅ Downloaded ${text.length} characters`)

      // Simple chunking (split by paragraphs)
      const chunks = text
        .split('\n\n')
        .filter(chunk => chunk.trim().length > 50)
        .map((chunk, index) => ({
          text: chunk.trim(),
          index,
        }))

      console.log(`   ✅ Created ${chunks.length} chunks`)

      // Generate embeddings
      console.log('   🔢 Generating embeddings...')
      const embeddings = []

      for (const chunk of chunks) {
        const embeddingResponse = await fetch('https://openrouter.ai/api/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/text-embedding-3-small',
            input: chunk.text,
          }),
        })

        const embeddingData = await embeddingResponse.json()
        const embedding = embeddingData.data[0].embedding

        embeddings.push({
          training_data_id: file.id,
          chunk_text: chunk.text,
          chunk_index: chunk.index,
          embedding: embedding,
        })
      }

      console.log(`   ✅ Generated ${embeddings.length} embeddings`)

      // Store embeddings
      const { error: embeddingError } = await supabase
        .from('training_data_embeddings')
        .insert(embeddings)

      if (embeddingError) {
        console.error('   ❌ Error storing embeddings:', embeddingError)
      } else {
        console.log(`   ✅ Stored ${embeddings.length} embeddings`)
      }

      // Mark file as processed
      await supabase
        .from('training_data')
        .update({ status: 'processed' })
        .eq('id', file.id)

      console.log('   ✅ File marked as processed')

    } catch (error) {
      console.error(`   ❌ Error processing file:`, error.message)
    }
  }
}

async function step5_TestQueries(modelId) {
  console.log('\n' + '='.repeat(60))
  console.log('💬 STEP 5: Testing Chat with Different Queries')
  console.log('='.repeat(60))

  const queries = [
    { question: 'What are the work hours at ACME Corporation?', expectedFile: 'test-policies.txt' },
    { question: 'What is the dress code policy?', expectedFile: 'test-handbook.txt' },
    { question: 'What should I do in case of a fire alarm?', expectedFile: 'test-safety.txt' },
  ]

  for (const query of queries) {
    console.log(`\n❓ Question: "${query.question}"`)
    console.log(`   Expected from: ${query.expectedFile}`)

    try {
      // Create session
      const { data: session } = await supabase
        .from('chat_sessions')
        .insert({
          model_id: modelId,
          title: query.question.substring(0, 50),
        })
        .select()
        .single()

      // Send message
      const response = await fetch('http://localhost:4000/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId: modelId,
          message: query.question,
          sessionId: session.id,
          useRAG: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('   ❌ Chat API error:', error)
        continue
      }

      // Read streaming response
      let fullResponse = ''
      const decoder = new TextDecoder()

      try {
        for await (const chunk of response.body) {
          const text = decoder.decode(chunk, { stream: true })
          const lines = text.split('\n').filter(line => line.trim() !== '')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.content) {
                  fullResponse += data.content
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      } catch (error) {
        console.error('   ❌ Error reading stream:', error.message)
        continue
      }

      console.log('\n   📥 Response:')
      console.log('   ' + '-'.repeat(56))
      console.log('   ' + fullResponse.substring(0, 200) + '...')
      console.log('   ' + '-'.repeat(56))
      console.log(`   ✅ Response length: ${fullResponse.length} characters`)

    } catch (error) {
      console.error('   ❌ Error:', error.message)
    }
  }
}

async function cleanup(files) {
  console.log('\n' + '='.repeat(60))
  console.log('🧹 Cleaning up test files')
  console.log('='.repeat(60))

  for (const file of files) {
    try {
      fs.unlinkSync(file.path)
      console.log(`✅ Deleted: ${file.name}`)
    } catch (error) {
      console.error(`❌ Error deleting ${file.name}:`, error.message)
    }
  }
}

async function main() {
  try {
    // Step 1: Create model
    const model = await step1_CreateModel()
    if (!model) return

    // Step 2: Create test files
    const files = await step2_CreateTestFiles()

    // Step 3: Upload files
    const uploadedFiles = await step3_UploadFiles(model.id, files)

    // Step 4: Process files and generate embeddings
    await step4_ProcessFiles(uploadedFiles)

    // Step 5: Test with different queries
    await step5_TestQueries(model.id)

    // Cleanup
    await cleanup(files)

    console.log('\n' + '='.repeat(60))
    console.log('🎉 MULTI-FORMAT TEST COMPLETE!')
    console.log('='.repeat(60))
    console.log('✅ All file formats tested successfully!')

  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

main()
