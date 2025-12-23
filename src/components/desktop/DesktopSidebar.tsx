'use client'

/**
 * Desktop Sidebar Navigation
 * 
 * Sidebar for desktop mode - uses /desktop/* routes
 * No Supabase dependencies
 */

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    Home,
    Brain,
    MessageSquare,
    Database,
    Settings,
    Monitor,
    BarChart3,
    BookOpen
} from 'lucide-react'

const navigation = [
    { name: 'Dashboard', href: '/desktop/dashboard', icon: Home },
    { name: 'Analytics', href: '/desktop/dashboard/analytics', icon: BarChart3 },
    { name: 'My Models', href: '/desktop/dashboard/models', icon: Brain },
    { name: 'Chat', href: '/desktop/dashboard/chat', icon: MessageSquare },
    { name: 'Training Data', href: '/desktop/dashboard/data', icon: Database },
    { name: 'Settings', href: '/desktop/dashboard/settings', icon: Settings },
    { name: 'Documentation', href: '/desktop/dashboard/docs', icon: BookOpen },
]

export default function DesktopSidebar() {
    const pathname = usePathname()

    return (
        <div className="flex h-full w-64 flex-col bg-gray-900">
            {/* Logo */}
            <div className="flex h-16 items-center justify-center border-b border-gray-800 px-6">
                <div className="flex items-center space-x-2">
                    <img
                        src="/images/logo.jpg"
                        alt="MyDistinctAI Logo"
                        className="w-10 h-10 rounded-lg object-cover"
                    />
                    <span className="text-xl font-bold text-white">MyDistinctAI</span>
                </div>
            </div>

            {/* Desktop Mode Indicator */}
            <div className="mx-3 mt-4 px-3 py-2 bg-green-900 border border-green-700 rounded-lg">
                <div className="flex items-center space-x-2">
                    <Monitor className="h-4 w-4 text-green-400" />
                    <span className="text-xs font-medium text-green-200">Desktop Mode - Offline Ready</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`
                group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                ${isActive
                                    ? 'bg-gray-800 text-white'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }
              `}
                        >
                            <Icon
                                className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-300'
                                    }`}
                            />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* Version */}
            <div className="border-t border-gray-800 p-4">
                <div className="text-xs text-gray-500 text-center">
                    Desktop v0.1.0
                </div>
            </div>
        </div>
    )
}
