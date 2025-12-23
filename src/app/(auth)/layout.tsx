/**
 * Authentication Pages Layout
 *
 * This layout wraps all authentication pages (login, register, reset-password)
 * providing a consistent design with:
 * - Centered form container
 * - Brand logo and tagline
 * - Consistent styling
 * - Responsive design
 */

import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col">
      {/* Header with Logo */}
      <header className="w-full py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center space-x-2">
            <img
              src="/images/logo.jpg"
              alt="MyDistinctAI Logo"
              className="w-12 h-12 rounded-lg object-cover"
            />
            <span className="text-xl font-bold text-gray-900">MyDistinctAI</span>
          </a>
          <a
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            ← Back to home
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Content Container */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {children}
          </div>

          {/* Footer Text */}
          <p className="mt-8 text-center text-xs text-gray-500">
            Protected by AES-256 encryption. GDPR & HIPAA compliant.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          <p>
            © {new Date().getFullYear()} MyDistinctAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
