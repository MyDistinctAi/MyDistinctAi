/**
 * Onboarding Wrapper Component
 *
 * Client component that manages onboarding state and displays modal for first-time users
 */

'use client'

import { useState, useEffect } from 'react'
import OnboardingModal from './OnboardingModal'

export default function OnboardingWrapper() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Check if onboarding has been completed
    const onboardingCompleted = localStorage.getItem('onboarding_completed')

    if (!onboardingCompleted) {
      // Show onboarding after a brief delay for better UX
      setTimeout(() => {
        setShowOnboarding(true)
      }, 500)
    }

    setIsReady(true)
  }, [])

  const handleClose = () => {
    setShowOnboarding(false)
  }

  const handleComplete = () => {
    setShowOnboarding(false)
    // Optional: Show success toast or redirect
  }

  // Don't render anything until client-side check is complete
  if (!isReady) {
    return null
  }

  if (!showOnboarding) {
    return null
  }

  return <OnboardingModal onClose={handleClose} onComplete={handleComplete} />
}
