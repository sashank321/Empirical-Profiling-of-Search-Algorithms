'use client'

import { motion } from 'framer-motion'
import { Clock, Layers, Zap, Brain, Activity, HelpCircle, Network } from 'lucide-react'
import { AlgoMetrics } from '@/lib/types'

interface AnalyticsPanelProps {
  metrics: AlgoMetrics | null
  algorithmName?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
}

export default function AnalyticsPanel({ metrics, algorithmName }: AnalyticsPanelProps) {
  return (
    <aside className="w-72 bg-surface-1 border-l border-subtle flex flex-col overflow-y-auto flex-shrink-0">
      <div className="p-5 border-b border-subtle">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-accent-blue" />
          <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
            Performance Analytics
          </span>
        </div>
        <h2 className="text-sm font-semibold text-white truncate">
          {algorithmName || 'No Active Session'}
        </h2>
      </div>

      <div className="p-5 flex-1">
        {!metrics ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-text-tertiary py-20">
            <Brain className="w-8 h-8 mb-3 opacity-20 text-white" />
            <p className="text-xs font-medium text-text-secondary">Awaiting Execution</p>
            <p className="text-[10px] text-text-tertiary mt-1 px-4">
              Run a search algorithm to view metrics and complexity profiling.
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-4"
          >
            {/* Metric Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Execution Time */}
              <motion.div variants={cardVariants} className="bg-surface-2 border border-[rgba(255,255,255,0.03)] rounded-xl p-3.5 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-text-tertiary whitespace-nowrap truncate">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-[9px] uppercase tracking-wider font-semibold truncate">Exec Time</span>
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-lg font-mono font-light text-white">{metrics.executionMs.toFixed(2)}</span>
                  <span className="text-[10px] text-text-muted">ms</span>
                </div>
              </motion.div>

              {/* Path Cost */}
              <motion.div variants={cardVariants} className="bg-surface-2 border border-[rgba(255,255,255,0.03)] rounded-xl p-3.5 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-text-tertiary whitespace-nowrap truncate">
                  <Zap className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-[9px] uppercase tracking-wider font-semibold truncate">Path Cost</span>
                </div>
                <div className="flex items-baseline">
                  <span className="text-lg font-mono font-light text-white">
                    {metrics.pathCost > 0 ? metrics.pathCost : '—'}
                  </span>
                </div>
              </motion.div>

              {/* Nodes Expanded */}
              <motion.div variants={cardVariants} className="bg-surface-2 border border-[rgba(255,255,255,0.03)] rounded-xl p-3.5 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-text-tertiary whitespace-nowrap truncate">
                  <Layers className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-[9px] uppercase tracking-wider font-semibold truncate">Expanded</span>
                </div>
                <div className="flex items-baseline">
                  <span className="text-lg font-mono font-light text-white">{metrics.nodesExpanded}</span>
                </div>
              </motion.div>

              {/* Peak Frontier */}
              <motion.div variants={cardVariants} className="bg-surface-2 border border-[rgba(255,255,255,0.03)] rounded-xl p-3.5 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-text-tertiary whitespace-nowrap truncate">
                  <Network className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-[9px] uppercase tracking-wider font-semibold truncate">Peak Front</span>
                </div>
                <div className="flex items-baseline">
                  <span className="text-lg font-mono font-light text-white">{metrics.peakFrontier}</span>
                </div>
              </motion.div>
            </div>

            {/* General Stats List */}
            <div className="flex flex-col gap-2.5 bg-surface-2 border border-[rgba(255,255,255,0.03)] rounded-xl p-4 mt-1">
              <div className="flex justify-between items-center text-xs whitespace-nowrap gap-4">
                <span className="text-text-tertiary truncate">Branching Factor</span>
                <span className="font-mono text-white flex-shrink-0">{metrics.branchingFactor.toFixed(2)}</span>
              </div>
              <div className="w-full h-px bg-[rgba(255,255,255,0.05)]" />
              <div className="flex justify-between items-center text-xs whitespace-nowrap gap-4">
                <span className="text-text-tertiary truncate">Total Operations</span>
                <span className="font-mono text-white flex-shrink-0">{metrics.totalOps.toLocaleString()}</span>
              </div>
            </div>

            {/* Complexity Badges */}
            <div className="flex flex-col gap-2.5 bg-surface-2 border border-[rgba(255,255,255,0.03)] rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-1 text-text-tertiary">
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">Complexity Profile</span>
              </div>
              <div className="flex justify-between items-center text-xs whitespace-nowrap gap-4">
                <span className="text-text-tertiary truncate">Time Complexity</span>
                <span className="font-mono text-accent-blue font-semibold flex-shrink-0">{metrics.timeComplexity}</span>
              </div>
              <div className="w-full h-px bg-[rgba(255,255,255,0.05)]" />
              <div className="flex justify-between items-center text-xs whitespace-nowrap gap-4">
                <span className="text-text-tertiary truncate">Space Complexity</span>
                <span className="font-mono text-accent-amber font-semibold flex-shrink-0">{metrics.spaceComplexity}</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </aside>
  )
}
