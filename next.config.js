/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable static export for Tauri builds (desktop app must be fully static)
  output: process.env.TAURI_BUILD ? 'export' : undefined,
  trailingSlash: process.env.TAURI_BUILD ? true : false,
  typescript: {
    // Temporarily ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors during build (quote escaping warnings)
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['pdf-parse', 'mammoth', 'papaparse'],
  // Empty turbopack config to silence webpack warning
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    // Unoptimized images for Tauri builds (no image optimization server)
    unoptimized: process.env.NODE_ENV === 'development' || process.env.TAURI_BUILD === 'true',
  },
}

module.exports = nextConfig
