/**
 * Registration Page
 *
 * New user sign-up page that collects:
 * - Email address
 * - Password
 * - Full name
 * - Industry/niche (optional)
 *
 * Creates both authentication user and profile record
 */

import AuthForm from '@/components/auth/AuthForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account | MyDistinctAI',
  description: 'Create your MyDistinctAI account and start building your private AI models',
}

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
        <p className="text-gray-600">
          Start building your private AI in minutes
        </p>
      </div>

      {/* Auth Form */}
      <AuthForm mode="register" />

      {/* Features List */}
      <div className="pt-6 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-700 mb-3 text-center">
          What you'll get:
        </p>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-green-500 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Train AI models on your own data</span>
          </li>
          <li className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-green-500 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>100% private & encrypted</span>
          </li>
          <li className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-green-500 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>White-label branding included</span>
          </li>
          <li className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-green-500 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>No credit card required</span>
          </li>
        </ul>
      </div>

      {/* Terms and Privacy */}
      <div className="pt-4">
        <p className="text-xs text-center text-gray-500">
          By creating an account, you agree to our{' '}
          <a href="/terms" className="text-blue-600 hover:text-blue-800 underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}
