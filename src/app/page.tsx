'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/landing/Navigation'
import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { AudienceTabs } from '@/components/landing/AudienceTabs'
import { WaitlistForm } from '@/components/landing/WaitlistForm'
import { Footer } from '@/components/landing/Footer'

export default function Home() {
  const router = useRouter()
  const [isTauri, setIsTauri] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check if running in Tauri (desktop app)
    const checkTauri = () => {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        setIsTauri(true)
        // Redirect to login page in desktop mode
        router.push('/login')
      } else {
        setIsChecking(false)
      }
    }

    checkTauri()
  }, [router])

  // Don't render landing page in Tauri mode or while checking
  if (isChecking || isTauri) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading MyDistinctAI...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <section id="features">
        <Features />
      </section>
      <section id="how-it-works">
        <HowItWorks />
      </section>
      <section id="use-cases">
        <AudienceTabs />
      </section>
      <WaitlistForm />
      <Footer />
    </main>
  )
}
