'use client'

import ScrollReveal from './ScrollReveal'
import { Search, Activity, Clock, Network, Route, BarChart3 } from 'lucide-react'

const FEATURES = [
  {
    icon: <Search className="w-6 h-6 text-accent-blue" />,
    title: 'Search Intelligence',
    description: 'Interactive execution of Uninformed and Heuristic search algorithms on complex topologies.'
  },
  {
    icon: <Activity className="w-6 h-6 text-accent-green" />,
    title: 'Constraint Satisfaction',
    description: 'Visualize Forward Checking, MRV, and LCV heuristics resolving N-Queens and Coloring problems.'
  },
  {
    icon: <Network className="w-6 h-6 text-accent-purple" />,
    title: 'Minimax & Alpha-Beta',
    description: 'Traverse adversarial game trees to understand branch pruning and state evaluation.'
  },
  {
    icon: <Route className="w-6 h-6 text-accent-amber" />,
    title: 'Bayesian Networks',
    description: 'Propagate probabilities across causal graphs to model decision making under uncertainty.'
  },
  {
    icon: <Clock className="w-6 h-6 text-white" />,
    title: 'Runtime Benchmarking',
    description: 'High-precision microsecond execution timing natively within the browser context.'
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-text-tertiary" />,
    title: 'Complexity Profiling',
    description: 'Track Peak Frontier Size, Nodes Expanded, and Branching Factor in real-time.'
  }
]

export default function FeaturesGrid() {
  return (
    <section className="py-32 bg-surface-1 relative">
      <div className="max-w-7xl mx-auto px-6">
        
        <ScrollReveal className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-medium text-white mb-6 tracking-tight">
            Complete <span className="text-text-tertiary">Feature Set</span>
          </h2>
        </ScrollReveal>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <ScrollReveal key={i} delay={i * 0.1} direction="up">
              <div 
                className="group h-full p-8 rounded-2xl glass-card hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-2 border border-subtle flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-white font-medium text-lg mb-3">{feature.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{feature.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
        
      </div>
    </section>
  )
}
