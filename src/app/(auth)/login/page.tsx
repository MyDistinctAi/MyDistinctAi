/**
 * Login Page
 *
 * User authentication page with support for:
 * - Email/password login
 * - Magic link authentication
 * - Links to register and password reset
 */

import AuthForm from '@/components/auth/AuthForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In | MyDistinctAI',
  description: 'Sign in to your MyDistinctAI account to access your private AI models',
}

export default function LoginPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
        <p className="text-gray-600">
          Sign in to access your private AI models
        </p>
      </div>

      {/* Auth Form */}
      <AuthForm mode="login" />

      {/* Social Proof / Trust Signals */}
      <div className="pt-6 border-t border-gray-200">
        <p className="text-xs text-center text-gray-500 mb-4">
          Trusted by content creators, lawyers, and healthcare professionals
        </p>
        <div className="flex items-center justify-center space-x-6">
          <div className="flex items-center space-x-1 text-xs text-gray-600">
            <svg
              className="w-4 h-4 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>AES-256</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-600">
            <svg
              className="w-4 h-4 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>GDPR</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-600">
            <svg
              className="w-4 h-4 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>HIPAA</span>
          </div>
        </div>
      </div>
    </div>
  )
}
