'use client'

import React, { useState } from 'react'
import { TextCleaner, CleanTextDisplay } from '@/components/TextCleaner'
import { useTextCleaner, useAutoCleanText } from '@/hooks/useTextCleaner'

/**
 * Text Cleaner Demo Page
 *
 * Demonstrates the text cleaning functionality with examples
 */
export default function TextCleanerDemoPage() {
  const [customText, setCustomText] = useState('')

  // Sample dirty text
  const sampleDirtyText = `### **Key Components of Short-Form Video Creation:**

1. **Editing Long-Form Content:**
   - Transforming full podcast episodes into concise, engaging clips (e.g., highlights, key takeaways, or viral moments).
   - Cutting out filler content to keep videos punchy and platform-optimized.

2. **Platform-Specific Optimization:**
   - Formatting videos for **YouTube Shorts, TikTok, Instagram Reels, LinkedIn**, etc.
   - Adjusting aspect ratios, captions, and hooks to suit each platform's algorithm.

3. **Engagement Enhancements:**
   - Adding captions, dynamic text, or subtitles for accessibility.
   - Incorporating trending music, sound bites, or visual effects to boost shareability.`

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧹 Text Cleaner Demo
          </h1>
          <p className="text-gray-600">
            Clean unwanted markdown characters from chat responses
          </p>
        </div>

        {/* Example 1: Preview Mode */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📊 Example 1: Preview Mode (Before/After Comparison)
          </h2>
          <TextCleaner text={sampleDirtyText} showPreview />
        </div>

        {/* Example 2: Auto-Clean Display */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ✨ Example 2: Auto-Clean Display (Inline)
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Original Text:
              </h3>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {sampleDirtyText}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-green-700 mb-2">
                Auto-Cleaned Display:
              </h3>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <CleanTextDisplay text={sampleDirtyText} />
              </div>
            </div>
          </div>
        </div>

        {/* Example 3: Hook Usage */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🎣 Example 3: Using the useAutoCleanText Hook
          </h2>
          <HookExample />
        </div>

        {/* Example 4: Custom Input */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ✏️ Example 4: Try Your Own Text
          </h2>
          <div className="space-y-4">
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Paste text with unwanted markdown characters here (###, **, etc.)..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {customText && (
              <TextCleaner text={customText} showPreview />
            )}
          </div>
        </div>

        {/* Code Examples */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            💻 Code Examples
          </h2>
          <div className="space-y-6">
            {/* Example 1 */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                1. Basic Import and Use
              </h3>
              <pre className="p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto">
                {`import { cleanChatMessage } from '@/lib/text-cleaner'

const dirtyText = "### **Hello World**"
const cleaned = cleanChatMessage(dirtyText)
// Result: "Hello World"`}
              </pre>
            </div>

            {/* Example 2 */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                2. Using the Hook
              </h3>
              <pre className="p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto">
                {`import { useAutoCleanText } from '@/hooks/useTextCleaner'

function ChatMessage({ message }) {
  const cleanedMessage = useAutoCleanText(message)
  return <p>{cleanedMessage}</p>
}`}
              </pre>
            </div>

            {/* Example 3 */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                3. Using the Component
              </h3>
              <pre className="p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto">
                {`import { CleanTextDisplay } from '@/components/TextCleaner'

<CleanTextDisplay text={dirtyText} className="text-gray-800" />`}
              </pre>
            </div>

            {/* Example 4 */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                4. Advanced: With Statistics
              </h3>
              <pre className="p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto">
                {`import { useTextCleaner } from '@/hooks/useTextCleaner'

function TextEditor({ initialText }) {
  const { cleanedText, stats, clean } = useTextCleaner(initialText)

  return (
    <div>
      <button onClick={clean}>Clean Text</button>
      <p>{cleanedText}</p>
      <p>Removed {stats.bytesRemoved} characters ({stats.percentageReduced}%)</p>
    </div>
  )
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ✨ Features
          </h2>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Removes markdown headers (###, ##, #)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Removes bold markers (**text**)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Removes italic markers (*text*)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Trims extra whitespace</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Preserves line breaks for readability</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Provides cleaning statistics</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>TypeScript type-safe</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Multiple usage options (function, hook, component)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

/**
 * Example component demonstrating hook usage
 */
function HookExample() {
  const sampleText = '### **This is bold** and this is *italic*'
  const cleanedText = useAutoCleanText(sampleText)

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Code:</h4>
        <pre className="p-3 bg-gray-900 text-green-400 rounded text-sm">
          {`const cleanedText = useAutoCleanText('### **This is bold** and this is *italic*')`}
        </pre>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Input:</h4>
        <div className="p-3 bg-gray-50 border rounded">
          <code>{sampleText}</code>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-green-700 mb-2">Output:</h4>
        <div className="p-3 bg-green-50 border border-green-200 rounded">
          <code>{cleanedText}</code>
        </div>
      </div>
    </div>
  )
}
