/**
 * Password Reset Page
 *
 * Two-step password reset flow:
 * 1. Request reset (enter email) - sends reset link
 * 2. Update password (enter new password) - accessible via reset link
 *
 * The page determines which step to show based on URL parameters
 */

'use client'

import { Suspense, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import AuthForm from '@/components/auth/AuthForm'
import { updatePassword } from '@/lib/auth/actions'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<{
    type: 'error' | 'success'
    text: string
  } | null>(null)

  // Check if user is coming from reset email link
  const isResetMode = searchParams.get('type') === 'recovery'

  // Handle password update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    setMessage(null)

    startTransition(async () => {
      const result = await updatePassword(newPassword)

      if (result?.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({
          type: 'success',
          text: 'Password updated successfully! Redirecting to dashboard...',
        })

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="text-center">
        {!isResetMode ? (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset your password</h1>
            <p className="text-gray-600">
              Enter your email and we'll send you a reset link
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create new password</h1>
            <p className="text-gray-600">
              Enter your new password below
            </p>
          </>
        )}
      </div>

      {/* Reset Flow */}
      {!isResetMode ? (
        // Step 1: Request Reset Link
        <AuthForm mode="reset" />
      ) : (
        // Step 2: Update Password
        <form onSubmit={handlePasswordUpdate} className="space-y-6">
          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="••••••••"
              disabled={isPending}
              minLength={8}
            />
            <p className="mt-1 text-xs text-gray-500">
              Must be at least 8 characters long
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="••••••••"
              disabled={isPending}
              minLength={8}
            />
          </div>

          {/* Error/Success Message */}
          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-green-50 text-green-800 border border-green-200'
              }`}
            >
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isPending ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Updating password...
              </span>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      )}

      {/* Help Text */}
      <div className="pt-6 border-t border-gray-200">
        <div className="space-y-3 text-sm text-gray-600">
          {!isResetMode && (
            <>
              <p className="flex items-start space-x-2">
                <svg
                  className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  We'll send a secure reset link to your email address
                </span>
              </p>
              <p className="flex items-start space-x-2">
                <svg
                  className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  The link will expire in 1 hour for security
                </span>
              </p>
            </>
          )}
          <p className="text-center pt-2">
            <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              ← Back to sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
