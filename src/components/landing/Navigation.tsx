'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown } from 'lucide-react'

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#use-cases', label: 'Use Cases' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/docs', label: 'Docs' },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? 'bg-slate-950/95 backdrop-blur-lg border-b border-white/10 shadow-xl'
          : 'bg-transparent'
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-12 h-12 rounded-xl overflow-hidden"
            >
              <img
                src="/images/logo.jpg"
                alt="MyDistinctAI Logo"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <span className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
              MyDistinctAI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-white/80 hover:text-white transition-colors font-medium cursor-pointer"
                onClick={(e) => {
                  if (link.href.startsWith('#')) {
                    e.preventDefault()
                    const element = document.querySelector(link.href)
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }
                }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 text-white hover:text-blue-400 transition-colors font-medium"
              >
                Sign In
              </motion.button>
            </Link>
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/30"
              >
                Get Started
              </motion.button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-white hover:text-blue-400 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-950/98 backdrop-blur-lg border-t border-white/10"
          >
            <div className="container mx-auto px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block py-3 text-white/80 hover:text-white transition-colors font-medium border-b border-white/5 cursor-pointer"
                  onClick={(e) => {
                    setIsMobileMenuOpen(false)
                    if (link.href.startsWith('#')) {
                      e.preventDefault()
                      setTimeout(() => {
                        const element = document.querySelector(link.href)
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                      }, 300) // Wait for menu to close
                    }
                  }}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 space-y-3">
                <Link href="/login" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                  <button className="w-full px-6 py-3 text-white hover:text-blue-400 transition-colors font-medium border border-white/20 rounded-lg">
                    Sign In
                  </button>
                </Link>
                <Link href="/register" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                  <button className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/30">
                    Get Started
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
