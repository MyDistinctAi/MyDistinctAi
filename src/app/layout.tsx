import type { Metadata } from 'next'
import './globals.css'
import { getBranding } from '@/lib/branding/getBranding'
import { BrandingProvider } from '@/components/BrandingProvider'
import { BrandingStyles } from '@/components/BrandingStyles'

// Force dynamic rendering for this layout
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getBranding()

  return {
    title: branding.metaTitle,
    description: branding.metaDescription,
    icons: {
      icon: branding.faviconUrl || '/favicon.ico',
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const branding = await getBranding()

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="antialiased">
        <BrandingStyles 
          primaryColor={branding.primaryColor}
          secondaryColor={branding.secondaryColor}
        />
        <BrandingProvider branding={branding}>
          {children}
        </BrandingProvider>
      </body>
    </html>
  )
}
