'use client'

import { useState } from 'react'
import { DesktopSplashScreen } from '@/components/DesktopSplashScreen'
import { getOfflineUser } from '@/lib/offline-auth'

/**
 * Desktop Startup Page
 *
 * This page is shown when the desktop app first launches.
 * It displays a professional splash screen with animated progress steps.
 *
 * After startup completes:
 * - If offline user cached → go directly to dashboard (skips login, works offline)
 * - If no offline user → redirect to /login (manual login required)
 */
export default function DesktopStartupPage() {
  const [startupComplete, setStartupComplete] = useState(false)

  const handleStartupComplete = async () => {
    setStartupComplete(true)

    try {
      // Check for cached offline user
      const user = await getOfflineUser()
      if (user) {
        console.log('✅ Found cached offline user:', user.email)
        window.location.href = '/desktop/dashboard'
      } else {
        console.log('ℹ️ No cached offline user, redirecting to login')
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Error checking offline user:', error)
      // On any error, go to login
      window.location.href = '/login'
    }
  }

  return (
    <div className="min-h-screen">
      {!startupComplete && (
        <DesktopSplashScreen onComplete={handleStartupComplete} />
      )}
    </div>
  )
}
