'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, Shield, Brain, BarChart3 } from 'lucide-react'

const labs = [
  {
    icon: Search,
    title: 'Search Intelligence Lab',
    subtitle: '8 algorithms · Real-time visualization · Explainable AI',
    badge: '8 Algorithms',
    href: '/search',
  },
  {
    icon: Shield,
    title: 'Constraint Intelligence Lab',
    subtitle: 'CSP solving · Arc consistency · Backtracking analysis',
    badge: 'CSP Engine',
    href: '/constraints',
  },
  {
    icon: Brain,
    title: 'Decision Intelligence Lab',
    subtitle: 'Minimax · Alpha-beta pruning · Game tree exploration',
    badge: 'Game Theory',
    href: '/decisions',
  },
  {
    icon: BarChart3,
    title: 'Uncertainty Intelligence Lab',
    subtitle: 'Bayesian networks · Probabilistic inference · Evidence propagation',
    badge: 'Probabilistic',
    href: '/uncertainty',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.19, 1, 0.22, 1] },
  },
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[#050505] flex flex-col">
      {/* Top Section */}
      <div className="flex flex-col items-center pt-20 pb-12">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-6">
          <span className="shimmer-text text-sm font-semibold tracking-[0.3em] uppercase">
            CORTEX
          </span>
          <span className="text-sm font-light tracking-[0.3em] uppercase text-text-secondary">
            AI
          </span>
        </div>

        {/* Tagline — blur-in animation */}
        <motion.p
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-sm tracking-[0.25em] uppercase text-text-secondary font-light mb-3"
        >
          Search · Reasoning · Decision · Intelligence
        </motion.p>

        {/* Descriptor */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-xs text-text-tertiary tracking-wider"
        >
          Interactive AI Intelligence Platform
        </motion.p>
      </div>

      {/* Lab Cards Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto w-full px-6 pb-16 flex-1"
      >
        {labs.map((lab) => {
          const Icon = lab.icon
          return (
            <motion.div key={lab.href} variants={cardVariants}>
              <Link href={lab.href} className="block group">
                <div className="bg-[#0B0B0B] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 transition-all duration-300 ease-out-expo group-hover:border-[rgba(255,255,255,0.12)] group-hover:-translate-y-0.5">
                  <div className="flex flex-col gap-4">
                    <Icon className="w-5 h-5 text-text-tertiary group-hover:text-text-secondary transition-colors duration-300" />
                    <div>
                      <h3 className="text-[13px] font-medium tracking-wide text-white mb-1.5">
                        {lab.title}
                      </h3>
                      <p className="text-[11px] leading-relaxed text-text-tertiary">
                        {lab.subtitle}
                      </p>
                    </div>
                    <div className="pt-2">
                      <span className="inline-block bg-surface-2 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase text-text-muted">
                        {lab.badge}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Footer */}
      <div className="flex justify-center pb-8">
        <span className="text-text-muted text-[10px] tracking-wider">
          © 2026 CORTEX AI
        </span>
      </div>
    </div>
  )
}
