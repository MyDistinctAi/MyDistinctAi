/**
 * Test file processing directly
 */

const testURL = 'https://ekfdbotohslpalnyvdpk.supabase.co/storage/v1/object/public/training-data/68df2d44-5377-471a-a121-2f4023131a5c/3ac57325-981b-4f2c-b97d-8ba488a0a5c4/1761611775364-Landing%20Page%20Content.txt'

console.log('Testing file URL fetch...')
console.log('URL:', testURL)
console.log('')

try {
  const response = await fetch(testURL)

  console.log('Response status:', response.status, response.statusText)
  console.log('Response ok:', response.ok)
  console.log('Response headers:', Object.fromEntries(response.headers.entries()))

  if (!response.ok) {
    console.error('❌ Fetch failed:', response.status, response.statusText)
    const text = await response.text()
    console.error('Response body:', text)
  } else {
    const text = await response.text()
    console.log('✅ Fetch successful!')
    console.log('Content length:', text.length, 'characters')
    console.log('First 200 chars:', text.substring(0, 200))
  }
} catch (error) {
  console.error('❌ Error:', error.message)
  console.error(error)
}
