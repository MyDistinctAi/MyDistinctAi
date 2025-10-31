'use client'

/**
 * Branding Context Provider
 *
 * Provides branding configuration throughout the app
 */

import { createContext, useContext, ReactNode } from 'react'
import type { BrandingConfig } from '@/lib/branding/getBranding'

const BrandingContext = createContext<BrandingConfig | null>(null)

interface BrandingProviderProps {
  children: ReactNode
  branding: BrandingConfig
}

export function BrandingProvider({ children, branding }: BrandingProviderProps) {
  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding(): BrandingConfig {
  const context = useContext(BrandingContext)

  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider')
  }

  return context
}
