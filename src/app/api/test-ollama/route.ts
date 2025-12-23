import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const OLLAMA_URL = 'http://localhost:11434'
    
    // Test 1: Check if Ollama is running
    const healthResponse = await fetch(`${OLLAMA_URL}/api/tags`)
    const healthData = await healthResponse.json()
    
    console.log('Ollama health check:', healthData)
    
    // Test 2: Try to generate with mistral
    const generateResponse = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral:7b',
        prompt: 'Say hello',
        stream: false
      })
    })
    
    const generateData = await generateResponse.json()
    
    return NextResponse.json({
      success: true,
      health: healthData,
      generate: generateData
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
