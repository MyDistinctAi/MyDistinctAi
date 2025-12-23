'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react'
import {
  saveCredentials,
  loadCredentials,
  autoLogin,
  hasCredentials,
  setRememberMe,
  getRememberMe,
  saveSession
} from '@/lib/offline-auth'

export default function DesktopLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMeState] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAutoLogin, setIsAutoLogin] = useState(true)

  // Environment check - runs on component mount
  useEffect(() => {
    console.log('=== DESKTOP LOGIN PAGE LOADED ===')
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    console.log('Supabase Key (first 10 chars):', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10))
    console.log('================================')
  }, [])

  // Try auto-login on mount
  useEffect(() => {
    const tryAutoLogin = async () => {
      try {
        const hasCreds = await hasCredentials()

        if (!hasCreds) {
          setIsAutoLogin(false)
          return
        }

        console.log('🔐 Auto-login attempt...')
        const result = await autoLogin()

        if (result.success) {
          console.log('✅ Auto-login successful:', result.email)
          // Redirect to main app
          router.push('/desktop-app')
        } else {
          console.log('❌ Auto-login failed:', result.error)
          // Load email for convenience
          const creds = await loadCredentials()
          if (creds) {
            setEmail(creds.email)
          }
          setIsAutoLogin(false)
        }
      } catch (error) {
        console.error('Auto-login error:', error)
        setIsAutoLogin(false)
      }
    }

    tryAutoLogin()
  }, [router])

  // Load Remember Me setting
  useEffect(() => {
    getRememberMe().then(setRememberMeState)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    console.log('🎯 handleLogin called')
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      console.log('📝 Starting login process...')

      // Basic validation
      if (!email || !password) {
        throw new Error('Please enter your email and password')
      }

      console.log('🔐 Authenticating with Supabase:', email)
      console.log('📍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('🔑 Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

      // Authenticate with Supabase
      console.log('📦 Importing Supabase client...')
      const { createClient } = await import('@supabase/supabase-js')
      console.log('✅ Supabase import successful')

      console.log('🏗️ Creating Supabase client...')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      console.log('✅ Supabase client created')

      console.log('📡 Calling Supabase signInWithPassword...')
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('📬 Supabase response:', {
        hasData: !!data,
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: authError?.message
      })

      if (authError) {
        console.error('❌ Supabase auth error:', authError)
        throw new Error(authError.message)
      }

      if (!data.user || !data.session) {
        console.error('❌ No user or session in response')
        throw new Error('Authentication failed')
      }

      console.log('✅ Supabase authentication successful')

      // Save session for offline use
      console.log('💾 Saving session...')
      await saveSession({
        userId: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name,
        accessToken: data.session.access_token,
        expiresAt: new Date(data.session.expires_at!).getTime(),
      })
      console.log('✅ Session saved')

      // Save credentials if Remember Me is checked
      if (rememberMe) {
        console.log('💾 Saving credentials for auto-login...')
        await saveCredentials(email, password, data.user.id, data.user.user_metadata?.name)
        await setRememberMe(true)
        console.log('✅ Credentials saved for auto-login')
      } else {
        await setRememberMe(false)
      }

      // Redirect to main app
      console.log('🚀 Redirecting to /desktop-app...')
      router.push('/desktop-app')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      console.error('❌ Login error:', err)
      console.error('❌ Error stack:', err instanceof Error ? err.stack : 'No stack trace')
      setError(errorMessage)
      alert('Login Error: ' + errorMessage) // Show error in alert for debugging
    } finally {
      console.log('🏁 Login process completed')
      setIsLoading(false)
    }
  }

  // Show loading during auto-login
  if (isAutoLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Auto-login in progress...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/images/logo.jpg"
            alt="MyDistinctAI Logo"
            className="w-20 h-20 mx-auto mb-4 rounded-xl object-cover"
          />
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">Sign in to your offline AI studio</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMeState(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900/50 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                disabled={isLoading}
              />
              <label htmlFor="remember-me" className="ml-2 text-sm text-slate-300">
                Remember me (auto-login next time)
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg shadow-blue-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Offline Notice */}
            <div className="text-center pt-4 border-t border-slate-700/50">
              <p className="text-xs text-slate-500">
                🔒 This is an offline-first app. Your credentials are stored locally and encrypted with AES-256.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-500">
            Desktop version • No internet required
          </p>
        </div>
      </div>
    </div>
  )
}
