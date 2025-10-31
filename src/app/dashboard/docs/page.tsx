/**
 * User Documentation Site
 *
 * In-app documentation with Getting Started, Features Guide, API Docs, Self-Hosting Guide, and FAQs
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Book,
  Search,
  ChevronRight,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Upload,
  Brain,
  MessageSquare,
  Settings,
  Palette,
  Key,
  Server,
  Cloud,
  Shield,
  Code,
} from 'lucide-react'

interface DocSection {
  id: string
  title: string
  icon: any
  content: string[]
}

export default function DocsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState('getting-started')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ [key: string]: 'helpful' | 'not-helpful' | null }>({})

  const docSections: DocSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Book,
      content: [
        '## Quick Start Guide',
        '',
        'Welcome to MyDistinctAI! This guide will help you get started with creating your first AI model.',
        '',
        '### Step 1: Upload Your First Data',
        '',
        '1. Navigate to the **Training Data** page from the dashboard',
        '2. Click the **Upload Files** button',
        '3. Drag and drop your files or click to browse',
        '4. Supported formats: PDF, DOCX, TXT, MD, CSV',
        '5. Maximum file size: 10MB per file',
        '',
        'Your files will be processed automatically and prepared for model training.',
        '',
        '### Step 2: Train Your First Model',
        '',
        '1. Go to the **My Models** page',
        '2. Click **Create New Model**',
        '3. Enter a descriptive name for your model',
        '4. Select your base model (we recommend Mistral 7B for beginners)',
        '5. Choose your training mode:',
        '   - **Quick**: Fast training, lower accuracy (5-10 minutes)',
        '   - **Standard**: Balanced (15-30 minutes)',
        '   - **Advanced**: Slower, higher accuracy (1-2 hours)',
        '6. Click **Create & Train**',
        '',
        'You can monitor training progress in real-time on the Models page.',
        '',
        '### Step 3: Chat with Your AI',
        '',
        '1. Once training is complete, click on your model card',
        '2. Click the **Chat** button',
        '3. Start asking questions based on your training data',
        '4. Your AI will respond using the knowledge from your documents',
        '',
        '### Tips for Best Results',
        '',
        '- Upload high-quality, relevant documents',
        '- Use clear, specific questions when chatting',
        '- Train multiple models for different topics',
        '- Review the Analytics page to improve model performance',
      ],
    },
    {
      id: 'features-guide',
      title: 'Features Guide',
      icon: Settings,
      content: [
        '## Features Guide',
        '',
        '### Model Management',
        '',
        'Create, train, and manage multiple AI models tailored to different use cases.',
        '',
        '**Creating Models:**',
        '- Choose from multiple base models (Mistral, Llama, etc.)',
        '- Customize personality and tone',
        '- Set training parameters',
        '- Configure response length and style',
        '',
        '**Model Analytics:**',
        '- View usage statistics',
        '- Monitor performance metrics',
        '- Track response times',
        '- Analyze accuracy trends',
        '',
        '### Training Options',
        '',
        '**Training Modes:**',
        '',
        '1. **Quick Training**',
        '   - Best for: Testing and prototyping',
        '   - Duration: 5-10 minutes',
        '   - Accuracy: Good for simple queries',
        '',
        '2. **Standard Training**',
        '   - Best for: General production use',
        '   - Duration: 15-30 minutes',
        '   - Accuracy: Excellent for most use cases',
        '',
        '3. **Advanced Training**',
        '   - Best for: Critical applications',
        '   - Duration: 1-2 hours',
        '   - Accuracy: Maximum precision',
        '',
        '**Advanced Settings:**',
        '- Learning rate: Controls how fast the model adapts',
        '- Context window: How much text the model can process',
        '- Temperature: Creativity vs. consistency (0.0 - 1.0)',
        '- Max response length: Token limit for responses',
        '',
        '### Chat Interface',
        '',
        '**Features:**',
        '- Real-time streaming responses',
        '- Code syntax highlighting',
        '- Copy messages to clipboard',
        '- Regenerate responses',
        '- Export chat history',
        '- Multi-session management',
        '',
        '**Tips for Effective Prompts:**',
        '- Be specific and clear',
        '- Provide context when needed',
        '- Break complex questions into parts',
        '- Reference specific documents when relevant',
        '',
        '### White-Label Setup',
        '',
        'Customize MyDistinctAI with your own branding.',
        '',
        '**Available Customizations:**',
        '- Upload your logo (recommended: 200x50px)',
        '- Set primary and secondary colors',
        '- Configure custom domain',
        '- Update company name and metadata',
        '',
        '**Setting Up Custom Domain:**',
        '1. Go to Settings → Branding',
        '2. Enter your custom domain',
        '3. Add DNS records (CNAME)',
        '4. Wait for DNS propagation (24-48 hours)',
        '5. Verify domain ownership',
        '',
        '### API Keys',
        '',
        '**Creating API Keys:**',
        '1. Navigate to Settings → API Keys',
        '2. Click **Create API Key**',
        '3. Enter a descriptive name',
        '4. Copy the key immediately (shown only once)',
        '5. Store securely',
        '',
        '**Security Best Practices:**',
        '- Never commit API keys to version control',
        '- Rotate keys regularly',
        '- Use different keys for different environments',
        '- Delete unused keys',
        '- Monitor usage for suspicious activity',
      ],
    },
    {
      id: 'api-docs',
      title: 'API Documentation',
      icon: Code,
      content: [
        '## API Documentation',
        '',
        '### Authentication',
        '',
        'All API requests require authentication using an API key.',
        '',
        '```bash',
        'curl https://api.mydistinctai.com/v1/chat \\',
        '  -H "Authorization: Bearer YOUR_API_KEY" \\',
        '  -H "Content-Type: application/json" \\',
        '  -d \'{"model_id": "model_123", "message": "Hello"}\'',
        '```',
        '',
        '### Endpoints Reference',
        '',
        '#### POST /v1/chat',
        '',
        'Send a message to your AI model and receive a response.',
        '',
        '**Request:**',
        '```json',
        '{',
        '  "model_id": "model_123",',
        '  "message": "What is machine learning?",',
        '  "session_id": "session_456",',
        '  "stream": false',
        '}',
        '```',
        '',
        '**Response:**',
        '```json',
        '{',
        '  "id": "msg_789",',
        '  "model_id": "model_123",',
        '  "message": "Machine learning is...",',
        '  "tokens_used": 145,',
        '  "response_time_ms": 234',
        '}',
        '```',
        '',
        '#### GET /v1/models',
        '',
        'List all your trained models.',
        '',
        '**Request:**',
        '```bash',
        'curl https://api.mydistinctai.com/v1/models \\',
        '  -H "Authorization: Bearer YOUR_API_KEY"',
        '```',
        '',
        '**Response:**',
        '```json',
        '{',
        '  "models": [',
        '    {',
        '      "id": "model_123",',
        '      "name": "Customer Support Bot",',
        '      "status": "ready",',
        '      "created_at": "2024-01-15T10:30:00Z"',
        '    }',
        '  ]',
        '}',
        '```',
        '',
        '#### POST /v1/models',
        '',
        'Create a new model.',
        '',
        '**Request:**',
        '```json',
        '{',
        '  "name": "My New Model",',
        '  "description": "Model for analyzing contracts",',
        '  "base_model": "mistral:7b",',
        '  "training_mode": "standard"',
        '}',
        '```',
        '',
        '#### DELETE /v1/models/{model_id}',
        '',
        'Delete a model.',
        '',
        '**Request:**',
        '```bash',
        'curl -X DELETE https://api.mydistinctai.com/v1/models/model_123 \\',
        '  -H "Authorization: Bearer YOUR_API_KEY"',
        '```',
        '',
        '### Rate Limits',
        '',
        '| Plan | Requests/min | Tokens/day |',
        '|------|--------------|------------|',
        '| Starter | 60 | 100,000 |',
        '| Professional | 300 | 1,000,000 |',
        '| Enterprise | Custom | Unlimited |',
        '',
        '### Error Codes',
        '',
        '| Code | Description |',
        '|------|-------------|',
        '| 400 | Bad Request - Invalid parameters |',
        '| 401 | Unauthorized - Invalid API key |',
        '| 403 | Forbidden - Insufficient permissions |',
        '| 404 | Not Found - Resource does not exist |',
        '| 429 | Rate Limit Exceeded |',
        '| 500 | Internal Server Error |',
        '',
        '### Code Examples',
        '',
        '**Python:**',
        '```python',
        'import requests',
        '',
        'api_key = "YOUR_API_KEY"',
        'headers = {',
        '    "Authorization": f"Bearer {api_key}",',
        '    "Content-Type": "application/json"',
        '}',
        '',
        'response = requests.post(',
        '    "https://api.mydistinctai.com/v1/chat",',
        '    headers=headers,',
        '    json={',
        '        "model_id": "model_123",',
        '        "message": "Hello, AI!"',
        '    }',
        ')',
        '',
        'print(response.json())',
        '```',
        '',
        '**JavaScript:**',
        '```javascript',
        'const apiKey = "YOUR_API_KEY";',
        '',
        'const response = await fetch("https://api.mydistinctai.com/v1/chat", {',
        '  method: "POST",',
        '  headers: {',
        '    "Authorization": `Bearer ${apiKey}`,',
        '    "Content-Type": "application/json"',
        '  },',
        '  body: JSON.stringify({',
        '    model_id: "model_123",',
        '    message: "Hello, AI!"',
        '  })',
        '});',
        '',
        'const data = await response.json();',
        'console.log(data);',
        '```',
      ],
    },
    {
      id: 'self-hosting',
      title: 'Self-Hosting Guide',
      icon: Server,
      content: [
        '## Self-Hosting Guide',
        '',
        '### System Requirements',
        '',
        '**Minimum Requirements:**',
        '- CPU: 4 cores',
        '- RAM: 16GB',
        '- Storage: 100GB SSD',
        '- OS: Ubuntu 20.04+ / macOS / Windows 10+',
        '',
        '**Recommended for Production:**',
        '- CPU: 8+ cores',
        '- RAM: 32GB+',
        '- Storage: 500GB NVMe SSD',
        '- GPU: NVIDIA with 8GB+ VRAM (optional, improves speed)',
        '',
        '### Installation Steps',
        '',
        '#### 1. Install Dependencies',
        '',
        '**Ubuntu/Debian:**',
        '```bash',
        'sudo apt update',
        'sudo apt install -y nodejs npm postgresql docker.io',
        '```',
        '',
        '**macOS:**',
        '```bash',
        'brew install node postgresql docker',
        '```',
        '',
        '#### 2. Install Ollama (Local AI Engine)',
        '',
        '```bash',
        'curl -fsSL https://ollama.ai/install.sh | sh',
        'ollama pull mistral:7b',
        '```',
        '',
        '#### 3. Clone and Configure',
        '',
        '```bash',
        'git clone https://github.com/yourusername/mydistinctai.git',
        'cd mydistinctai',
        'npm install',
        '```',
        '',
        '#### 4. Database Setup',
        '',
        '```bash',
        'createdb mydistinctai',
        'psql mydistinctai < schema.sql',
        '```',
        '',
        '#### 5. Environment Configuration',
        '',
        'Create `.env.local`:',
        '```bash',
        'NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key',
        'SUPABASE_SERVICE_ROLE_KEY=your_service_role_key',
        'OLLAMA_URL=http://localhost:11434',
        'DATABASE_URL=postgresql://localhost:5432/mydistinctai',
        '```',
        '',
        '#### 6. Start Services',
        '',
        '```bash',
        '# Terminal 1: Start Ollama',
        'ollama serve',
        '',
        '# Terminal 2: Start Supabase (if using local)',
        'npx supabase start',
        '',
        '# Terminal 3: Start Next.js',
        'npm run dev',
        '```',
        '',
        '### Configuration',
        '',
        '**Docker Compose (Recommended):**',
        '',
        '```yaml',
        'version: "3.8"',
        'services:',
        '  app:',
        '    image: mydistinctai:latest',
        '    ports:',
        '      - "3000:3000"',
        '    environment:',
        '      - DATABASE_URL=postgresql://db:5432/mydistinctai',
        '    depends_on:',
        '      - db',
        '      - ollama',
        '',
        '  db:',
        '    image: postgres:15',
        '    volumes:',
        '      - postgres_data:/var/lib/postgresql/data',
        '',
        '  ollama:',
        '    image: ollama/ollama',
        '    volumes:',
        '      - ollama_data:/root/.ollama',
        '',
        'volumes:',
        '  postgres_data:',
        '  ollama_data:',
        '```',
        '',
        '### Troubleshooting',
        '',
        '**Issue: Ollama not responding**',
        '```bash',
        '# Check if Ollama is running',
        'curl http://localhost:11434/api/version',
        '',
        '# Restart Ollama',
        'systemctl restart ollama',
        '```',
        '',
        '**Issue: Database connection failed**',
        '```bash',
        '# Check PostgreSQL status',
        'sudo systemctl status postgresql',
        '',
        '# Check connection',
        'psql -h localhost -U postgres -d mydistinctai',
        '```',
        '',
        '**Issue: Port already in use**',
        '```bash',
        '# Find process using port',
        'lsof -i :3000',
        '',
        '# Kill process',
        'kill -9 <PID>',
        '```',
        '',
        '### Security Considerations',
        '',
        '1. **Change default credentials**',
        '2. **Enable HTTPS with SSL certificates**',
        '3. **Configure firewall rules**',
        '4. **Regular backups of database**',
        '5. **Keep dependencies updated**',
        '6. **Use strong passwords**',
        '7. **Enable 2FA for admin accounts**',
      ],
    },
    {
      id: 'faqs',
      title: 'FAQs',
      icon: MessageSquare,
      content: [
        '## Frequently Asked Questions',
        '',
        '### General Questions',
        '',
        '**Q: What makes MyDistinctAI different from ChatGPT?**',
        '',
        'A: MyDistinctAI is designed for privacy and customization. Your data never leaves your device, all processing happens locally, and you can train custom models on your proprietary data. ChatGPT is cloud-based and cannot be trained on your private documents.',
        '',
        '**Q: Do I need coding experience to use MyDistinctAI?**',
        '',
        'A: No! MyDistinctAI is designed to be user-friendly with no coding required. Simply upload your documents, create a model, and start chatting. API access is available for developers who want to integrate.',
        '',
        '**Q: What file formats are supported?**',
        '',
        'A: We support PDF, DOCX, TXT, MD, and CSV files. Maximum file size is 10MB per file.',
        '',
        '**Q: How long does model training take?**',
        '',
        'A: Training time depends on the mode selected:',
        '- Quick: 5-10 minutes',
        '- Standard: 15-30 minutes',
        '- Advanced: 1-2 hours',
        '',
        '### Privacy & Security',
        '',
        '**Q: Is my data really private?**',
        '',
        'A: Yes! When self-hosting, all data stays on your infrastructure. Even with our cloud version, we use end-to-end encryption and never use your data for training other models.',
        '',
        '**Q: Is MyDistinctAI GDPR compliant?**',
        '',
        'A: Yes, we are fully GDPR compliant. We provide data export, deletion, and privacy controls.',
        '',
        '**Q: Is MyDistinctAI HIPAA compliant?**',
        '',
        'A: Yes, when self-hosted. Our Enterprise plan includes HIPAA compliance features and BAA signing.',
        '',
        '**Q: How is data encrypted?**',
        '',
        'A: We use AES-256 encryption for data at rest and TLS 1.3 for data in transit.',
        '',
        '### Technical Questions',
        '',
        '**Q: Can I use my own AI models?**',
        '',
        'A: Yes! MyDistinctAI supports custom model integration. Contact our team for details.',
        '',
        '**Q: What hardware do I need for self-hosting?**',
        '',
        'A: Minimum: 4-core CPU, 16GB RAM, 100GB storage. For better performance, we recommend 8+ cores, 32GB RAM, and a GPU.',
        '',
        '**Q: Can I deploy on AWS/Azure/GCP?**',
        '',
        'A: Yes! We provide deployment guides for all major cloud providers.',
        '',
        '**Q: Does it work offline?**',
        '',
        'A: Yes, when self-hosted, MyDistinctAI works completely offline.',
        '',
        '### Billing & Plans',
        '',
        '**Q: What plans are available?**',
        '',
        'A: We offer:',
        '- Starter: $29/month (3 models, 10GB storage)',
        '- Professional: $99/month (unlimited models, 100GB storage, white-label)',
        '- Enterprise: Custom pricing (self-hosting, dedicated support)',
        '',
        '**Q: Can I cancel anytime?**',
        '',
        'A: Yes, you can cancel your subscription at any time. No long-term contracts.',
        '',
        '**Q: Do you offer refunds?**',
        '',
        'A: We offer a 14-day money-back guarantee for annual plans.',
        '',
        '**Q: Is there a free trial?**',
        '',
        'A: Yes! We offer a 14-day free trial with full access to Professional features.',
        '',
        '### Support',
        '',
        '**Q: How do I get support?**',
        '',
        'A: Support channels:',
        '- Email: support@mydistinctai.com',
        '- Discord community',
        '- GitHub issues',
        '- Enterprise: Dedicated Slack channel',
        '',
        '**Q: What are your support hours?**',
        '',
        'A: Email support: 24/7. Response time: <24 hours (Starter), <4 hours (Professional), <1 hour (Enterprise)',
        '',
        '**Q: Do you offer training?**',
        '',
        'A: Yes! Enterprise customers receive onboarding and training sessions.',
      ],
    },
  ]

  const filteredSections = docSections.filter((section) => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      section.title.toLowerCase().includes(searchLower) ||
      section.content.join(' ').toLowerCase().includes(searchLower)
    )
  })

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleFeedback = (sectionId: string, type: 'helpful' | 'not-helpful') => {
    setFeedback((prev) => ({ ...prev, [sectionId]: type }))
  }

  const renderContent = (content: string[]) => {
    return content.map((line, index) => {
      const key = `${activeSection}-${index}`

      // Headings
      if (line.startsWith('## ')) {
        return (
          <h2 key={key} className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {line.replace('## ', '')}
          </h2>
        )
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={key} className="text-xl font-semibold text-gray-900 mt-6 mb-3">
            {line.replace('### ', '')}
          </h3>
        )
      }

      // Code blocks
      if (line.startsWith('```')) {
        const language = line.replace('```', '')
        const codeLines: string[] = []
        let i = index + 1

        while (i < content.length && !content[i].startsWith('```')) {
          codeLines.push(content[i])
          i++
        }

        const code = codeLines.join('\n')
        const codeId = `code-${key}`

        return (
          <div key={key} className="my-4">
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
                <span className="text-xs text-gray-400 uppercase">{language || 'code'}</span>
                <button
                  onClick={() => copyCode(code, codeId)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  {copiedCode === codeId ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto">
                <code className="text-sm text-gray-100 font-mono">{code}</code>
              </pre>
            </div>
          </div>
        )
      }

      // Skip closing code blocks
      if (line === '```') {
        return null
      }

      // Tables
      if (line.startsWith('|')) {
        const isHeaderSeparator = line.includes('---')
        if (isHeaderSeparator) return null

        const cells = line
          .split('|')
          .filter((cell) => cell.trim())
          .map((cell) => cell.trim())

        return (
          <div key={key} className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 my-4">
              <tbody className="bg-white">
                <tr>
                  {cells.map((cell, i) => (
                    <td
                      key={i}
                      className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border border-gray-200"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )
      }

      // Lists
      if (line.match(/^[\d]+\.\s/)) {
        return (
          <li key={key} className="ml-6 text-gray-700 leading-relaxed">
            {line.replace(/^[\d]+\.\s/, '')}
          </li>
        )
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={key} className="ml-6 text-gray-700 leading-relaxed list-disc">
            {line.replace(/^[-*]\s/, '')}
          </li>
        )
      }

      // Bold text
      if (line.includes('**')) {
        const parts = line.split('**')
        return (
          <p key={key} className="text-gray-700 leading-relaxed my-2">
            {parts.map((part, i) =>
              i % 2 === 1 ? (
                <strong key={i} className="font-semibold text-gray-900">
                  {part}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        )
      }

      // Empty lines
      if (line === '') {
        return <div key={key} className="h-2" />
      }

      // Regular paragraphs
      return (
        <p key={key} className="text-gray-700 leading-relaxed my-2">
          {line}
        </p>
      )
    })
  }

  const activeDoc = docSections.find((section) => section.id === activeSection)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </button>

            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documentation</h2>

            <nav className="space-y-1">
              {filteredSections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{section.title}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8">
            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative max-w-2xl">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Content */}
            {activeDoc && (
              <div className="max-w-4xl">
                <div className="prose prose-blue max-w-none">
                  {renderContent(activeDoc.content)}
                </div>

                {/* Feedback */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-3">Was this helpful?</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleFeedback(activeDoc.id, 'helpful')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        feedback[activeDoc.id] === 'helpful'
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Yes
                    </button>
                    <button
                      onClick={() => handleFeedback(activeDoc.id, 'not-helpful')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        feedback[activeDoc.id] === 'not-helpful'
                          ? 'bg-red-50 border-red-300 text-red-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      No
                    </button>
                  </div>
                  {feedback[activeDoc.id] && (
                    <p className="mt-3 text-sm text-gray-600">
                      Thank you for your feedback!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
