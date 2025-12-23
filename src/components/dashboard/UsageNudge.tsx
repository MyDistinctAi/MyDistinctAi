'use client'

/**
 * UsageNudge Component
 * Displays inline banner notifications when users reach usage thresholds (50%, 80%, 90%)
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, TrendingUp, Zap, X } from 'lucide-react'
import Link from 'next/link'
import type { NudgeLevel } from '@/lib/usage-tracking'

interface UsageNudgeProps {
  nudge: NudgeLevel
  tokensUsed: number
  monthlyCap: number
  onDismiss?: () => void
  onUpgradeClick?: () => void
}

export function UsageNudge({
  nudge,
  tokensUsed,
  monthlyCap,
  onDismiss,
  onUpgradeClick,
}: UsageNudgeProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  const getIcon = () => {
    switch (nudge.threshold) {
      case 50:
        return <TrendingUp className="w-5 h-5" />
      case 80:
        return <AlertCircle className="w-5 h-5" />
      case 90:
        return <Zap className="w-5 h-5" />
      default:
        return <AlertCircle className="w-5 h-5" />
    }
  }

  const getBgColor = () => {
    switch (nudge.urgency) {
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800'
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800'
    }
  }

  const getTextColor = () => {
    switch (nudge.urgency) {
      case 'info':
        return 'text-blue-900 dark:text-blue-100'
      case 'warning':
        return 'text-yellow-900 dark:text-yellow-100'
      case 'error':
        return 'text-red-900 dark:text-red-100'
      default:
        return 'text-gray-900 dark:text-gray-100'
    }
  }

  const getButtonColor = () => {
    switch (nudge.urgency) {
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white'
      case 'warning':
        return 'bg-primary-500 hover:bg-primary-600 text-white'
      case 'error':
        return 'bg-primary-500 hover:bg-primary-600 text-white'
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white'
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            ...(nudge.showAnimation && {
              boxShadow: [
                '0 0 0 0 rgba(46, 204, 113, 0)',
                '0 0 0 10px rgba(46, 204, 113, 0.1)',
                '0 0 0 0 rgba(46, 204, 113, 0)',
              ],
            }),
          }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{
            duration: 0.3,
            boxShadow: {
              repeat: nudge.showAnimation ? Infinity : 0,
              duration: 2,
            },
          }}
          className={`relative rounded-lg border-2 p-4 shadow-sm ${getBgColor()}`}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`flex-shrink-0 ${getTextColor()}`}>
              {getIcon()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-semibold mb-1 ${getTextColor()}`}>
                {nudge.title}
              </h3>
              <p className={`text-sm ${getTextColor()} opacity-90`}>
                {nudge.message}
              </p>

              {/* Progress indicator */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`font-medium ${getTextColor()}`}>
                    {tokensUsed.toLocaleString()} / {monthlyCap.toLocaleString()} tokens
                  </span>
                  <span className={`font-bold ${getTextColor()}`}>
                    {nudge.threshold}%
                  </span>
                </div>
                <div className="w-full bg-white dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${nudge.threshold}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full ${
                      nudge.urgency === 'error'
                        ? 'bg-red-500'
                        : nudge.urgency === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                    }`}
                  />
                </div>
              </div>

              {/* CTA Button */}
              <div className="mt-3 flex items-center gap-2">
                <Link
                  href="/pricing"
                  onClick={onUpgradeClick}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${getButtonColor()}`}
                >
                  {nudge.threshold === 90 ? 'Secure More Tokens' : nudge.threshold === 80 ? 'Upgrade Now' : 'Upgrade Plan'}
                  <TrendingUp className="w-4 h-4" />
                </Link>
                {nudge.threshold === 50 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    (subtle reminder)
                  </span>
                )}
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              className={`flex-shrink-0 ${getTextColor()} opacity-50 hover:opacity-100 transition-opacity`}
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * UsageWidget Component
 * Compact usage display for dashboard sidebar or header
 */
interface UsageWidgetProps {
  tokensUsed: number
  monthlyCap: number
  planName: string
  showUpgrade?: boolean
}

export function UsageWidget({
  tokensUsed,
  monthlyCap,
  planName,
  showUpgrade = true,
}: UsageWidgetProps) {
  const usagePercentage = monthlyCap > 0 ? (tokensUsed / monthlyCap) * 100 : 0
  const isUnlimited = monthlyCap === -1

  const getProgressColor = () => {
    if (usagePercentage >= 90) return 'bg-red-500'
    if (usagePercentage >= 80) return 'bg-yellow-500'
    return 'bg-primary-500'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Monthly Usage
        </h3>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
          {planName}
        </span>
      </div>

      {isUnlimited ? (
        <div className="text-center py-4">
          <p className="text-lg font-bold text-primary-500">Unlimited</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            No token limits on Enterprise
          </p>
        </div>
      ) : (
        <>
          <div className="mb-2">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {tokensUsed.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                / {monthlyCap.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              tokens used this month
            </p>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(usagePercentage, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full ${getProgressColor()}`}
            />
          </div>

          {showUpgrade && usagePercentage >= 50 && (
            <Link
              href="/pricing"
              className="block w-full text-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-md transition-colors"
            >
              Upgrade Plan
            </Link>
          )}
        </>
      )}
    </div>
  )
}
