'use client'

/**
 * Dashboard Sidebar Navigation
 *
 * Provides navigation for the dashboard with:
 * - Active route highlighting
 * - Responsive collapse on mobile
 * - Clean, modern design
 * - Desktop mode indicator
 * - Desktop-specific navigation
 */

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useIsTauri } from '@/hooks/useTauri'
import {
  Home,
  Brain,
  MessageSquare,
  Database,
  Settings,
  BookOpen,
  BarChart3,
  Monitor,
  TestTube
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'My Models', href: '/dashboard/models', icon: Brain },
  { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
  { name: 'Training Data', href: '/dashboard/data', icon: Database },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Documentation', href: '/dashboard/docs', icon: BookOpen },
]

const desktopNavigation = [
  { name: 'Desktop Settings', href: '/desktop/settings', icon: Monitor },
  { name: 'Test Desktop', href: '/test-desktop', icon: TestTube },
]

export default function Sidebar() {
  const pathname = usePathname()
  const isTauri = useIsTauri()

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-800 px-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <span className="text-xl font-bold text-white">MyDistinctAI</span>
        </div>
      </div>

      {/* Desktop Mode Indicator */}
      {isTauri && (
        <div className="mx-3 mt-4 px-3 py-2 bg-blue-900 border border-blue-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <Monitor className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-medium text-blue-200">Desktop Mode</span>
          </div>
        </div>
      )}

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
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-300'
                }`}
              />
              {item.name}
            </Link>
          )
        })}

        {/* Desktop-Only Navigation */}
        {isTauri && (
          <>
            <div className="pt-4 pb-2 px-3">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Desktop
              </div>
            </div>
            {desktopNavigation.map((item) => {
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
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-300'
                    }`}
                  />
                  {item.name}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-800 p-4">
        <div className="text-xs text-gray-500 text-center">
          {isTauri ? 'Desktop v0.1.0' : 'Web v1.0.0'}
        </div>
      </div>
    </div>
  )
}
