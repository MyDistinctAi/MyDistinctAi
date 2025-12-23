'use client'

/**
 * Sign Out Button Component
 *
 * Separated from Header to handle server action in client component
 */

import { LogOut } from 'lucide-react'
import { signOut } from '@/lib/auth/actions'

export function SignOutButton() {
  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
    >
      <LogOut className="h-4 w-4 mr-3" />
      Sign Out
    </button>
  )
}
