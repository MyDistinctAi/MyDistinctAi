/**
 * Offline Authentication Cache System
 * Saves encrypted credentials locally using Tauri storage
 * Desktop app only - not used in web app
 */

import { invoke } from '@tauri-apps/api/core'

export interface CachedCredentials {
  email: string
  encryptedPassword: string
  timestamp: number
  userId?: string
  name?: string
}

export interface AuthSession {
  userId: string
  email: string
  name?: string
  accessToken?: string
  expiresAt?: number
}

// Simple offline user data (no encryption needed)
export interface OfflineUser {
  userId: string
  email: string
  name: string
  savedAt: string
}

const CACHE_KEY = 'auth_credentials'
const SESSION_KEY = 'auth_session'
const OFFLINE_USER_KEY = 'offline_user'

// ============ SIMPLE OFFLINE USER SYSTEM ============
// This is the simplest approach - just save user data, no encryption, no Supabase calls

/**
 * Save user for offline access (called after successful online login)
 */
export async function saveOfflineUser(user: {
  id: string
  email: string
  name?: string
}): Promise<void> {
  try {
    const offlineUser: OfflineUser = {
      userId: user.id,
      email: user.email || '',
      name: user.name || user.email?.split('@')[0] || 'User',
      savedAt: new Date().toISOString(),
    }
    await invoke('save_user_data', {
      key: OFFLINE_USER_KEY,
      data: JSON.stringify(offlineUser),
    })
    console.log('✅ Offline user saved:', offlineUser.email)
  } catch (error) {
    console.error('❌ Failed to save offline user:', error)
  }
}

/**
 * Get saved offline user (NO network calls, works 100% offline)
 */
export async function getOfflineUser(): Promise<OfflineUser | null> {
  try {
    const data = await invoke<string>('load_user_data', {
      key: OFFLINE_USER_KEY,
    })
    if (data) {
      const user = JSON.parse(data) as OfflineUser
      console.log('✅ Offline user loaded:', user.email)
      return user
    }
    console.log('ℹ️ No offline user found')
    return null
  } catch (error: unknown) {
    // Handle "key not found" error gracefully
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('Key not found') || errorMessage.includes('not found')) {
      console.log('ℹ️ No offline user saved yet')
      return null
    }
    console.error('❌ Failed to load offline user:', error)
    return null
  }
}

/**
 * Clear offline user (called on logout)
 */
export async function clearOfflineUser(): Promise<void> {
  try {
    await invoke('delete_user_data', { key: OFFLINE_USER_KEY })
    console.log('✅ Offline user cleared')
  } catch (error) {
    console.log('ℹ️ No offline user to clear')
  }
}

/**
 * Check if offline user exists (super fast, no complex logic)
 */
export async function hasOfflineUser(): Promise<boolean> {
  const user = await getOfflineUser()
  return user !== null
}

// ============ END SIMPLE OFFLINE USER SYSTEM ============

/**
 * Save credentials to encrypted local storage
 * Password is encrypted using AES-256-GCM before saving
 */
export async function saveCredentials(
  email: string,
  password: string,
  userId?: string,
  name?: string
): Promise<void> {
  try {
    // Encrypt password using Tauri encryption service
    const encryptedPassword = await invoke<string>('encrypt_data', {
      data: password,
      password: email, // Use email as encryption key
    })

    const credentials: CachedCredentials = {
      email,
      encryptedPassword,
      timestamp: Date.now(),
      userId,
      name,
    }

    // Save to Tauri local storage
    await invoke('save_user_data', {
      key: CACHE_KEY,
      data: JSON.stringify(credentials),
    })

    console.log('✅ Credentials cached successfully')
  } catch (error) {
    console.error('❌ Failed to cache credentials:', error)
    throw error
  }
}

/**
 * Load credentials from encrypted local storage
 * Returns decrypted credentials if found
 */
