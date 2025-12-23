'use client'

import { useEffect, useState } from 'react'
import { useIsTauri } from '@/hooks/useTauri'
import { DesktopOnboarding } from './DesktopOnboarding'

export function DesktopOnboardingWrapper() {
  const isTauri = useIsTauri()
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (isTauri) {
      const completed = localStorage.getItem('desktop_onboarding_completed')
      setShowOnboarding(completed !== 'true')
    }
  }, [isTauri])

  if (!isTauri || !showOnboarding) {
    return null
  }

  return <DesktopOnboarding />
}
