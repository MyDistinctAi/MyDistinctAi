'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Shield, Lock, Server } from 'lucide-react'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -inset-[10px] opacity-50"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
            ],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left"
          >
            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex flex-wrap gap-3 mb-8"
            >
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Lock className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-white/90 font-medium">AES-256</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm text-white/90 font-medium">GDPR/HIPAA</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Server className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white/90 font-medium">Self-Hosted</span>
              </div>
            </motion.div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Build your own GPT
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                offline, encrypted
              </span>
              and trained on you
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-white/80 mb-8 leading-relaxed">
              Your private AI studio: no code, no cloud, no compromises.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/30"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>

              <Link href="#demo">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 rounded-xl font-semibold text-lg transition-all"
                >
                  Book Demo
                </motion.button>
              </Link>
            </div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-12 flex items-center gap-8"
            >
              <div>
                <p className="text-3xl font-bold text-white">500+</p>
                <p className="text-sm text-white/60">Enterprises Trust Us</p>
              </div>
              <div className="h-12 w-px bg-white/20" />
              <div>
                <p className="text-3xl font-bold text-white">100%</p>
                <p className="text-sm text-white/60">Data Privacy</p>
              </div>
              <div className="h-12 w-px bg-white/20" />
              <div>
                <p className="text-3xl font-bold text-white">24/7</p>
                <p className="text-sm text-white/60">Local Processing</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right content - Hero image/illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="relative"
          >
            <div className="relative aspect-square bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-3xl p-8 backdrop-blur-sm border border-white/10">
              {/* Placeholder for hero image */}
              <div className="w-full h-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                    <Lock className="w-16 h-16 text-blue-400" />
                  </div>
                  <p className="text-white/80 font-medium">Your AI, Your Data</p>
                  <p className="text-white/60 text-sm mt-2">Completely Private</p>
                </div>
              </div>

              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20"
              >
                <p className="text-xs text-white/80 font-medium">🔒 Encrypted</p>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="absolute bottom-4 left-4 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20"
              >
                <p className="text-xs text-white/80 font-medium">⚡ Fast & Local</p>
              </motion.div>
            </div>

            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-3xl blur-3xl -z-10 opacity-50" />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white/30 rounded-full p-1"
        >
          <div className="w-1 h-2 bg-white/50 rounded-full mx-auto" />
        </motion.div>
      </motion.div>
    </section>
  )
}