export async function loadCredentials(): Promise<{
  email: string
  password: string
  userId?: string
  name?: string
} | null> {
  try {
    // Load from Tauri local storage
    const cachedData = await invoke<string>('load_user_data', {
      key: CACHE_KEY,
    })

    if (!cachedData) {
      console.log('ℹ️ No cached credentials found')
      return null
    }

    const credentials: CachedCredentials = JSON.parse(cachedData)

    // Decrypt password using Tauri encryption service
    const password = await invoke<string>('decrypt_data', {
      encrypted: credentials.encryptedPassword,
      password: credentials.email, // Use email as decryption key
    })

    console.log('✅ Credentials loaded successfully')

    return {
      email: credentials.email,
      password,
      userId: credentials.userId,
      name: credentials.name,
    }
  } catch (error: unknown) {
    // Handle "key not found" error gracefully - expected on first launch
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('Key not found') || errorMessage.includes('not found')) {
      console.log('ℹ️ No saved credentials yet (first launch)')
      return null
    }
    console.error('❌ Failed to load credentials:', error)
    return null
  }
}

/**
 * Delete cached credentials (logout)
 */
export async function clearCredentials(): Promise<void> {
  try {
    await invoke('delete_user_data', {
      key: CACHE_KEY,
    })

    await invoke('delete_user_data', {
      key: SESSION_KEY,
    })

    console.log('✅ Credentials cleared')
  } catch (error) {
    console.error('❌ Failed to clear credentials:', error)
  }
}

/**
 * Save session data (after successful login)
 */
export async function saveSession(session: AuthSession): Promise<void> {
  try {
    await invoke('save_user_data', {
      key: SESSION_KEY,
      data: JSON.stringify(session),
    })

    console.log('✅ Session saved')
  } catch (error) {
    console.error('❌ Failed to save session:', error)
  }
}

/**
 * Load saved session
 * For desktop: session NEVER expires - user stays logged in until manual logout
 */
export async function loadSession(): Promise<AuthSession | null> {
  try {
    const sessionData = await invoke<string>('load_user_data', {
      key: SESSION_KEY,
    })

    if (!sessionData) {
      console.log('ℹ️ No session data found')
      return null
    }

    const session: AuthSession = JSON.parse(sessionData)

    // For desktop app: NO expiry check - stay logged in forever until logout
    // This enables true offline operation
    console.log('✅ Session loaded for:', session.email)
    return session
  } catch (error: unknown) {
    // Handle "key not found" error gracefully - this is expected on first launch
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('Key not found') || errorMessage.includes('not found')) {
      console.log('ℹ️ No saved session yet (first launch)')
      return null
    }
    console.error('❌ Failed to load session:', error)
    return null
  }
}

/**
 * Check if credentials are cached (for auto-login)
 */
export async function hasCredentials(): Promise<boolean> {
  try {
    const cachedData = await invoke<string>('load_user_data', {
      key: CACHE_KEY,
    })

    return !!cachedData
  } catch {
    return false
  }
}

/**
 * Auto-login using cached credentials
 * Returns true if login successful, false otherwise
 */
