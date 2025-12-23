'use server'

/**
 * Authentication Server Actions
 *
 * This file contains all server-side authentication operations using Supabase Auth.
 * These actions are called from client components and handle:
 * - User registration with profile creation
 * - Email/password login
 * - Magic link authentication
 * - Password reset flow
 * - Logout functionality
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * Register a new user with email and password
 * Creates both auth user and profile record in users table
 */
export async function signUp(formData: {
  email: string
  password: string
  name: string
  niche?: string
}) {
  const supabase = await createClient()

  // Validate input
  if (!formData.email || !formData.password || !formData.name) {
    return { error: 'Email, password, and name are required' }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.email)) {
    return { error: 'Invalid email format' }
  }

  // Validate password strength (min 8 characters)
  if (formData.password.length < 8) {
    return { error: 'Password must be at least 8 characters long' }
  }

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.name,
          niche: formData.niche,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (authError) {
      console.error('Auth signup error:', authError.message)
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: 'Failed to create user account' }
    }

    // Create user profile in users table using admin client
    // We use the admin client here because the user session isn't established yet
    // and RLS would block the insert
    const adminClient = createAdminClient()
    const { error: profileError } = await adminClient.from('users').insert({
      id: authData.user.id,
      email: formData.email,
      name: formData.name,
      niche: formData.niche || null,
      subscription_status: 'free',
    })

    if (profileError) {
      console.error('Profile creation error:', profileError.message)
      console.error('Profile error details:', JSON.stringify(profileError, null, 2))
      console.error('Profile error code:', profileError.code)
      console.error('Attempted to insert user with ID:', authData.user.id)
      // Note: Auth user is already created, but profile failed
      // Common causes: table doesn't exist, column mismatch, RLS policy issue
      return {
        error: `Account created but profile setup failed: ${profileError.message}. Error code: ${profileError.code || 'unknown'}. Please contact support or check if the database migration has been run.`
      }
    }

    return {
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.'
    }
  } catch (error) {
    console.error('Signup error:', error)
    return { error: 'An unexpected error occurred during signup' }
  }
}

/**
 * Sign in user with email and password
 */
export async function signIn(formData: {
  email: string
  password: string
}) {
  const supabase = await createClient()

  // Validate input
  if (!formData.email || !formData.password) {
    return { error: 'Email and password are required' }
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    if (error) {
      console.error('Sign in error:', error.message)
      return { error: 'Invalid email or password' }
    }

    if (!data.user) {
      return { error: 'Login failed. Please try again.' }
    }

    // Revalidate paths
    revalidatePath('/', 'layout')

    // Redirect to dashboard (this throws an error to perform navigation)
    redirect('/dashboard')
  } catch (error) {
    // Next.js redirect() throws an error to perform the redirect
    // We need to check if it's a redirect error and re-throw it
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error
    }
    console.error('Sign in error:', error)
    return { error: 'An unexpected error occurred during sign in' }
  }
}

/**
 * Sign in with magic link (passwordless)
 */
export async function signInWithMagicLink(email: string) {
  const supabase = await createClient()

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Invalid email format' }
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) {
      console.error('Magic link error:', error.message)
      return { error: error.message }
    }

    return {
      success: true,
      message: 'Check your email for the magic link!'
    }
  } catch (error) {
    console.error('Magic link error:', error)
    return { error: 'Failed to send magic link. Please try again.' }
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
  const supabase = await createClient()

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Invalid email format' }
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    })

    if (error) {
      console.error('Password reset error:', error.message)
      return { error: error.message }
    }

    return {
      success: true,
      message: 'Password reset instructions sent to your email'
    }
  } catch (error) {
    console.error('Password reset error:', error)
    return { error: 'Failed to send reset email. Please try again.' }
  }
}

/**
 * Update user password (after reset)
 */
export async function updatePassword(newPassword: string) {
  const supabase = await createClient()

  // Validate password strength
  if (newPassword.length < 8) {
    return { error: 'Password must be at least 8 characters long' }
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      console.error('Password update error:', error.message)
      return { error: error.message }
    }

    return {
      success: true,
      message: 'Password updated successfully!'
    }
  } catch (error) {
    console.error('Password update error:', error)
    return { error: 'Failed to update password. Please try again.' }
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Sign out error:', error.message)
      return { error: error.message }
    }

    // Revalidate and redirect
    revalidatePath('/', 'layout')
    redirect('/login')
  } catch (error) {
    // Next.js redirect() throws an error to perform the redirect
    // We need to check if it's a redirect error and re-throw it
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error
    }
    console.error('Sign out error:', error)
    return { error: 'Failed to sign out. Please try again.' }
  }
}

/**
 * Get current user session
 */
export async function getSession() {
  const supabase = await createClient()

  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Get session error:', error.message)
      return { session: null }
    }

    return { session }
  } catch (error) {
    console.error('Get session error:', error)
    return { session: null }
  }
}

/**
 * Get current user profile
 */
export async function getUserProfile() {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { user: null, profile: null }
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Get profile error:', profileError.message)
      return { user, profile: null }
    }

    return { user, profile }
  } catch (error) {
    console.error('Get user profile error:', error)
    return { user: null, profile: null }
  }
}
