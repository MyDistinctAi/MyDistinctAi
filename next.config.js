/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Desktop app will run a bundled Next.js server, not static export
  typescript: {
    // Temporarily ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors during build (quote escaping warnings)
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['pdf-parse', 'mammoth', 'papaparse'],
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
