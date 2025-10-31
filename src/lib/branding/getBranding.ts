/**
 * Branding Configuration Utility
 *
 * Fetch and manage white-label branding based on domain
 */

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export interface BrandingConfig {
  id?: string
  userId?: string
  domain?: string
  logoUrl: string
  primaryColor: string
  secondaryColor: string
  companyName: string
  faviconUrl?: string
  metaTitle: string
  metaDescription: string
}

// Default MyDistinctAI branding
const DEFAULT_BRANDING: BrandingConfig = {
  logoUrl: '/images/logo.png',
  primaryColor: '#0ea5e9', // sky-500
  secondaryColor: '#64748b', // slate-500
  companyName: 'MyDistinctAI',
  faviconUrl: '/favicon.ico',
  metaTitle: 'MyDistinctAI - Your Private AI Studio',
  metaDescription: 'Build your own GPT - offline, encrypted, and trained on you. Your private AI studio: no code, no cloud, no compromises.',
}

// In-memory cache for branding configs (lasts for duration of server instance)
const brandingCache = new Map<string, { config: BrandingConfig; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get branding configuration based on current domain
 */
export async function getBranding(): Promise<BrandingConfig> {
  try {
    // In development or desktop mode, always use default branding
    if (process.env.NODE_ENV === 'development' || process.env.TAURI_BUILD) {
      return DEFAULT_BRANDING
    }

    const headersList = await headers()
    const host = headersList.get('host') || ''

    // Extract domain (remove port if present)
    const domain = host.split(':')[0]

    // Check if localhost or default domain - use default branding
    if (domain === 'localhost' || domain.includes('localhost') || !domain) {
      return DEFAULT_BRANDING
    }

    // Check cache first
    const cached = brandingCache.get(domain)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.config
    }

    // Fetch from database
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('branding_config')
      .select('*')
      .eq('domain', domain)
      .single()

    if (error || !data) {
      // No custom branding found, use default
      return DEFAULT_BRANDING
    }

    // Map database data to branding config
    const config: BrandingConfig = {
      id: data.id,
      userId: data.user_id,
      domain: data.domain,
      logoUrl: data.logo_url || DEFAULT_BRANDING.logoUrl,
      primaryColor: data.primary_color || DEFAULT_BRANDING.primaryColor,
      secondaryColor: data.secondary_color || DEFAULT_BRANDING.secondaryColor,
      companyName: data.company_name || DEFAULT_BRANDING.companyName,
      faviconUrl: data.favicon_url || DEFAULT_BRANDING.faviconUrl,
      metaTitle: `${data.company_name} - AI Studio` || DEFAULT_BRANDING.metaTitle,
      metaDescription: `${data.company_name}'s private AI platform` || DEFAULT_BRANDING.metaDescription,
    }

    // Update cache
    brandingCache.set(domain, { config, timestamp: Date.now() })

    return config
  } catch (error) {
    console.error('Error fetching branding:', error)
    return DEFAULT_BRANDING
  }
}

/**
 * Get branding configuration for a specific user (for settings page)
 */
export async function getUserBranding(userId: string): Promise<BrandingConfig | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('branding_config')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return {
      id: data.id,
      userId: data.user_id,
      domain: data.domain,
      logoUrl: data.logo_url || DEFAULT_BRANDING.logoUrl,
      primaryColor: data.primary_color || DEFAULT_BRANDING.primaryColor,
      secondaryColor: data.secondary_color || DEFAULT_BRANDING.secondaryColor,
      companyName: data.company_name || DEFAULT_BRANDING.companyName,
      faviconUrl: data.favicon_url,
      metaTitle: `${data.company_name} - AI Studio`,
      metaDescription: `${data.company_name}'s private AI platform`,
    }
  } catch (error) {
    console.error('Error fetching user branding:', error)
    return null
  }
}

/**
 * Update or create branding configuration
 */
export async function updateBranding(
  userId: string,
  config: Partial<BrandingConfig>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Check if branding config already exists
    const { data: existing } = await supabase
      .from('branding_config')
      .select('id')
      .eq('user_id', userId)
      .single()

    const brandingData = {
      user_id: userId,
      domain: config.domain,
      logo_url: config.logoUrl,
      primary_color: config.primaryColor,
      secondary_color: config.secondaryColor,
      company_name: config.companyName,
      favicon_url: config.faviconUrl,
    }

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('branding_config')
        .update(brandingData)
        .eq('id', existing.id)

      if (error) {
        return { success: false, error: error.message }
      }
    } else {
      // Create new
      const { error } = await supabase
        .from('branding_config')
        .insert(brandingData)

      if (error) {
        return { success: false, error: error.message }
      }
    }

    // Clear cache for this domain if it exists
    if (config.domain) {
      brandingCache.delete(config.domain)
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating branding:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Clear branding cache (useful for development/testing)
 */
export function clearBrandingCache(domain?: string) {
  if (domain) {
    brandingCache.delete(domain)
  } else {
    brandingCache.clear()
  }
}

export { DEFAULT_BRANDING }
