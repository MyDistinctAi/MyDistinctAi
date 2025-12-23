/**
 * Tour Steps Component
 *
 * Defines the content for each onboarding step
 */

'use client'

import { Upload, Brain, MessageSquare, Rocket, Sparkles } from 'lucide-react'

interface TourStep {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  image?: string
  tips?: string[]
}

const tourSteps: TourStep[] = [
  {
    title: 'Welcome to MyDistinctAI',
    description:
      'Your private AI studio where you can create custom AI models trained on your own data. Everything stays local and secure.',
    icon: Sparkles,
    tips: [
      'Your data never leaves your device',
      'Train custom models on your documents',
      'GDPR and HIPAA compliant',
      'No cloud dependencies',
    ],
  },
  {
    title: 'Upload Your Knowledge',
    description:
      'Start by uploading documents, PDFs, or text files. Your AI will learn from this content to provide accurate, context-aware responses.',
    icon: Upload,
    tips: [
      'Supported formats: PDF, DOCX, TXT, MD, CSV',
      'Maximum file size: 10MB per file',
      'Upload multiple files at once',
      'Files are processed automatically',
    ],
  },
  {
    title: 'Create Your Model',
    description:
      'Configure your AI model with custom settings. Choose the base model, training mode, and personality to match your needs.',
    icon: Brain,
    tips: [
      'Quick training: 5-10 minutes',
      'Standard training: 15-30 minutes',
      'Advanced training: 1-2 hours',
      'Customize personality and tone',
    ],
  },
  {
    title: 'Start Chatting',
    description:
      'Once training is complete, start chatting with your AI. Ask questions, get insights, and leverage your custom knowledge base.',
    icon: MessageSquare,
    tips: [
      'Be specific with your questions',
      'Reference documents when needed',
      'Use follow-up questions',
      'Export chat history anytime',
    ],
  },
  {
    title: 'Explore Features',
    description:
      "You're all set! Explore analytics, manage multiple models, customize branding, and unlock the full power of private AI.",
    icon: Rocket,
    tips: [
      'View model analytics and performance',
      'Create unlimited models (Pro plan)',
      'White-label with custom branding',
      'Access API for integrations',
    ],
  },
]

interface TourStepsProps {
  currentStep: number
}

export default function TourSteps({ currentStep }: TourStepsProps) {
  const step = tourSteps[currentStep]
  const Icon = step.icon

  return (
    <div className="flex flex-col items-center text-center space-y-6">
      {/* Icon */}
      <div className="flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full">
        <Icon className="h-12 w-12 text-blue-600" />
      </div>

      {/* Title */}
      <h3 className="text-3xl font-bold text-gray-900">{step.title}</h3>

      {/* Description */}
      <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">{step.description}</p>

      {/* Tips */}
      {step.tips && step.tips.length > 0 && (
        <div className="w-full max-w-2xl mt-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-sm font-semibold text-blue-900 uppercase tracking-wide mb-4">
              {currentStep === 0 ? 'Key Benefits' : 'Tips'}
            </h4>
            <ul className="space-y-3 text-left">
              {step.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-700">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                    {index + 1}
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Image Placeholder */}
      {step.image && (
        <div className="w-full max-w-2xl mt-6">
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-400">Image: {step.image}</p>
          </div>
        </div>
      )}
    </div>
  )
}
