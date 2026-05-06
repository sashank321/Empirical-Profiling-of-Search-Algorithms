'use client'

import { motion } from 'framer-motion'

interface Metric {
  label: string
  value: string | number
  unit?: string
  icon?: React.ReactNode
}

interface AnalyticsPanelProps {
  metrics: Metric[]
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

export default function AnalyticsPanel({ metrics }: AnalyticsPanelProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {metrics.map((metric, index) => (
        <motion.div
          key={`${metric.label}-${index}`}
          variants={cardVariants}
          className="bg-surface-1 border-subtle rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            {metric.icon && (
              <span className="text-text-tertiary">{metric.icon}</span>
            )}
            <span className="text-text-tertiary text-xs uppercase tracking-wider font-medium">
              {metric.label}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-light font-mono text-white">
              {typeof metric.value === 'number'
                ? metric.value % 1 === 0
                  ? metric.value.toLocaleString()
                  : metric.value.toFixed(2)
                : metric.value}
            </span>
            {metric.unit && (
              <span className="text-text-muted text-sm font-light">
                {metric.unit}
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
