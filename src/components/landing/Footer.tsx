'use client'

import Link from 'next/link'
import { Github, Twitter, Linkedin, Mail } from 'lucide-react'

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Documentation', href: '/dashboard/docs' },
    { label: 'Changelog', href: '#changelog' },
  ],
  company: [
    { label: 'About', href: '#about' },
    { label: 'Blog', href: '#blog' },
    { label: 'Careers', href: '#careers' },
    { label: 'Contact', href: '#contact' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '#privacy' },
    { label: 'Terms of Service', href: '#terms' },
    { label: 'Cookie Policy', href: '#cookies' },
    { label: 'GDPR', href: '#gdpr' },
  ],
  resources: [
    { label: 'Getting Started', href: '/dashboard/docs' },
    // API Reference temporarily removed for user testing
    // { label: 'API Reference', href: '/dashboard/docs#api' },
    { label: 'Self-Hosting', href: '/dashboard/docs#self-hosting' },
    { label: 'Support', href: '#support' },
  ],
}

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
  { icon: Github, href: 'https://github.com', label: 'GitHub' },
  { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: Mail, href: 'mailto:hello@mydistinctai.com', label: 'Email' },
]

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2">
            <Link href="/" className="inline-block mb-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                MyDistinctAI
              </h3>
            </Link>
            <p className="text-white/60 mb-6 leading-relaxed">
              Build your own GPT - offline, encrypted, and trained on you. Privacy-first AI for
              professionals.
            </p>

            {/* Social links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors group"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Product links */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources links */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mb-8" />

        {/* Bottom footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/60 text-sm">
            © {new Date().getFullYear()} MyDistinctAI. All rights reserved.
          </p>

          {/* Trust badges */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-xs text-white/80 font-medium">AES-256 Encrypted</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              <span className="text-xs text-white/80 font-medium">GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
              <div className="w-2 h-2 bg-purple-400 rounded-full" />
              <span className="text-xs text-white/80 font-medium">HIPAA Ready</span>
            </div>
          </div>
        </div>

        {/* Made with love note */}
        <div className="mt-8 text-center">
          <p className="text-white/40 text-xs">
            Built with Next.js, Supabase, and Ollama. Designed for privacy.
          </p>
        </div>
      </div>
    </footer>
  )
}
