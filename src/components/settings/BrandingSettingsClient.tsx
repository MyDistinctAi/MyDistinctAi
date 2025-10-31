'use client'

/**
 * Branding Settings Client Component
 *
 * Allows users to configure white-label branding
 */

import { useState, useRef, ChangeEvent, FormEvent } from 'react'
import Image from 'next/image'
import type { BrandingConfig } from '@/lib/branding/getBranding'

interface BrandingSettingsClientProps {
  initialBranding: BrandingConfig | null
  userId: string
}

export default function BrandingSettingsClient({
  initialBranding,
  userId,
}: BrandingSettingsClientProps) {
  const [branding, setBranding] = useState<Partial<BrandingConfig>>(
    initialBranding || {
      logoUrl: '',
      primaryColor: '#0ea5e9',
      secondaryColor: '#64748b',
      companyName: '',
      domain: '',
      faviconUrl: '',
    }
  )
  const [logoPreview, setLogoPreview] = useState<string>(
    initialBranding?.logoUrl || ''
  )
  const [faviconPreview, setFaviconPreview] = useState<string>(
    initialBranding?.faviconUrl || ''
  )
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [showDnsModal, setShowDnsModal] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  // Handle logo file selection
  const handleLogoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file' })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Logo must be less than 2MB' })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to Supabase Storage
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId)
      formData.append('type', 'logo')

      const response = await fetch('/api/upload-branding', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setBranding((prev) => ({ ...prev, logoUrl: data.url }))
      setMessage({ type: 'success', text: 'Logo uploaded successfully' })
    } catch (error) {
      console.error('Logo upload error:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to upload logo',
      })
    }
  }

  // Handle favicon file selection
  const handleFaviconChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file' })
      return
    }

    // Validate file size (max 1MB)
    if (file.size > 1 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Favicon must be less than 1MB' })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setFaviconPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to Supabase Storage
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId)
      formData.append('type', 'favicon')

      const response = await fetch('/api/upload-branding', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setBranding((prev) => ({ ...prev, faviconUrl: data.url }))
      setMessage({ type: 'success', text: 'Favicon uploaded successfully' })
    } catch (error) {
      console.error('Favicon upload error:', error)
      setMessage({
        type: 'error',
        text:
          error instanceof Error ? error.message : 'Failed to upload favicon',
      })
    }
  }

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/branding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...branding,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save branding')
      }

      setMessage({ type: 'success', text: 'Branding settings saved successfully!' })

      // Clear cache and reload after 1 second
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Save error:', error)
      setMessage({
        type: 'error',
        text:
          error instanceof Error ? error.message : 'Failed to save branding',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            White-Label Branding
          </h1>
          <p className="mt-2 text-gray-600">
            Customize your platform's appearance with your own branding
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Settings Column */}
            <div className="space-y-6">
              {/* Logo Upload */}
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Logo
                </h2>
                <p className="mb-4 text-sm text-gray-600">
                  Upload your company logo (recommended: 200x50px, max 2MB)
                </p>

                <div className="space-y-4">
                  {logoPreview && (
                    <div className="relative h-16 w-48 overflow-hidden rounded border border-gray-200 bg-white p-2">
                      <Image
                        src={logoPreview}
                        alt="Logo preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}

                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {logoPreview ? 'Change Logo' : 'Upload Logo'}
                  </button>
                </div>
              </div>

              {/* Favicon Upload */}
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Favicon
                </h2>
                <p className="mb-4 text-sm text-gray-600">
                  Upload your favicon (recommended: 32x32px or 64x64px, max 1MB)
                </p>

                <div className="space-y-4">
                  {faviconPreview && (
                    <div className="relative h-8 w-8 overflow-hidden rounded border border-gray-200 bg-white">
                      <Image
                        src={faviconPreview}
                        alt="Favicon preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}

                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFaviconChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => faviconInputRef.current?.click()}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {faviconPreview ? 'Change Favicon' : 'Upload Favicon'}
                  </button>
                </div>
              </div>

              {/* Colors */}
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Brand Colors
                </h2>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="primaryColor"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Primary Color
                    </label>
                    <div className="mt-1 flex items-center space-x-3">
                      <input
                        type="color"
                        id="primaryColor"
                        value={branding.primaryColor || '#0ea5e9'}
                        onChange={(e) =>
                          setBranding((prev) => ({
                            ...prev,
                            primaryColor: e.target.value,
                          }))
                        }
                        className="h-10 w-20 cursor-pointer rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={branding.primaryColor || '#0ea5e9'}
                        onChange={(e) =>
                          setBranding((prev) => ({
                            ...prev,
                            primaryColor: e.target.value,
                          }))
                        }
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        placeholder="#0ea5e9"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="secondaryColor"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Secondary Color
                    </label>
                    <div className="mt-1 flex items-center space-x-3">
                      <input
                        type="color"
                        id="secondaryColor"
                        value={branding.secondaryColor || '#64748b'}
                        onChange={(e) =>
                          setBranding((prev) => ({
                            ...prev,
                            secondaryColor: e.target.value,
                          }))
                        }
                        className="h-10 w-20 cursor-pointer rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={branding.secondaryColor || '#64748b'}
                        onChange={(e) =>
                          setBranding((prev) => ({
                            ...prev,
                            secondaryColor: e.target.value,
                          }))
                        }
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        placeholder="#64748b"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Info */}
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Company Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="companyName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Company Name
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      value={branding.companyName || ''}
                      onChange={(e) =>
                        setBranding((prev) => ({
                          ...prev,
                          companyName: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      placeholder="Your Company Name"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="domain"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Custom Domain
                    </label>
                    <input
                      type="text"
                      id="domain"
                      value={branding.domain || ''}
                      onChange={(e) =>
                        setBranding((prev) => ({
                          ...prev,
                          domain: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      placeholder="app.yourcompany.com"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDnsModal(true)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-500"
                    >
                      View DNS Setup Instructions
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Column */}
            <div className="space-y-6">
              <div className="sticky top-8">
                <div className="rounded-lg bg-white p-6 shadow">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    Live Preview
                  </h2>

                  {/* Preview Box */}
                  <div
                    className="rounded-lg border-2 border-gray-200 p-8"
                    style={{
                      backgroundColor: branding.primaryColor
                        ? `${branding.primaryColor}10`
                        : '#f0f9ff',
                    }}
                  >
                    {/* Logo Preview */}
                    {logoPreview && (
                      <div className="mb-6 flex justify-center">
                        <div className="relative h-12 w-48">
                          <Image
                            src={logoPreview}
                            alt="Logo"
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>
                    )}

                    {/* Company Name */}
                    <h3
                      className="mb-4 text-center text-2xl font-bold"
                      style={{ color: branding.primaryColor || '#0ea5e9' }}
                    >
                      {branding.companyName || 'Your Company Name'}
                    </h3>

                    {/* Sample Button */}
                    <button
                      type="button"
                      className="w-full rounded-lg px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
                      style={{
                        backgroundColor: branding.primaryColor || '#0ea5e9',
                      }}
                    >
                      Primary Button
                    </button>

                    {/* Sample Text */}
                    <p
                      className="mt-4 text-center text-sm"
                      style={{
                        color: branding.secondaryColor || '#64748b',
                      }}
                    >
                      Secondary text color preview
                    </p>

                    {/* Domain Preview */}
                    {branding.domain && (
                      <p className="mt-4 text-center text-xs text-gray-500">
                        https://{branding.domain}
                      </p>
                    )}
                  </div>

                  <p className="mt-4 text-sm text-gray-600">
                    This preview shows how your branding will appear throughout
                    the platform.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div
              className={`mt-6 rounded-md p-4 ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Branding Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* DNS Instructions Modal */}
      {showDnsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                DNS Setup Instructions
              </h3>
              <button
                onClick={() => setShowDnsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-600">
              <p>
                To use a custom domain with your white-labeled platform, you'll
                need to configure DNS records with your domain provider.
              </p>

              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="mb-2 font-semibold text-gray-900">
                  Step 1: Add CNAME Record
                </h4>
                <p className="mb-2">
                  Add a CNAME record pointing your subdomain to our platform:
                </p>
                <div className="rounded bg-gray-900 p-3 font-mono text-xs text-green-400">
                  <div>Type: CNAME</div>
                  <div>Name: app (or your subdomain)</div>
                  <div>Value: mydistinctai.vercel.app</div>
                  <div>TTL: 3600</div>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="mb-2 font-semibold text-gray-900">
                  Step 2: Verify Domain
                </h4>
                <p>
                  After adding the DNS record, it may take up to 48 hours to
                  propagate. Once configured, save your branding settings with
                  the custom domain above.
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <h4 className="mb-2 font-semibold text-blue-900">
                  Need Help?
                </h4>
                <p className="text-blue-800">
                  Contact our support team for assistance with domain setup and
                  SSL certificate configuration.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDnsModal(false)}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
