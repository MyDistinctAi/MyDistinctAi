'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Check, Loader2, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const niches = [
  { value: 'creators', label: 'Content Creators' },
  { value: 'lawyers', label: 'Legal Professionals' },
  { value: 'hospitals', label: 'Healthcare' },
  { value: 'other', label: 'Other' },
]

export function WaitlistForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    niche: '',
    company: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    // Validate
    if (!formData.name || !formData.email || !formData.niche) {
      setStatus('error')
      setErrorMessage('Please fill in all required fields')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setStatus('error')
      setErrorMessage('Please enter a valid email address')
      return
    }

    try {
      const supabase = createClient()

      // Check if email already exists
      const { data: existing } = await supabase
        .from('waitlist')
        .select('id')
        .eq('email', formData.email)
        .single()

      if (existing) {
        setStatus('error')
        setErrorMessage('This email is already on the waitlist')
        return
      }

      // Insert to waitlist
      const { error } = await supabase.from('waitlist').insert([
        {
          name: formData.name,
          email: formData.email,
          niche: formData.niche,
          company: formData.company || null,
        },
      ])

      if (error) throw error

      setStatus('success')
      setFormData({ name: '', email: '', niche: '', company: '' })

      // Reset success message after 5 seconds
      setTimeout(() => setStatus('idle'), 5000)
    } catch (error) {
      console.error('Waitlist signup error:', error)
      setStatus('error')
      setErrorMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <section className="py-24 bg-gradient-to-br from-blue-600 to-purple-600 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Join the Waitlist
            </h2>
            <p className="text-xl text-white/90">
              Be the first to know when we launch. Get exclusive early access and special pricing.
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-white rounded-2xl p-8 shadow-2xl"
          >
            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">You're on the list!</h3>
                <p className="text-slate-600 mb-4">
                  We'll send you an email when we launch with your exclusive early access code.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Mail className="w-4 h-4" />
                  <span>Check your inbox for confirmation</span>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="John Doe"
                    disabled={status === 'loading'}
                  />
                </div>

                {/* Email field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="john@example.com"
                    disabled={status === 'loading'}
                  />
                </div>

                {/* Niche dropdown */}
                <div>
                  <label htmlFor="niche" className="block text-sm font-semibold text-slate-700 mb-2">
                    What best describes you? <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="niche"
                    value={formData.niche}
                    onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
                    disabled={status === 'loading'}
                  >
                    <option value="">Select an option</option>
                    {niches.map((niche) => (
                      <option key={niche.value} value={niche.value}>
                        {niche.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Company field (optional) */}
                <div>
                  <label htmlFor="company" className="block text-sm font-semibold text-slate-700 mb-2">
                    Company (Optional)
                  </label>
                  <input
                    type="text"
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="Acme Inc."
                    disabled={status === 'loading'}
                  />
                </div>

                {/* Error message */}
                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border border-red-200 rounded-xl"
                  >
                    <p className="text-sm text-red-600">{errorMessage}</p>
                  </motion.div>
                )}

                {/* Submit button */}
                <motion.button
                  type="submit"
                  disabled={status === 'loading'}
                  whileHover={{ scale: status === 'loading' ? 1 : 1.02 }}
                  whileTap={{ scale: status === 'loading' ? 1 : 0.98 }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    'Join Waitlist'
                  )}
                </motion.button>

                {/* Privacy notice */}
                <p className="text-xs text-center text-slate-500">
                  By joining, you agree to receive updates about MyDistinctAI.
                  <br />
                  We respect your privacy and won't spam you. Unsubscribe anytime.
                </p>
              </form>
            )}
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-12 grid md:grid-cols-3 gap-6"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🎉</span>
              </div>
              <p className="text-white font-medium">Early Access</p>
              <p className="text-white/80 text-sm">Be first to try new features</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💰</span>
              </div>
              <p className="text-white font-medium">Special Pricing</p>
              <p className="text-white/80 text-sm">Exclusive launch discounts</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🎁</span>
              </div>
              <p className="text-white font-medium">Bonus Credits</p>
              <p className="text-white/80 text-sm">Extra storage & features</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
