'use client'

import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface ProgressStep {
  id: string
  label: string
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  percentage?: number
  message?: string
}

interface ProgressStepsProps {
  steps: ProgressStep[]
  currentStep?: number
  showPercentages?: boolean
  compact?: boolean
  className?: string
}

export function ProgressSteps({
  steps,
  currentStep,
  showPercentages = true,
  compact = false,
  className = '',
}: ProgressStepsProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <AnimatePresence mode="popLayout">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="relative"
          >
            <div className="flex items-start gap-3">
              {/* Status Icon */}
              <div className="flex-shrink-0 mt-1">
                {step.status === 'completed' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </motion.div>
                )}
                {step.status === 'in_progress' && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    <Loader2 className="w-5 h-5 text-blue-500" />
                  </motion.div>
                )}
                {step.status === 'pending' && (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
                {step.status === 'error' && (
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs">✕</span>
                  </div>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-sm font-medium ${
                      step.status === 'completed'
                        ? 'text-green-600 dark:text-green-400'
                        : step.status === 'in_progress'
                        ? 'text-blue-600 dark:text-blue-400'
                        : step.status === 'error'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {step.label}
                  </p>

                  {/* Percentage */}
                  {showPercentages &&
                    step.percentage !== undefined &&
                    step.status === 'in_progress' && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs font-medium text-blue-600 dark:text-blue-400"
                      >
                        {step.percentage}%
                      </motion.span>
                    )}
                </div>

                {/* Progress Bar */}
                {!compact &&
                  showPercentages &&
                  step.percentage !== undefined &&
                  step.status === 'in_progress' && (
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                      className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${step.percentage}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full bg-blue-500 rounded-full"
                      />
                    </motion.div>
                  )}

                {/* Message */}
                {!compact && step.message && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-1 text-xs text-gray-500 dark:text-gray-400"
                  >
                    {step.message}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Connector Line */}
            {!compact && index < steps.length - 1 && (
              <div className="ml-2.5 mt-2 mb-2 h-6 w-px bg-gray-200 dark:bg-gray-700" />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Preset configurations for common use cases
export const FILE_UPLOAD_STEPS: Omit<ProgressStep, 'status' | 'percentage'>[] =
  [
    { id: 'upload', label: 'Uploading file' },
    { id: 'extract', label: 'Extracting text' },
    { id: 'chunk', label: 'Chunking content' },
    { id: 'embed', label: 'Generating embeddings' },
    { id: 'store', label: 'Storing vectors' },
    { id: 'verify', label: 'Verifying storage' },
    { id: 'cleanup', label: 'Optimizing storage' },
  ]

export const CHAT_QUERY_STEPS: Omit<ProgressStep, 'status'>[] = [
  { id: 'search', label: 'Searching documents' },
  { id: 'context', label: 'Finding relevant context' },
  { id: 'generate', label: 'Generating response' },
]

export const MODEL_CREATION_STEPS: Omit<ProgressStep, 'status'>[] = [
  { id: 'validate', label: 'Validating configuration' },
  { id: 'create', label: 'Creating model' },
  { id: 'initialize', label: 'Initializing settings' },
]

/**
 * Example usage:
 *
 * // Basic usage
 * const [steps, setSteps] = useState<ProgressStep[]>([
 *   { id: '1', label: 'Uploading...', status: 'completed', percentage: 100 },
 *   { id: '2', label: 'Extracting text...', status: 'in_progress', percentage: 45 },
 *   { id: '3', label: 'Chunking...', status: 'pending' },
 * ])
 *
 * <ProgressSteps steps={steps} />
 *
 * // Using presets
 * const [uploadSteps, setUploadSteps] = useState<ProgressStep[]>(
 *   FILE_UPLOAD_STEPS.map(step => ({ ...step, status: 'pending' }))
 * )
 *
 * // Update step progress
 * setUploadSteps(prev => prev.map((step, i) =>
 *   i === 1
 *     ? { ...step, status: 'in_progress', percentage: 45, message: 'Processing page 3 of 10' }
 *     : step
 * ))
 *
 * // Compact mode (no progress bars or messages)
 * <ProgressSteps steps={steps} compact showPercentages={false} />
 */
