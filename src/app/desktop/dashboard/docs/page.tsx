'use client'

/**
 * Desktop Documentation Page
 * 
 * In-app documentation with Getting Started, Features Guide, and FAQs
 * Optimized for offline desktop usage
 */

import { useState } from 'react'
import Link from 'next/link'
import {
    ArrowLeft,
    Book,
    Search,
    ChevronRight,
    Copy,
    Check,
    Upload,
    Brain,
    MessageSquare,
    Settings,
    Server,
    Code,
    HelpCircle,
    Monitor
} from 'lucide-react'

interface DocSection {
    id: string
    title: string
    icon: any
    content: string[]
}

export default function DesktopDocsPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [activeSection, setActiveSection] = useState('getting-started')
    const [copiedCode, setCopiedCode] = useState<string | null>(null)

    const docSections: DocSection[] = [
        {
            id: 'getting-started',
            title: 'Getting Started',
            icon: Book,
            content: [
                '## Quick Start Guide',
                '',
                'Welcome to MyDistinctAI Desktop! This guide will help you get started with your offline AI assistant.',
                '',
                '### Step 1: Upload Your Training Data',
                '',
                '1. Navigate to **Training Data** from the sidebar',
                '2. Click the **Upload Files** button',
                '3. Select your documents (PDF, DOCX, TXT, MD supported)',
                '4. Wait for processing to complete',
                '',
                'Your files will be processed locally and stored in the vector database for RAG retrieval.',
                '',
                '### Step 2: Create Your First Model',
                '',
                '1. Go to **My Models** page',
                '2. Click **Create New Model**',
                '3. Enter a descriptive name',
                '4. Add a system prompt to customize behavior',
                '5. Click **Create**',
                '',
                '### Step 3: Chat with Your AI',
                '',
                '1. Navigate to the **Chat** page',
                '2. Select your model from the dropdown',
                '3. Click **New Chat** to start a session',
                '4. Ask questions - the AI will use your training data for context!',
                '',
                '### Tips for Best Results',
                '',
                '- Upload high-quality, relevant documents',
                '- Use clear, specific questions',
                '- The AI retrieves context from your documents automatically (RAG)',
                '- All processing happens locally - your data never leaves your device',
            ],
        },
        {
            id: 'desktop-mode',
            title: 'Desktop Mode',
            icon: Monitor,
            content: [
                '## Desktop Mode Features',
                '',
                'MyDistinctAI Desktop runs completely offline, giving you full privacy and control.',
                '',
                '### Offline Capabilities',
                '',
                '- **No Internet Required**: All AI processing happens locally',
                '- **Private Data**: Your documents never leave your computer',
                '- **Local Storage**: SQLite for data, LanceDB for vectors',
                '- **Ollama Integration**: Local LLM inference',
                '',
                '### System Components',
                '',
                '**Ollama** - Local AI inference engine',
                '- Runs AI models on your hardware',
                '- Supports various models (Mistral, Llama, etc.)',
                '- Manages embeddings for RAG',
                '',
                '**SQLite Database**',
                '- Stores models, chat sessions, messages',
                '- Located in your app data folder',
                '- Fast local queries',
                '',
                '**LanceDB Vector Store**',
                '- Stores document embeddings',
                '- Enables semantic search',
                '- Powers RAG context retrieval',
                '',
                '### Starting Ollama',
                '',
                'If Ollama is not running:',
                '',
                '```bash',
                '# Start Ollama service',
                'ollama serve',
                '',
                '# Pull a model (if needed)',
                'ollama pull mistral:7b',
                '```',
                '',
                '### Data Locations',
                '',
                '- **Windows**: `%APPDATA%/com.mydistinctai.app/`',
                '- **macOS**: `~/Library/Application Support/com.mydistinctai.app/`',
                '- **Linux**: `~/.local/share/com.mydistinctai.app/`',
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
                '**Creating Models:**',
                '- Give each model a unique name',
                '- Set a system prompt to define behavior',
                '- Models are stored locally in SQLite',
                '',
                '**System Prompts:**',
                '- Define how the AI should respond',
                '- Example: "You are a helpful assistant that answers questions based on the provided documents."',
                '- Keep prompts clear and specific',
                '',
                '### Training Data',
                '',
                '**Supported Formats:**',
                '- PDF documents',
                '- Word documents (.docx)',
                '- Text files (.txt)',
                '- Markdown files (.md)',
                '',
                '**Processing Pipeline:**',
                '1. File text extraction',
                '2. Text chunking (optimal size for context)',
                '3. Embedding generation (using nomic-embed-text)',
                '4. Vector storage in LanceDB',
                '',
                '### Chat Interface',
                '',
                '**Features:**',
                '- Multiple chat sessions per model',
                '- RAG-powered responses using your documents',
                '- Message history stored locally',
                '- Fast local inference',
                '',
                '**RAG (Retrieval-Augmented Generation):**',
                '- Your question is converted to an embedding',
                '- Similar chunks are retrieved from your documents',
                '- Context is included in the AI prompt',
                '- More accurate, grounded responses',
            ],
        },
        {
            id: 'troubleshooting',
            title: 'Troubleshooting',
            icon: HelpCircle,
            content: [
                '## Troubleshooting Guide',
                '',
                '### Ollama Issues',
                '',
                '**"Ollama not responding"**',
                '',
                '```bash',
                '# Check if Ollama is running',
                'curl http://localhost:11434/api/version',
                '',
                '# Start Ollama',
                'ollama serve',
                '```',
                '',
                '**"Model not found"**',
                '',
                '```bash',
                '# List available models',
                'ollama list',
                '',
                '# Pull required model',
                'ollama pull mistral:7b',
                'ollama pull nomic-embed-text',
                '```',
                '',
                '### Database Issues',
                '',
                '**"Failed to load data"**',
                '',
                '- Check app data directory exists',
                '- Restart the application',
                '- Database is auto-created on first run',
                '',
                '### File Upload Issues',
                '',
                '**"Processing failed"**',
                '',
                '- Ensure file is not corrupted',
                '- Check file size (max 10MB recommended)',
                '- Verify Ollama is running for embeddings',
                '',
                '### Performance Tips',
                '',
                '- Use an SSD for faster vector searches',
                '- More RAM = better model performance',
                '- GPU acceleration speeds up inference',
                '- Keep training data relevant and focused',
            ],
        },
        {
            id: 'faqs',
            title: 'FAQs',
            icon: MessageSquare,
            content: [
                '## Frequently Asked Questions',
                '',
                '**Q: Is my data private?**',
                '',
                'A: Yes! All data stays on your device. No internet connection is required for core functionality.',
                '',
                '**Q: What AI models can I use?**',
                '',
                'A: Any model supported by Ollama, including Mistral, Llama, Phi, and more.',
                '',
                '**Q: How much storage do I need?**',
                '',
                'A: Minimum 10GB for base functionality. Models require additional space (3-8GB each).',
                '',
                '**Q: Can I export my data?**',
                '',
                'A: Your data is stored in standard SQLite format. You can access it directly from the app data folder.',
                '',
                '**Q: Does it work completely offline?**',
                '',
                'A: Yes, once models are downloaded, everything works offline.',
                '',
                '**Q: How do I update the app?**',
                '',
                'A: Download the latest version from our website. Your data will be preserved.',
                '',
                '**Q: What if Ollama shows "offline"?**',
                '',
                'A: Start Ollama manually with `ollama serve` in your terminal.',
                '',
                '**Q: How accurate is the RAG system?**',
                '',
                'A: Accuracy depends on your training data quality. More relevant, well-structured documents = better results.',
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
                        <Link
                            href="/desktop/dashboard"
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            Back to Dashboard
                        </Link>

                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Documentation</h2>

                        {/* Search */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search docs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <nav className="space-y-1">
                            {filteredSections.map((section) => {
                                const Icon = section.icon
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${activeSection === section.id
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {section.title}
                                        <ChevronRight className={`ml-auto h-4 w-4 ${activeSection === section.id ? 'text-blue-500' : 'text-gray-400'
                                            }`} />
                                    </button>
                                )
                            })}
                        </nav>

                        {/* Offline Badge */}
                        <div className="mt-6 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Monitor className="h-4 w-4 text-green-600" />
                                <span className="text-xs font-medium text-green-700">Desktop Mode</span>
                            </div>
                            <p className="text-xs text-green-600 mt-1">Fully offline documentation</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-8">
                        {activeDoc && (
                            <div className="max-w-3xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <activeDoc.icon className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <h1 className="text-2xl font-bold text-gray-900">{activeDoc.title}</h1>
                                </div>
                                <div className="prose prose-gray max-w-none">
                                    {renderContent(activeDoc.content)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
