import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          50: '#e8f8f0',
          100: '#d1f1e1',
          500: '#2ECC71', // Emerald green
          600: '#27ae60',
          700: '#229954',
        },
        secondary: {
          50: '#F8F9FA', // Off-white/Light
          100: '#f1f3f4',
          500: '#1A1A1A', // Near-black/Dark
          600: '#141414',
          700: '#0d0d0d',
        },
        dark: '#1A1A1A', // Near-black
        light: '#F8F9FA', // Off-white
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)'],
      },
      fontWeight: {
        headline: '700', // Bold for headlines
        body: '500', // Medium for body
      },
    },
  },
  plugins: [],
}

export default config
