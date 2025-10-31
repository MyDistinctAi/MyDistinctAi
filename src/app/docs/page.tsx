/**
 * Documentation Site
 *
 * Comprehensive documentation for MyDistinctAI platform
 */

'use client'

import { useState } from 'react'
import { ArrowLeft, Search, Book, Code, Shield, Server, HelpCircle, Copy, Check } from 'lucide-react'
import Link from 'next/link'

interface DocSection {
  id: string
  title: string
  icon: any
  content: React.ReactNode
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const sections: DocSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Book,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Start Guide</h2>
            <p className="text-gray-600 mb-4">
              Welcome to MyDistinctAI! Follow these steps to create your first AI model.
            </p>
          </div>

          <div className="space-y-4">
            <div className="border-l-4 border-blue-600 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Step 1: Upload Your Data</h3>
              <p className="text-gray-600">
                Navigate to the Models page and click "Create New Model". Upload your training documents
                (PDF, DOCX, TXT, MD, or CSV files) to teach your AI.
              </p>
            </div>

            <div className="border-l-4 border-blue-600 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Step 2: Configure Your Model</h3>
              <p className="text-gray-600">
                Set your model's name, description, and personality. Choose between Quick, Standard, or
                Advanced training modes based on your needs.
              </p>
            </div>

            <div className="border-l-4 border-blue-600 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Step 3: Train & Chat</h3>
              <p className="text-gray-600">
                Start training and monitor progress in real-time. Once complete, start chatting with your
                custom AI model that's trained on your specific knowledge.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h4 className="font-semibold text-blue-900 mb-2">Supported File Formats</h4>
            <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm">
              <li>PDF documents (.pdf) - Max 10MB</li>
              <li>Word documents (.docx) - Max 10MB</li>
              <li>Plain text (.txt) - Max 10MB</li>
              <li>Markdown (.md) - Max 10MB</li>
              <li>CSV files (.csv) - Max 10MB</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      icon: Code,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">API Reference</h2>
            <p className="text-gray-600 mb-4">
              Use the MyDistinctAI API to integrate custom AI models into your applications.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Authentication</h3>
              <p className="text-gray-600 mb-3">
                All API requests require authentication using your API key in the Authorization header.
              </p>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`curl https://api.mydistinctai.com/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "your-model-id",
    "message": "Hello, AI!"
  }'`}
                </pre>
                <button
                  onClick={() => copyCode(`curl https://api.mydistinctai.com/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "your-model-id",
    "message": "Hello, AI!"
  }'`, 'auth')}
                  className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  aria-label="Copy code"
                >
                  {copiedCode === 'auth' ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Chat Endpoint</h3>
              <p className="text-gray-600 mb-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">POST /v1/chat</code>
              </p>
              <p className="text-gray-600 mb-3">Send a message to your AI model and receive a response.</p>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Request Body</h4>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "model": "model_123",
  "message": "What is the meaning of life?",
  "sessionId": "session_456",  // optional
  "temperature": 0.7,          // optional (0.0-1.0)
  "maxTokens": 500             // optional
}`}
                    </pre>
                    <button
                      onClick={() => copyCode(`{
  "model": "model_123",
  "message": "What is the meaning of life?",
  "sessionId": "session_456",
  "temperature": 0.7,
  "maxTokens": 500
}`, 'request')}
                      className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                      aria-label="Copy code"
                    >
                      {copiedCode === 'request' ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Response</h4>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "id": "msg_789",
  "model": "model_123",
  "message": "The meaning of life is...",
  "tokens": 45,
  "createdAt": "2025-01-15T12:00:00Z"
}`}
                    </pre>
                    <button
                      onClick={() => copyCode(`{
  "id": "msg_789",
  "model": "model_123",
  "message": "The meaning of life is...",
  "tokens": 45,
  "createdAt": "2025-01-15T12:00:00Z"
}`, 'response')}
                      className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                      aria-label="Copy code"
                    >
                      {copiedCode === 'response' ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Rate Limits</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Free tier:</strong> 100 requests per day</li>
                  <li><strong>Pro tier:</strong> 10,000 requests per day</li>
                  <li><strong>Enterprise:</strong> Custom limits</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'self-hosting',
      title: 'Self-Hosting Guide',
      icon: Server,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Self-Hosting Guide</h2>
            <p className="text-gray-600 mb-4">
              Deploy MyDistinctAI on your own infrastructure for complete control and privacy.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">System Requirements</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <ul className="space-y-2 text-gray-700">
                  <li><strong>OS:</strong> Linux (Ubuntu 22.04+), macOS, or Windows 10+</li>
                  <li><strong>CPU:</strong> 4+ cores recommended</li>
                  <li><strong>RAM:</strong> 8GB minimum, 16GB recommended</li>
                  <li><strong>Storage:</strong> 50GB+ SSD</li>
                  <li><strong>GPU:</strong> Optional (NVIDIA with CUDA support for faster inference)</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Installation Steps</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">1. Install Ollama</h4>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`# Linux/macOS
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download`}
                    </pre>
                    <button
                      onClick={() => copyCode(`curl -fsSL https://ollama.com/install.sh | sh`, 'install-ollama')}
                      className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                      aria-label="Copy code"
                    >
                      {copiedCode === 'install-ollama' ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">2. Clone Repository</h4>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`git clone https://github.com/yourusername/mydistinctai.git
cd mydistinctai
npm install`}
                    </pre>
                    <button
                      onClick={() => copyCode(`git clone https://github.com/yourusername/mydistinctai.git
cd mydistinctai
npm install`, 'clone-repo')}
                      className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                      aria-label="Copy code"
                    >
                      {copiedCode === 'clone-repo' ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">3. Configure Environment</h4>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`cp .env.example .env.local
# Edit .env.local with your Supabase credentials
# Set OLLAMA_URL=http://localhost:11434`}
                    </pre>
                    <button
                      onClick={() => copyCode(`cp .env.example .env.local`, 'configure')}
                      className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                      aria-label="Copy code"
                    >
                      {copiedCode === 'configure' ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">4. Start Services</h4>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`# Start Ollama
ollama serve

# Start Next.js app
npm run dev`}
                    </pre>
                    <button
                      onClick={() => copyCode(`ollama serve\nnpm run dev`, 'start')}
                      className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                      aria-label="Copy code"
                    >
                      {copiedCode === 'start' ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Production Deployment</h4>
              <p className="text-blue-700 text-sm">
                For production deployments, use Docker Compose or Kubernetes. See our{' '}
                <a href="#" className="underline hover:text-blue-800">deployment guide</a> for detailed
                instructions.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      icon: Shield,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Security & Privacy</h2>
            <p className="text-gray-600 mb-4">
              MyDistinctAI is built with privacy and security as core principles.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Data Encryption</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>All data encrypted at rest using AES-256 encryption</li>
                <li>TLS 1.3 for data in transit</li>
                <li>End-to-end encryption for sensitive documents</li>
                <li>Encryption keys managed securely in OS keychain</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Compliance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">GDPR Compliant</h4>
                  <p className="text-green-700 text-sm">
                    Full compliance with EU General Data Protection Regulation. Right to access, delete,
                    and export your data.
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">HIPAA Ready</h4>
                  <p className="text-blue-700 text-sm">
                    Self-hosted deployment meets HIPAA requirements for healthcare data with proper
                    configuration.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Privacy Features</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Your data never leaves your device (self-hosted mode)</li>
                <li>No third-party AI services - models run locally</li>
                <li>No telemetry or analytics without your consent</li>
                <li>Complete data deletion on account closure</li>
                <li>Audit logs for all data access</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'faq',
      title: 'FAQs',
      icon: HelpCircle,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-semibold text-gray-900 mb-2">How is MyDistinctAI different from ChatGPT?</h3>
              <p className="text-gray-600">
                MyDistinctAI runs entirely on your device and is trained on your specific documents. Your
                data never leaves your infrastructure, unlike cloud-based services like ChatGPT.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-semibold text-gray-900 mb-2">What AI models does it support?</h3>
              <p className="text-gray-600">
                We support Llama 2, Mistral 7B, and other open-source models via Ollama. You can use any
                model that Ollama supports.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Can I use this for commercial purposes?</h3>
              <p className="text-gray-600">
                Yes! Our Professional and Enterprise plans include commercial licenses. The models we use
                are open-source and commercially viable.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-semibold text-gray-900 mb-2">How long does training take?</h3>
              <p className="text-gray-600">
                Training time depends on your data size and chosen mode. Quick mode: 5-10 minutes, Standard:
                30-60 minutes, Advanced: 2-4 hours.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Do I need a GPU?</h3>
              <p className="text-gray-600">
                No, MyDistinctAI works on CPU. However, a GPU significantly speeds up training and inference
                (5-10x faster).
              </p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Can I export my data?</h3>
              <p className="text-gray-600">
                Yes, you can export all your data at any time from Settings. We provide exports in JSON and
                CSV formats.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Is there a mobile app?</h3>
              <p className="text-gray-600">
                The web interface is mobile-responsive. Native mobile apps for iOS and Android are planned
                for Q2 2025.
              </p>
            </div>

            <div className="pb-4">
              <h3 className="font-semibold text-gray-900 mb-2">How do I get support?</h3>
              <p className="text-gray-600">
                Free tier: Community support via Discord. Pro/Enterprise: Priority email support and
                dedicated Slack channel.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ]

  const filteredSections = sections.filter((section) =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeContent = sections.find((s) => s.id === activeSection)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Documentation</h1>
              <p className="text-gray-600 mt-1">Everything you need to know about MyDistinctAI</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg border border-gray-200 p-4 sticky top-8">
              <h2 className="font-semibold text-gray-900 mb-3">Sections</h2>
              <ul className="space-y-1">
                {filteredSections.map((section) => {
                  const Icon = section.icon
                  return (
                    <li key={section.id}>
                      <button
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeSection === section.id
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm">{section.title}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              {activeContent?.content}
            </div>

            {/* Help Section */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Need More Help?</h3>
              <p className="text-blue-700 mb-4">
                Can't find what you're looking for? We're here to help!
              </p>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Contact Support
                </a>
                <a
                  href="#"
                  className="px-4 py-2 bg-white text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  Join Discord
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
