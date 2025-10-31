'use client'

import { motion } from 'framer-motion'
import { Upload, Settings, Rocket, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const steps = [
  {
    number: 1,
    icon: Upload,
    title: 'Upload Your Knowledge',
    description: 'Upload PDFs, documents, or text files to train your AI on your specific expertise',
    details: [
      'Support for PDF, DOCX, TXT, MD, CSV',
      'Drag & drop interface',
      'Batch upload multiple files',
      'Automatic text extraction',
    ],
  },
  {
    number: 2,
    icon: Settings,
    title: 'Customize Your Tone',
    description: 'Define personality, expertise level, and response style to match your needs',
    details: [
      'Set personality traits',
      'Define expertise level',
      'Customize response length',
      'Choose temperature settings',
    ],
  },
  {
    number: 3,
    icon: Rocket,
    title: 'Launch Your Private GPT',
    description: 'Start chatting with your custom AI - completely private and offline capable',
    details: [
      'Instant AI responses',
      'Streaming answers',
      'Context-aware conversations',
      'Export chat history',
    ],
  },
]

export function HowItWorks() {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
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
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Get started with your private AI in three simple steps
          </p>
        </motion.div>

        {/* Steps - Desktop horizontal flow */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Progress line */}
            <div className="absolute top-24 left-0 right-0 h-1 bg-white/20">
              <motion.div
                initial={{ width: '0%' }}
                whileInView={{ width: '100%' }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              />
            </div>

            {/* Steps */}
            <div className="grid grid-cols-3 gap-8 relative">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                  className="relative"
                >
                  {/* Step number circle */}
                  <div className="relative mb-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.2 + 0.3, duration: 0.5 }}
                      className="w-48 h-48 mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-600/50 relative z-10"
                    >
                      <div className="w-44 h-44 bg-slate-900 rounded-full flex flex-col items-center justify-center">
                        <step.icon className="w-16 h-16 text-blue-400 mb-2" />
                        <span className="text-white/60 text-sm font-semibold">
                          Step {step.number}
                        </span>
                      </div>
                    </motion.div>

                    {/* Connecting arrow */}
                    {index < steps.length - 1 && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.2 + 0.6, duration: 0.5 }}
                        className="absolute top-1/2 -right-8 transform -translate-y-1/2"
                      >
                        <ArrowRight className="w-16 h-16 text-blue-400/50" />
                      </motion.div>
                    )}
                  </div>

                  {/* Step content */}
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-white/70 mb-4 leading-relaxed">{step.description}</p>

                    {/* Details list */}
                    <ul className="space-y-2 text-left">
                      {step.details.map((detail) => (
                        <li
                          key={detail}
                          className="flex items-start gap-2 text-white/60 text-sm"
                        >
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Steps - Mobile vertical stack */}
        <div className="md:hidden space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="relative"
            >
              {/* Step number circle */}
              <div className="flex items-start gap-6 mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-600/50 flex-shrink-0">
                  <div className="w-18 h-18 bg-slate-900 rounded-full flex flex-col items-center justify-center p-2">
                    <step.icon className="w-8 h-8 text-blue-400" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="text-blue-400 text-sm font-semibold mb-1">
                    Step {step.number}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>

              {/* Details list */}
              <ul className="space-y-2 pl-26">
                {step.details.map((detail) => (
                  <li
                    key={detail}
                    className="flex items-start gap-2 text-white/60 text-sm"
                  >
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>

              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="w-px h-8 bg-white/20 ml-10 my-4" />
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center mt-16"
        >
          <Link href="/register">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 mx-auto transition-all shadow-xl shadow-blue-600/30"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
          <p className="text-white/60 text-sm mt-4">
            No credit card required • Free 14-day trial
          </p>
        </motion.div>
      </div>
    </section>
  )
}
