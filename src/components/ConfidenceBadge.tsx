'use client'

import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { motion } from 'framer-motion'

interface ConfidenceBadgeProps {
  confidence: number // 0-100
  showLabel?: boolean
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function getConfidenceLevel(confidence: number): {
  level: 'high' | 'medium' | 'low'
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ReactNode
} {
  if (confidence >= 80) {
    return {
      level: 'high',
      label: 'High Confidence',
      color: 'text-green-700 dark:text-green-300',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-700',
      icon: <CheckCircle2 className="w-3 h-3" />,
    }
  } else if (confidence >= 60) {
    return {
      level: 'medium',
      label: 'Medium Confidence',
      color: 'text-yellow-700 dark:text-yellow-300',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-700',
      icon: <Info className="w-3 h-3" />,
    }
  } else {
    return {
      level: 'low',
      label: 'Low Confidence',
      color: 'text-red-700 dark:text-red-300',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-700',
      icon: <AlertTriangle className="w-3 h-3" />,
    }
  }
}

export function ConfidenceBadge({
  confidence,
  showLabel = false,
  showIcon = true,
  size = 'md',
  className = '',
}: ConfidenceBadgeProps) {
  const { level, label, color, bgColor, borderColor, icon } =
    getConfidenceLevel(confidence)

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`
        inline-flex items-center gap-1.5
        rounded-md font-medium border
        ${sizeClasses[size]}
        ${color}
        ${bgColor}
        ${borderColor}
        ${className}
      `}
      title={`${label}: ${confidence}%`}
    >
      {showIcon && icon}
      <span>{confidence}%</span>
      {showLabel && <span className="ml-0.5">{label}</span>}
    </motion.div>
  )
}

/**
 * Progress bar variant with confidence visualization
 */
export function ConfidenceBar({
  confidence,
  showPercentage = true,
  height = 'h-2',
  className = '',
}: {
  confidence: number
  showPercentage?: boolean
  height?: string
  className?: string
}) {
  const { level, color, bgColor } = getConfidenceLevel(confidence)

  const barColor =
    level === 'high'
      ? 'bg-green-500'
      : level === 'medium'
      ? 'bg-yellow-500'
      : 'bg-red-500'

  return (
    <div className={className}>
      {showPercentage && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Confidence
          </span>
          <span className={`text-xs font-medium ${color}`}>{confidence}%</span>
        </div>
      )}
      <div
        className={`${height} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full ${barColor} rounded-full`}
        />
      </div>
    </div>
  )
}

/**
 * Detailed confidence breakdown
 */
export function ConfidenceBreakdown({
  confidence,
  sources,
  className = '',
}: {
  confidence: number
  sources?: Array<{
    name: string
    similarity: number
  }>
  className?: string
}) {
  const { level, label, color, bgColor, borderColor } =
    getConfidenceLevel(confidence)

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className={`
          p-3 rounded-lg border
          ${bgColor} ${borderColor}
        `}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${color}`}>{label}</span>
          <ConfidenceBadge confidence={confidence} showIcon />
        </div>

        <ConfidenceBar confidence={confidence} showPercentage={false} />

        {sources && sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Sources ({sources.length}):
            </p>
            <div className="space-y-1">
              {sources.map((source, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                    {source.name}
                  </span>
                  <span className={`font-medium ${color}`}>
                    {Math.round(source.similarity * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Warning message for low confidence
 */
export function LowConfidenceWarning({
  confidence,
  message = "I don't have enough information to answer this accurately. Try rephrasing or upload more documents.",
  className = '',
}: {
  confidence: number
  message?: string
  className?: string
}) {
  if (confidence >= 70) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        p-4 rounded-lg border
        bg-yellow-50 dark:bg-yellow-900/20
        border-yellow-200 dark:border-yellow-700
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
            Low Confidence Response
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">{message}</p>
          <div className="mt-2">
            <ConfidenceBadge confidence={confidence} showLabel size="sm" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Example usage:
 *
 * // Simple badge
 * <ConfidenceBadge confidence={85} />
 * <ConfidenceBadge confidence={65} showLabel />
 * <ConfidenceBadge confidence={45} showIcon={false} />
 *
 * // Progress bar
 * <ConfidenceBar confidence={85} />
 *
 * // Detailed breakdown
 * <ConfidenceBreakdown
 *   confidence={85}
 *   sources={[
 *     { name: 'keto-recipes.pdf', similarity: 0.92 },
 *     { name: 'meal-plans.txt', similarity: 0.78 }
 *   ]}
 * />
 *
 * // Low confidence warning
 * <LowConfidenceWarning confidence={45} />
 */
