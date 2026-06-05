'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Brain, Lightbulb, List, Route, Target, Layers } from 'lucide-react'
import type { SearchStep } from '@/lib/types'

interface XAIPanelProps {
  step: SearchStep | null
  algorithmId: string
  algorithmName: string
  isComplete: boolean
  path: string[]
}

/* Algorithm-specific explanation generators */
const ALGO_EXPLANATIONS: Record<string, (step: SearchStep) => string> = {
  bfs: (s) => `BFS explores level-by-level. Node "${s.node}" is dequeued from the FIFO queue. All unvisited neighbors will be enqueued. Queue size: ${s.frontier.length}.`,
  dfs: (s) => `DFS dives deep first. Node "${s.node}" is popped from the stack. It will push unvisited neighbors and continue exploring the deepest branch. Stack size: ${s.frontier.length}.`,
  ucs: (s) => {
    const fVal = s.frontier.find(f => f.id === s.node)
    return `UCS expands the lowest-cost node. "${s.node}" has accumulated cost g=${fVal?.g ?? '?'}. The priority queue has ${s.frontier.length} nodes.`
  },
  gbfs: (s) => {
    const fVal = s.frontier.find(f => f.id === s.node)
    return `Greedy BFS selects the node closest to goal by heuristic. "${s.node}" has h=${fVal?.h ?? '?'}. This is fast but NOT guaranteed optimal.`
  },
  astar: (s) => {
    const fVal = s.frontier.find(f => f.id === s.node)
    return `A* selects by f(n)=g(n)+h(n). "${s.node}" has g=${fVal?.g ?? '?'}, h=${fVal?.h ?? '?'}, f=${fVal?.f ?? '?'}. A* is optimal when h is admissible.`
  },
  dijkstra: (s) => `Dijkstra expands the lowest-cost node to find shortest paths to ALL nodes. Currently expanding "${s.node}" with ${s.frontier.length} remaining in the priority queue.`,
  iddfs: (s) => `IDDFS performs DFS with increasing depth limits. Currently at node "${s.node}". This combines BFS completeness with DFS memory efficiency — O(bd) space vs O(b^d).`,
  idaStar: (s) => {
    const fVal = s.frontier.find(f => f.id === s.node)
    return `IDA* uses iterative f-cost thresholds. Node "${s.node}" has f=${fVal?.f ?? '?'}. Paths exceeding the threshold are pruned. Uses O(d) memory.`
  },
}

export default function XAIPanel({
  step,
  algorithmId,
  algorithmName,
  isComplete,
  path,
}: XAIPanelProps) {
  if (!step) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
        <Brain className="w-7 h-7 text-text-muted mb-3 opacity-30" />
        <p className="text-xs font-medium text-text-secondary">Explainable AI</p>
        <p className="text-[10px] text-text-tertiary mt-1 leading-relaxed max-w-[200px]">
          Execute an algorithm to see step-by-step reasoning explanations
        </p>
      </div>
    )
  }

  const explanation = ALGO_EXPLANATIONS[algorithmId]?.(step) ??
    `Exploring node "${step.node}". ${step.frontier.length} nodes in frontier.`

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb className="w-3.5 h-3.5 text-accent-amber" />
          <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
            Explainable AI
          </span>
        </div>
        <span className="text-[10px] font-mono text-text-muted">
          Step {step.step} · {algorithmName}
        </span>
      </div>

      {/* Current Node */}
      <motion.div
        key={step.step}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)]"
      >
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-3.5 h-3.5 text-accent-blue" />
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-medium">Current Node</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent-blue/10 text-accent-blue text-sm font-mono font-semibold">
            {step.node}
          </span>
          <div className="flex-1">
            <p className="text-xs text-white font-medium">{step.action}</p>
            <p className="text-[10px] text-text-tertiary">{step.reason}</p>
            <div className="flex gap-3 mt-1.5 pt-1.5 border-t border-[rgba(255,255,255,0.06)]">
              <span className="text-[10px] font-mono text-text-muted">Depth: {step.path.length}</span>
              <span className="text-[10px] font-mono text-text-muted">Cost: {step.frontier.find(f => f.id === step.node)?.g ?? step.frontier.find(f => f.id === step.node)?.f ?? '—'}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Algorithm Reasoning */}
      <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-3.5 h-3.5 text-accent-purple" />
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-medium">Why This Node?</span>
        </div>
        <p className="text-[11px] text-text-secondary leading-relaxed">
          {explanation}
        </p>
      </div>

      {/* Frontier State */}
      <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-3.5 h-3.5 text-accent-amber" />
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-medium">
            Frontier ({step.frontier.length})
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {step.frontier.slice(0, 12).map((f) => (
            <span
              key={f.id}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-surface-2 text-[10px] font-mono"
            >
              <span className="text-accent-amber">{f.id}</span>
              {f.f !== undefined && (
                <span className="text-text-muted">f={f.f}</span>
              )}
              {f.g !== undefined && f.f === undefined && (
                <span className="text-text-muted">g={f.g}</span>
              )}
            </span>
          ))}
          {step.frontier.length > 12 && (
            <span className="text-[10px] text-text-muted">+{step.frontier.length - 12} more</span>
          )}
        </div>
      </div>

      {/* Visited Set */}
      <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2 mb-2">
          <List className="w-3.5 h-3.5 text-accent-green" />
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-medium">
            Visited ({step.visited.length})
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {step.visited.map((v) => (
            <span
              key={v}
              className="inline-flex items-center justify-center w-6 h-5 rounded bg-surface-2 text-[10px] font-mono text-text-secondary"
            >
              {v}
            </span>
          ))}
        </div>
      </div>

      {/* Current Path */}
      {step.path.length > 0 && (
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Route className="w-3.5 h-3.5 text-white" />
            <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-medium">
              {isComplete ? 'Solution Path' : 'Current Path'}
            </span>
          </div>
          <div className="flex items-center gap-0.5 flex-wrap">
            {(isComplete ? path : step.path).map((node, i, arr) => (
              <React.Fragment key={i}>
                <span className={`inline-flex items-center justify-center w-6 h-5 rounded text-[10px] font-mono font-medium ${
                  isComplete ? 'bg-white text-black' : 'bg-surface-3 text-text-secondary'
                }`}>
                  {node}
                </span>
                {i < arr.length - 1 && (
                  <span className="text-text-muted text-[10px]">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
