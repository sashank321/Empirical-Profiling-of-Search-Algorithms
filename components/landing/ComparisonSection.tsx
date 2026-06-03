'use client'

import ScrollReveal from './ScrollReveal'
import AnimatedCounter from './AnimatedCounter'
import { Check, X } from 'lucide-react'

const ALGORITHMS = [
  { name: 'BFS', time: 'O(V+E)', space: 'O(V)', optimal: true, complete: true, nodes: 450, cost: 12 },
  { name: 'DFS', time: 'O(V+E)', space: 'O(V)', optimal: false, complete: false, nodes: 120, cost: 24 },
  { name: 'UCS', time: 'O(V²)', space: 'O(V)', optimal: true, complete: true, nodes: 890, cost: 12 },
  { name: 'Greedy', time: 'O(V²)', space: 'O(V)', optimal: false, complete: false, nodes: 60, cost: 18 },
  { name: 'A*', time: 'O(V²)', space: 'O(V)', optimal: true, complete: true, nodes: 150, cost: 12 },
]

export default function ComparisonSection() {
  return (
    <section className="relative py-32 bg-surface-1 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-medium text-white mb-4 tracking-tight">
            Comprehensive <span className="text-text-tertiary">Profiling</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Directly compare algorithmic complexity, memory footprints, and optimality guarantees across standard problem sets.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="glass-panel rounded-2xl border-subtle overflow-hidden overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="grid grid-cols-6 gap-4 p-6 border-b border-subtle bg-surface-2/50 text-xs font-mono uppercase tracking-widest text-text-tertiary">
                <div>Metric</div>
                {ALGORITHMS.map(a => <div key={a.name} className="text-center text-white">{a.name}</div>)}
              </div>
              
              {/* Rows */}
              <div className="divide-y divide-border/50">
                
                {/* Time Complexity */}
                <div className="grid grid-cols-6 gap-4 p-6 items-center transition-colors hover:bg-surface-2/30">
                  <div className="text-sm font-medium text-text-secondary">Time Complexity</div>
                  {ALGORITHMS.map(a => (
                    <div key={a.name} className="text-center">
                      <span className="inline-block px-3 py-1 rounded bg-surface-3 border border-subtle text-sm font-mono text-white">
                        {a.time}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Space Complexity */}
                <div className="grid grid-cols-6 gap-4 p-6 items-center transition-colors hover:bg-surface-2/30">
                  <div className="text-sm font-medium text-text-secondary">Space Complexity</div>
                  {ALGORITHMS.map(a => (
                    <div key={a.name} className="text-center">
                      <span className="inline-block px-3 py-1 rounded bg-surface-3 border border-subtle text-sm font-mono text-white">
                        {a.space}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Optimality */}
                <div className="grid grid-cols-6 gap-4 p-6 items-center transition-colors hover:bg-surface-2/30">
                  <div className="text-sm font-medium text-text-secondary">Optimality</div>
                  {ALGORITHMS.map(a => (
                    <div key={a.name} className="flex justify-center">
                      {a.optimal ? <Check className="w-5 h-5 text-accent-green" /> : <X className="w-5 h-5 text-accent-red" />}
                    </div>
                  ))}
                </div>

                {/* Nodes Expanded */}
                <div className="grid grid-cols-6 gap-4 p-6 items-center transition-colors hover:bg-surface-2/30">
                  <div className="text-sm font-medium text-text-secondary">Avg Nodes Expanded</div>
                  {ALGORITHMS.map(a => (
                    <div key={a.name} className="text-center text-lg font-mono text-white">
                      <AnimatedCounter value={a.nodes} />
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
