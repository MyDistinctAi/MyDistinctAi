'use client'

/**
 * Client-side branding styles component
 * Prevents hydration mismatch by rendering styles only on client
 */

import { useEffect } from 'react'

interface BrandingStylesProps {
  primaryColor: string
  secondaryColor: string
}

export function BrandingStyles({ primaryColor, secondaryColor }: BrandingStylesProps) {
  useEffect(() => {
    // Set CSS variables on mount
    document.documentElement.style.setProperty('--primary-color', primaryColor)
    document.documentElement.style.setProperty('--secondary-color', secondaryColor)
  }, [primaryColor, secondaryColor])

  return null
}
