'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, Brain, Shield, Zap } from 'lucide-react'
import type { ModuleId } from '@/lib/types'

interface ScenarioCard {
  id: string
  title: string
  subtitle: string
  module: ModuleId
  icon: string
  badge: string
  href: string
}

const scenarios: ScenarioCard[] = [
  {
    id: 'navigation',
    title: 'Navigation',
    subtitle: 'Find optimal paths through city networks using informed and uninformed search',
    module: 'search',
    icon: '🧭',
    badge: 'Search',
    href: '/search',
  },
  {
    id: 'network-routing',
    title: 'Network Routing',
    subtitle: 'Route packets through network topologies with minimal latency',
    module: 'search',
    icon: '🌐',
    badge: 'Search',
    href: '/search',
  },
  {
    id: 'drone-delivery',
    title: 'Drone Delivery',
    subtitle: 'Plan aerial delivery routes avoiding obstacles and no-fly zones',
    module: 'search',
    icon: '🚁',
    badge: 'Search',
    href: '/search',
  },
  {
    id: 'university-timetable',
    title: 'University Timetable',
    subtitle: 'Schedule classes across rooms and timeslots satisfying all constraints',
    module: 'constraints',
    icon: '📅',
    badge: 'Constraints',
    href: '/constraints',
  },
  {
    id: 'chess-decision',
    title: 'Chess Decision',
    subtitle: 'Evaluate game trees with minimax and alpha-beta pruning strategies',
    module: 'decisions',
    icon: '♟️',
    badge: 'Decisions',
    href: '/decisions',
  },
  {
    id: 'medical-diagnosis',
    title: 'Medical Diagnosis',
    subtitle: 'Update diagnostic probabilities with Bayesian reasoning from symptoms',
    module: 'uncertainty',
    icon: '🩺',
    badge: 'Uncertainty',
    href: '/uncertainty',
  },
]

const modules: { id: ModuleId; label: string; icon: React.ReactNode; href: string }[] = [
  { id: 'search', label: 'Search', icon: <Search className="w-3.5 h-3.5" />, href: '/search' },
  { id: 'constraints', label: 'Constraints', icon: <Shield className="w-3.5 h-3.5" />, href: '/constraints' },
  { id: 'decisions', label: 'Decisions', icon: <Brain className="w-3.5 h-3.5" />, href: '/decisions' },
  { id: 'uncertainty', label: 'Uncertainty', icon: <Zap className="w-3.5 h-3.5" />, href: '/uncertainty' },
]

const badgeColorMap: Record<string, string> = {
  Search: 'bg-accent-blue/10 text-accent-blue',
  Constraints: 'bg-accent-green/10 text-accent-green',
  Decisions: 'bg-accent-purple/10 text-accent-purple',
  Uncertainty: 'bg-accent-amber/10 text-accent-amber',
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const headerVariants = {
  hidden: { opacity: 0, y: -12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-surface-0 bg-grid">
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20">
        {/* Header */}
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-3">
            <span className="tracking-[0.3em] uppercase">CORTEX</span>{' '}
            <span className="text-text-secondary font-light">AI</span>
          </h1>
          <p className="text-sm text-text-secondary tracking-[0.3em] uppercase">
            Search · Reason · Decide · Learn
          </p>
        </motion.div>

        {/* Scenario Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full mb-16"
        >
          {scenarios.map((scenario) => (
            <motion.div key={scenario.id} variants={cardVariants}>
              <Link href={scenario.href} className="block group">
                <div className="relative bg-surface-1 border-subtle rounded-2xl p-6 transition-all duration-200 ease hover:bg-surface-2 hover:border-[rgba(255,255,255,0.12)]">
                  <div className="text-3xl mb-4">{scenario.icon}</div>
                  <h3 className="text-white text-base font-medium mb-1.5">
                    {scenario.title}
                  </h3>
                  <p className="text-text-tertiary text-xs leading-relaxed mb-4">
                    {scenario.subtitle}
                  </p>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${badgeColorMap[scenario.badge]}`}
                  >
                    {scenario.badge}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Module Links */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {modules.map((mod) => (
            <Link
              key={mod.id}
              href={mod.href}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-subtle bg-surface-1 text-text-secondary text-xs font-medium tracking-wider uppercase transition-all duration-200 ease hover:bg-surface-2 hover:text-white hover:border-[rgba(255,255,255,0.12)]"
            >
              {mod.icon}
              {mod.label}
            </Link>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="mt-20 text-text-muted text-[11px] tracking-wider uppercase"
        >
          AI Education Platform — Empirical Profiling of Search Algorithms
        </motion.p>
      </div>
    </div>
  )
}
