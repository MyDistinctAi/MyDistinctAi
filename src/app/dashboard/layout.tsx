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
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          user={{
            name: profile?.name,
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
