/**
 * Dashboard Layout
 *
 * Wraps all dashboard pages with:
 * - Sidebar navigation
 * - Header with user menu
 * - Authentication check
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import Header from '@/components/dashboard/Header'
import OnboardingWrapper from '@/components/onboarding/OnboardingWrapper'
import { DesktopOnboardingWrapper } from '@/components/desktop/DesktopOnboardingWrapper'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user = null
  let profile = null

  try {
    const supabase = await createClient()

    // Check authentication
    const { data: userData } = await supabase.auth.getUser()
    user = userData?.user

    if (!user) {
      // No user from Supabase - check if this might be desktop offline mode
      // For server components, we can't check __TAURI__, so we just redirect
      // The client-side auto-login will handle desktop offline users
      redirect('/login')
    }

    // Get user profile
    const { data: profileData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    profile = profileData
  } catch (error) {
    console.error('❌ Dashboard auth error (offline?):', error)
    // If Supabase fails (likely offline), redirect to login
    // The client-side will handle auto-login for desktop
    redirect('/login')
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          user={{
            name: (profile as unknown as { name?: string })?.name,
            email: user.email,
          }}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Onboarding Modal (shows for first-time users) */}
      <OnboardingWrapper />

      {/* Desktop Onboarding (shows for first-time desktop users) */}
      <DesktopOnboardingWrapper />
    </div>
  )
}
