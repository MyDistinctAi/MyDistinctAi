'use client'

/**
 * Desktop Dashboard Layout
 * Client-side only layout for desktop app - no Supabase dependencies
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getOfflineUser, clearOfflineUser, type OfflineUser } from '@/lib/offline-auth'
import DesktopSidebar from '@/components/desktop/DesktopSidebar'
import { LogOut, User } from 'lucide-react'

export default function DesktopDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [user, setUser] = useState<OfflineUser | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadUser = async () => {
            try {
                const offlineUser = await getOfflineUser()
                if (offlineUser) {
                    setUser(offlineUser)
                    setLoading(false)
                } else {
                    // No offline user - redirect to login
                    window.location.href = '/login'
                }
            } catch (error) {
                console.error('Failed to load offline user:', error)
                window.location.href = '/login'
            }
        }
        loadUser()
    }, [])

    const handleLogout = async () => {
        await clearOfflineUser()
        window.location.href = '/login'
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="h-screen flex overflow-hidden bg-gray-50">
            {/* Desktop Sidebar */}
            <DesktopSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Desktop Header */}
                <header className="bg-white shadow-sm border-b border-gray-200">
                    <div className="px-6 py-4 flex items-center justify-between">
                        <h1 className="text-lg font-semibold text-gray-900">
                            Welcome, {user.name || user.email}
                        </h1>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <User className="w-4 h-4" />
                                <span>{user.email}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                {/* Desktop Mode Banner */}
                <div className="bg-green-50 border-b border-green-200">
                    <div className="px-6 py-2 flex items-center gap-2 text-sm text-green-800">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="font-medium">Desktop Mode - All data stored locally</span>
                        {typeof navigator !== 'undefined' && !navigator.onLine && (
                            <>
                                <span className="mx-2">•</span>
                                <span className="text-yellow-700 font-medium">Offline</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
