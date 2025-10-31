/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable static export - we're running a dev server in Tauri
  // output: process.env.TAURI_BUILD ? 'export' : undefined,
  trailingSlash: true,
  typescript: {
    // Temporarily ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['pdf-parse', 'mammoth', 'papaparse'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle these packages on the server
      config.externals = [...(config.externals || []), 'pdf-parse', 'mammoth', 'papaparse']
    }
    return config
  },
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
    // Unoptimized images for development and Tauri builds
    unoptimized: process.env.NODE_ENV === 'development' || process.env.TAURI_BUILD === 'true',
  },
  // Configure for Tauri static export
  ...(process.env.TAURI_BUILD && {
    distDir: 'out',
  }),
}

module.exports = nextConfig
