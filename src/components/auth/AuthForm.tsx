'use client'

/**
 * Reusable Authentication Form Component
 *
 * This component provides a flexible authentication form that can be used for:
 * - Login (email + password)
 * - Register (email + password + name + niche)
 * - Reset password (email only)
 *
 * Features:
 * - Form validation with real-time error display
 * - Loading states during submission
 * - Success/error message handling
 * - Magic link option for login
 * - Responsive design
 * - Offline auto-login for desktop app
 */

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp, resetPassword, signInWithMagicLink } from '@/lib/auth/actions'

interface AuthFormProps {
  mode: 'login' | 'register' | 'reset'
  onSuccess?: () => void
}

export default function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showMagicLink, setShowMagicLink] = useState(false)
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false)
  const [offlineMode, setOfflineMode] = useState(false)

  // Ref to track if auto-login was already attempted (prevents infinite loop)
  const autoLoginAttempted = useRef(false)

  // Auto-login attempt for desktop app on mount - SIMPLE VERSION
  useEffect(() => {
    if (mode !== 'login') return

    // CRITICAL: Only attempt auto-login ONCE
    if (autoLoginAttempted.current) {
      return
    }
    autoLoginAttempted.current = true

    const attemptAutoLogin = async () => {
      // Only attempt auto-login in Tauri desktop app
      if (typeof window === 'undefined' || !('__TAURI__' in window)) return

      try {
        setIsAutoLoggingIn(true)

        // Use the SIMPLE offline user system - no network calls, no encryption
        const { getOfflineUser } = await import('@/lib/offline-auth')
        const offlineUser = await getOfflineUser()

        if (offlineUser) {
          console.log('✅ Offline user found:', offlineUser.email)
          setOfflineMode(!navigator.onLine)
          // Redirect to dashboard - user is already "logged in" for desktop
          // Use window.location for more reliable navigation in Tauri
          window.location.href = '/dashboard'
        } else {
          console.log('ℹ️ No offline user, showing login form')
          setIsAutoLoggingIn(false)
        }
      } catch (error) {
        console.error('Auto-login error:', error)
        setIsAutoLoggingIn(false)
      }
    }

    attemptAutoLogin()
  }, [mode])

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    niche: '',
  })

  // Error and success messages
  const [message, setMessage] = useState<{
    type: 'error' | 'success'
    text: string
  } | null>(null)

  // Field-specific errors
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    name?: string
  }>({})

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear field error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
    // Clear general message
    if (message) {
      setMessage(null)
    }
  }

  // Validate form fields
  const validateForm = () => {
    const newErrors: typeof errors = {}

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    // Password validation (not for reset mode)
    if (mode !== 'reset') {
      if (!formData.password) {
        newErrors.password = 'Password is required'
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters'
      }
    }

    // Name validation (register mode only)
    if (mode === 'register' && !formData.name) {
      newErrors.name = 'Name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!validateForm()) {
      return
    }

    setMessage(null)

    startTransition(async () => {
      try {
        let result

        if (mode === 'login') {
          if (showMagicLink) {
            result = await signInWithMagicLink(formData.email)
          } else {
            result = await signIn({
              email: formData.email,
              password: formData.password,
            })
          }
        } else if (mode === 'register') {
          result = await signUp({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            niche: formData.niche || undefined,
          })
        } else if (mode === 'reset') {
          result = await resetPassword(formData.email)
        }

        if (result?.error) {
          setMessage({ type: 'error', text: result.error })
        } else if (result && 'success' in result && result.success) {
          setMessage({ type: 'success', text: result.message || 'Success!' })

          // Clear form on success
          setFormData({ email: '', password: '', name: '', niche: '' })

          // Call success callback if provided
          if (onSuccess) {
            onSuccess()
          }
        }
      } catch (error) {
        // Next.js redirect() throws a special error - don't show error message for redirects
        if (error && typeof error === 'object' && 'digest' in error) {
          // This is a Next.js redirect, which means login was successful
          // Save session and credentials to offline cache for desktop app
          if (typeof window !== 'undefined' && '__TAURI__' in window && mode === 'login') {
            try {
              // Import Supabase client and offline-auth dynamically
              const { createClient } = await import('@/lib/supabase/client')
              const { saveSession, saveCredentials } = await import('@/lib/offline-auth')

              const supabase = createClient()
              const { data: { session } } = await supabase.auth.getSession()

              if (session?.user) {
                // Save simple offline user (this is what auto-login uses)
                const { saveOfflineUser } = await import('@/lib/offline-auth')
                await saveOfflineUser({
                  id: session.user.id,
                  email: session.user.email!,
                  name: session.user.user_metadata?.name,
                })

                // Also save session and credentials (legacy, for backwards compatibility)
                await saveSession({
                  userId: session.user.id,
                  email: session.user.email!,
                  name: session.user.user_metadata?.name,
                  accessToken: session.access_token,
                  expiresAt: new Date(session.expires_at!).getTime(),
                })

                await saveCredentials(
                  formData.email,
                  formData.password,
                  session.user.id,
                  session.user.user_metadata?.name
                )

                console.log('✅ Offline user saved for desktop auto-login')
              }
            } catch (cacheError) {
              console.error('⚠️ Failed to save to offline cache:', cacheError)
              // Don't fail the login if cache save fails
            }
          }

          // Re-throw the redirect error to complete navigation
          throw error
        }
        console.error('Form submission error:', error)
        setMessage({ type: 'error', text: 'An unexpected error occurred' })
      }
    })
  }

  // Show loading state during auto-login attempt
  if (isAutoLoggingIn) {
    return (
      <div className="w-full max-w-md mx-auto text-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <svg
            className="animate-spin h-10 w-10 text-blue-600"
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
          <p className="text-gray-600">Signing you in...</p>
          {offlineMode && (
            <p className="text-sm text-amber-600">Using offline mode</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="you@example.com"
            disabled={isPending}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Password Field (not shown in reset mode or magic link) */}
        {mode !== 'reset' && !showMagicLink && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              required
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="••••••••"
              disabled={isPending}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
            {mode === 'register' && (
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters long
              </p>
            )}
          </div>
        )}

        {/* Name Field (register mode only) */}
        {mode === 'register' && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="John Doe"
              disabled={isPending}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>
        )}

        {/* Niche Field (register mode only) */}
        {mode === 'register' && (
          <div>
            <label htmlFor="niche" className="block text-sm font-medium text-gray-700 mb-2">
              Industry / Niche (Optional)
            </label>
            <select
              id="niche"
              name="niche"
              value={formData.niche}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              disabled={isPending}
            >
              <option value="">Select your industry</option>
              <option value="creators">Content Creators</option>
              <option value="lawyers">Legal / Law Firms</option>
              <option value="healthcare">Healthcare / Medical</option>
              <option value="consulting">Consulting</option>
              <option value="education">Education</option>
              <option value="technology">Technology</option>
              <option value="finance">Finance</option>
              <option value="other">Other</option>
            </select>
          </div>
        )}

        {/* Error/Success Message */}
        {message && (
          <div
            className={`p-4 rounded-lg ${message.type === 'error'
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
              Processing...
            </span>
          ) : (
            <>
              {mode === 'login' && !showMagicLink && 'Sign In'}
              {mode === 'login' && showMagicLink && 'Send Magic Link'}
              {mode === 'register' && 'Create Account'}
              {mode === 'reset' && 'Send Reset Link'}
            </>
          )}
        </button>

        {/* Magic Link Toggle (login mode only) */}
        {mode === 'login' && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowMagicLink(!showMagicLink)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              disabled={isPending}
            >
              {showMagicLink ? 'Use password instead' : 'Sign in with magic link'}
            </button>
          </div>
        )}

        {/* Additional Links */}
        <div className="text-center space-y-2">
          {mode === 'login' && (
            <>
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                  Sign up
                </a>
              </p>
              <p className="text-sm text-gray-600">
                <a href="/reset-password" className="text-blue-600 hover:text-blue-800 font-medium">
                  Forgot password?
                </a>
              </p>
            </>
          )}
          {mode === 'register' && (
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Sign in
              </a>
            </p>
          )}
          {mode === 'reset' && (
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Sign in
              </a>
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
