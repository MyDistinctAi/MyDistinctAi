/**
 * Onboarding Modal Component
 *
 * Guides new users through the platform features
 */

'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import TourSteps from './TourSteps'

interface OnboardingModalProps {
  onClose: () => void
  onComplete: () => void
}

export default function OnboardingModal({ onClose, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)

  const totalSteps = 5

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    // Mark onboarding as completed when skipped
    localStorage.setItem('onboarding_completed', 'true')
    onClose()
  }

  const handleComplete = async () => {
    setIsCompleting(true)

    // Mark onboarding as completed in localStorage
    localStorage.setItem('onboarding_completed', 'true')

    // Call completion callback
    setTimeout(() => {
      setIsCompleting(false)
      onComplete()
    }, 500)
  }

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex)
  }

  // Prevent scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">Welcome to MyDistinctAI</h2>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {totalSteps}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close onboarding"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-100">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          <TourSteps currentStep={currentStep} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleSkip}
            className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            Skip Tour
          </button>

          {/* Step Indicators */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <button
                key={index}
                onClick={() => handleStepClick(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-blue-600'
                    : index < currentStep
                    ? 'w-2 bg-blue-400'
                    : 'w-2 bg-gray-300'
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={isCompleting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {currentStep === totalSteps - 1 ? (
                <>
                  {isCompleting ? (
                    'Completing...'
                  ) : (
                    <>
                      Complete
                      <Check className="h-5 w-5" />
                    </>
                  )}
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
