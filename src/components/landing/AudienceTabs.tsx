'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Palette, Scale, Heart, Star, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

const audiences = [
  {
    id: 'creators',
    label: 'Creators',
    icon: Palette,
    headline: 'Protect Your Creative IP',
    description:
      'Train AI on your unique voice and style without exposing your content to third-party services.',
    useCases: [
      {
        title: 'Content Generation',
        description: 'Generate blog posts, scripts, and social media content in your voice',
      },
      {
        title: 'Style Consistency',
        description: 'Maintain your unique brand voice across all content',
      },
      {
        title: 'Idea Brainstorming',
        description: 'Get creative suggestions based on your past work',
      },
    ],
    testimonial: {
      quote:
        '"MyDistinctAI helped me protect my creative process while leveraging AI. No more worrying about my ideas being used to train other models."',
      author: 'Sarah Chen',
      role: 'Content Creator & YouTuber',
      rating: 5,
    },
  },
  {
    id: 'lawyers',
    label: 'Lawyers',
    icon: Scale,
    headline: 'Confidential Document Processing',
    description:
      'Process sensitive legal documents with HIPAA-compliant AI that never sends data to the cloud.',
    useCases: [
      {
        title: 'Contract Review',
        description: 'Analyze contracts for key terms and potential issues',
      },
      {
        title: 'Legal Research',
        description: 'Search through case law and precedents instantly',
      },
      {
        title: 'Document Summarization',
        description: 'Get concise summaries of lengthy legal documents',
      },
    ],
    testimonial: {
      quote:
        '"Client confidentiality is paramount. MyDistinctAI lets us use AI without compromising attorney-client privilege."',
      author: 'Michael Rodriguez',
      role: 'Partner, Rodriguez & Associates',
      rating: 5,
    },
  },
  {
    id: 'hospitals',
    label: 'Hospitals',
    icon: Heart,
    headline: 'HIPAA-Compliant Patient Data',
    description:
      'Analyze medical records and clinical notes with on-premise AI that meets all healthcare compliance requirements.',
    useCases: [
      {
        title: 'Clinical Notes Analysis',
        description: 'Extract insights from patient records securely',
      },
      {
        title: 'Diagnosis Support',
        description: 'Reference medical knowledge trained on your protocols',
      },
      {
        title: 'Research Data Processing',
        description: 'Analyze medical research without data exposure',
      },
    ],
    testimonial: {
      quote:
        '"We can finally leverage AI for patient care while maintaining full HIPAA compliance and data sovereignty."',
      author: 'Dr. Emily Watson',
      role: 'Chief Medical Officer, City General Hospital',
      rating: 5,
    },
  },
]

export function AudienceTabs() {
  const [activeTab, setActiveTab] = useState('creators')
  const currentAudience = audiences.find((a) => a.id === activeTab) || audiences[0]

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Built for Professionals Who Value Privacy
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Tailored solutions for industries with strict data privacy requirements
          </p>
        </motion.div>

        {/* Tab navigation */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-slate-100 rounded-xl p-1.5 gap-1">
            {audiences.map((audience) => (
              <button
                key={audience.id}
                onClick={() => setActiveTab(audience.id)}
                className={`relative px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === audience.id
                    ? 'text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {activeTab === audience.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <audience.icon className="w-5 h-5" />
                  {audience.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-6xl mx-auto"
          >
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left content */}
              <div>
                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                  <currentAudience.icon className="w-4 h-4" />
                  For {currentAudience.label}
                </div>

                <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  {currentAudience.headline}
                </h3>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  {currentAudience.description}
                </p>

                {/* Use cases */}
                <div className="space-y-4 mb-8">
                  {currentAudience.useCases.map((useCase, index) => (
                    <motion.div
                      key={useCase.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                      className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1">{useCase.title}</h4>
                        <p className="text-sm text-slate-600">{useCase.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Link href="/register">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/30"
                  >
                    Learn More
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              </div>

              {/* Right content - Testimonial */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 border border-slate-200"
              >
                {/* Rating stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(currentAudience.testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-lg text-slate-700 mb-6 leading-relaxed">
                  {currentAudience.testimonial.quote}
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {currentAudience.testimonial.author.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {currentAudience.testimonial.author}
                    </p>
                    <p className="text-sm text-slate-600">
                      {currentAudience.testimonial.role}
                    </p>
                  </div>
                </div>

                {/* Trust badges */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-slate-700 font-medium">Verified User</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-slate-700 font-medium">2+ Years</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
