'use client'

import { motion } from 'framer-motion'
import { Server, Shield, Cloud, Check, X } from 'lucide-react'

const features = [
  {
    icon: Server,
    title: 'Local-First AI',
    description:
      'Your data never leaves your device. Train and run AI models completely offline with Ollama integration.',
    benefits: [
      'Complete data ownership',
      'No internet dependency',
      'Maximum performance',
      'Zero cloud costs',
    ],
  },
  {
    icon: Shield,
    title: 'Enterprise-Grade Security',
    description:
      'Built-in compliance with GDPR and HIPAA. AES-256 encryption by default for all your sensitive data.',
    benefits: [
      'AES-256 encryption',
      'GDPR & HIPAA compliant',
      'Audit logging',
      'Access controls',
    ],
  },
  {
    icon: Cloud,
    title: 'Deploy Your Way',
    description:
      "Self-host on your infrastructure or use our managed cloud. You're in complete control of where your data lives.",
    benefits: [
      'Self-hosting ready',
      'Docker support',
      'Cloud option available',
      'Easy migration',
    ],
  },
]

const comparisonData = [
  {
    feature: 'Data Privacy',
    localAI: true,
    cloudAI: false,
  },
  {
    feature: 'Offline Access',
    localAI: true,
    cloudAI: false,
  },
  {
    feature: 'No Subscription for API',
    localAI: true,
    cloudAI: false,
  },
  {
    feature: 'GDPR/HIPAA Ready',
    localAI: true,
    cloudAI: false,
  },
  {
    feature: 'Custom Training',
    localAI: true,
    cloudAI: true,
  },
  {
    feature: 'Fast Response',
    localAI: true,
    cloudAI: true,
  },
]

export function Features() {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Three Key Differentiators
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Everything you need to build private, compliant, and powerful AI solutions
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-slate-200"
            >
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-slate-900 mb-4">{feature.title}</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">{feature.description}</p>

              {/* Benefits list */}
              <ul className="space-y-2">
                {feature.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2 text-slate-700">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <h3 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            Local AI vs Cloud AI
          </h3>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-slate-900 font-semibold">Feature</th>
                  <th className="px-6 py-4 text-center text-slate-900 font-semibold">
                    Local AI
                    <div className="text-sm font-normal text-blue-600 mt-1">
                      (MyDistinctAI)
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-slate-900 font-semibold">
                    Cloud AI
                    <div className="text-sm font-normal text-slate-500 mt-1">
                      (OpenAI, etc.)
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {comparisonData.map((row, index) => (
                  <motion.tr
                    key={row.feature}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-slate-900 font-medium">{row.feature}</td>
                    <td className="px-6 py-4 text-center">
                      {row.localAI ? (
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                          <X className="w-5 h-5 text-red-600" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.cloudAI ? (
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                          <X className="w-5 h-5 text-red-600" />
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-center text-slate-600 mt-6">
            Choose privacy, security, and control without compromising on performance
          </p>
        </motion.div>
      </div>
    </section>
  )
}