export async function autoLogin(): Promise<{
  success: boolean
  email?: string
  userId?: string
  name?: string
  error?: string
}> {
  try {
    // Check if we have cached credentials
    const hasCreds = await hasCredentials()
    if (!hasCreds) {
      return { success: false, error: 'No cached credentials' }
    }

    // Load credentials
    const credentials = await loadCredentials()
    if (!credentials) {
      return { success: false, error: 'Failed to load credentials' }
    }

    console.log('🔐 Attempting auto-login for:', credentials.email)

    // OFFLINE-FIRST: Always try cached session first (no network call)
    // This ensures offline mode works reliably
    const session = await loadSession()
    if (session) {
      console.log('✅ Using cached session for:', session.email)
      return {
        success: true,
        email: session.email,
        userId: session.userId,
        name: session.name,
      }
    }

    // No cached session - we need to go online
    // Check if we appear to be online before even trying
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('📴 Device appears offline and no cached session')
      return { success: false, error: 'Offline and no cached session. Please connect to internet and login.' }
    }

    // Try to authenticate with Supabase (only if no cached session)
    try {
      console.log('🌐 Attempting online authentication...')
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (authError) {
        console.log('⚠️ Online auth failed:', authError.message)
        return { success: false, error: authError.message }
      }

      if (data.user && data.session) {
        console.log('✅ Online auto-login successful')

        // Save session for future offline use
        await saveSession({
          userId: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name,
          accessToken: data.session.access_token,
          expiresAt: new Date(data.session.expires_at!).getTime(),
        })

        return {
          success: true,
          email: data.user.email!,
          userId: data.user.id,
          name: data.user.user_metadata?.name,
        }
      }
    } catch (networkError) {
      // Network error - this is expected when offline
      console.log('📴 Network error during auth (likely offline):', networkError)
      return { success: false, error: 'Network error. Please check your connection and try again.' }
    }

    return { success: false, error: 'Authentication failed' }
  } catch (error) {
    console.error('❌ Auto-login failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Remember Me functionality
 * Enable/disable credential caching
 */
export async function setRememberMe(enabled: boolean): Promise<void> {
  try {
    await invoke('save_user_data', {
      key: 'remember_me',
      data: enabled ? 'true' : 'false',
    })
  } catch (error) {
    console.error('❌ Failed to set remember me:', error)
  }
}

/**
 * Check if Remember Me is enabled
 */
export async function getRememberMe(): Promise<boolean> {
  try {
    const value = await invoke<string>('load_user_data', {
      key: 'remember_me',
    })

    return value === 'true'
  } catch {
    return false
  }
}

// ============ Token Usage Tracking ============

const TOKEN_USAGE_KEY = 'token_usage'

export interface TokenUsage {
  used: number
  limit: number
  lastSynced: string
  needsRenewal: boolean
}

/**
 * Get current token usage status
 */
export async function getTokenUsage(): Promise<TokenUsage | null> {
  try {
    const data = await invoke<string>('load_user_data', {
      key: TOKEN_USAGE_KEY,
    })
    if (data) {
      return JSON.parse(data) as TokenUsage
    }
    // Return default if not set
    return {
      used: 0,
      limit: 100000,
      lastSynced: new Date().toISOString(),
      needsRenewal: false,
    }
  } catch {
    return null
  }
}

/**
 * Update token usage after using tokens (track locally)
 */
export async function updateTokenUsage(tokensUsed: number): Promise<{
  canContinue: boolean
  used: number
  limit: number
  needsRenewal: boolean
}> {
  try {
    let usage = await getTokenUsage()
    if (!usage) {
      usage = { used: 0, limit: 100000, lastSynced: new Date().toISOString(), needsRenewal: false }
    }

    // Update usage
    usage.used += tokensUsed
    usage.needsRenewal = usage.used >= usage.limit

    // Save updated usage
    await invoke('save_user_data', {
      key: TOKEN_USAGE_KEY,
      data: JSON.stringify(usage),
    })

    return {
      canContinue: !usage.needsRenewal,
      used: usage.used,
      limit: usage.limit,
      needsRenewal: usage.needsRenewal,
    }
  } catch (error) {
    console.error('Failed to update token usage:', error)
    return { canContinue: true, used: 0, limit: 100000, needsRenewal: false }
  }
}

/**
 * Sync token usage with server (requires online connection)
 * Call this when user goes online to get updated limits
 */
export async function syncTokenUsageFromServer(
  newUsed: number,
  newLimit: number
): Promise<void> {
  try {
    const usage: TokenUsage = {
      used: newUsed,
      limit: newLimit,
      lastSynced: new Date().toISOString(),
      needsRenewal: newUsed >= newLimit,
    }

    await invoke('save_user_data', {
      key: TOKEN_USAGE_KEY,
      data: JSON.stringify(usage),
    })
    console.log('✅ Token usage synced from server')
  } catch (error) {
    console.error('Failed to sync token usage:', error)
  }
}

/**
 * Check if user needs to renew (requires going online)
 */
export async function checkNeedsRenewal(): Promise<boolean> {
  const usage = await getTokenUsage()
  return usage?.needsRenewal ?? false
}

/**
 * Reset token usage after renewal (called after successful online renewal)
 */
export async function resetTokenUsageAfterRenewal(newLimit: number): Promise<void> {
  try {
    const usage: TokenUsage = {
      used: 0,
      limit: newLimit,
      lastSynced: new Date().toISOString(),
      needsRenewal: false,
    }

    await invoke('save_user_data', {
      key: TOKEN_USAGE_KEY,
      data: JSON.stringify(usage),
    })
    console.log('✅ Token usage reset after renewal')
  } catch (error) {
    console.error('Failed to reset token usage:', error)
  }
}
