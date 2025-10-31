import type { Metadata } from 'next'
import './globals.css'
import { getBranding } from '@/lib/branding/getBranding'
import { BrandingProvider } from '@/components/BrandingProvider'

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
      <head>
        <style
          id="branding-vars"
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --primary-color: ${branding.primaryColor};
                --secondary-color: ${branding.secondaryColor};
              }
            `
          }}
        />
      </head>
      <body suppressHydrationWarning className="antialiased">
        <BrandingProvider branding={branding}>
          {children}
        </BrandingProvider>
      </body>
    </html>
  )
}
