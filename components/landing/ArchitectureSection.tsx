'use client'

import ScrollReveal from './ScrollReveal'
import { motion } from 'framer-motion'
import { Database, Layout, Settings, Terminal } from 'lucide-react'

const TIERS = [
  {
    id: 'frontend',
    title: 'Frontend Visualization',
    icon: <Layout className="w-5 h-5" />,
    tech: 'Next.js 14 · React 18 · Three.js',
    description: 'Hardware-accelerated graphics rendering algorithm states via React Three Fiber and GSAP choreography.'
  },
  {
    id: 'api',
    title: 'API Gateway',
    icon: <Terminal className="w-5 h-5" />,
    tech: 'TypeScript · Next API Routes',
    description: 'Typed interfaces bridging the visualization layer with algorithmic execution context.'
  },
  {
    id: 'engine',
    title: 'Algorithm Engine',
    icon: <Settings className="w-5 h-5" />,
    tech: 'Pure TypeScript (ES2020)',
    description: 'Zero-dependency core implementing BFS, A*, CSP, and Bayesian networks running in browser.'
  },
  {
    id: 'data',
    title: 'State & Constraints',
    icon: <Database className="w-5 h-5" />,
    tech: 'Immutable Data Structures',
    description: 'Generators for N-Queens, Graph Coloring, and Navigation meshes with reproducible states.'
  }
]

export default function ArchitectureSection() {
  return (
    <section className="py-32 bg-surface-0 relative">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div>
            <ScrollReveal>
              <h2 className="text-3xl md:text-5xl font-medium text-white mb-6 tracking-tight">
                Built on <span className="text-accent-purple">Modern Stack</span>
              </h2>
              <p className="text-text-secondary text-lg mb-10 leading-relaxed">
                The platform is designed with a strict separation of concerns. The algorithmic engine runs entirely client-side, enabling zero-latency step-by-step execution analysis without network overhead.
              </p>
            </ScrollReveal>
            
            <div className="space-y-4 relative">
              {/* Connecting line behind items */}
              <div className="absolute left-[27px] top-8 bottom-8 w-px bg-gradient-to-b from-accent-purple/50 via-border to-transparent" />
              
              {TIERS.map((tier, i) => (
                <ScrollReveal key={tier.id} delay={i * 0.15} direction="up">
                  <div className="flex gap-6 items-start group">
                    <div className="w-14 h-14 rounded-full bg-surface-1 border border-subtle flex items-center justify-center shrink-0 relative z-10 group-hover:border-accent-purple transition-colors">
                      <div className="text-text-secondary group-hover:text-accent-purple transition-colors">
                        {tier.icon}
                      </div>
                    </div>
                    <div className="pt-2 pb-6">
                      <h3 className="text-white font-medium text-lg mb-1">{tier.title}</h3>
                      <div className="text-xs font-mono text-accent-purple mb-2 uppercase tracking-wider">{tier.tech}</div>
                      <p className="text-text-tertiary text-sm leading-relaxed">{tier.description}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
          
          <ScrollReveal direction="left" delay={0.3}>
            <div className="glass-panel rounded-2xl border-subtle p-6 overflow-hidden relative">
              {/* Fake window controls */}
              <div className="flex gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-surface-3" />
                <div className="w-3 h-3 rounded-full bg-surface-3" />
                <div className="w-3 h-3 rounded-full bg-surface-3" />
              </div>
              
              <pre className="text-[13px] font-mono leading-relaxed overflow-x-auto">
                <code className="text-text-secondary">
                  <span className="text-accent-purple">export function</span> <span className="text-accent-blue">aStar</span>(
                  <br/>  adjacency: AdjacencyList,
                  <br/>  start: <span className="text-accent-green">string</span>,
                  <br/>  goal: <span className="text-accent-green">string</span>,
                  <br/>  heuristic: Record&lt;<span className="text-accent-green">string</span>, <span className="text-accent-green">number</span>&gt;
                  <br/>): SearchResult {'{'}
                  <br/>  <span className="text-text-tertiary">// Initialize priority queue by f(n) = g(n) + h(n)</span>
                  <br/>  <span className="text-accent-purple">const</span> frontier = <span className="text-accent-purple">new</span> PriorityQueue()
                  <br/>  <span className="text-accent-purple">const</span> cameFrom = <span className="text-accent-purple">new</span> Map()
                  <br/>  <span className="text-accent-purple">const</span> costSoFar = <span className="text-accent-purple">new</span> Map()
                  <br/>
                  <br/>  frontier.put(start, <span className="text-accent-amber">0</span>)
                  <br/>  costSoFar.set(start, <span className="text-accent-amber">0</span>)
                  <br/>
                  <br/>  <span className="text-accent-purple">while</span> (!frontier.empty()) {'{'}
                  <br/>    <span className="text-accent-purple">const</span> current = frontier.get()
                  <br/>    <span className="text-accent-purple">if</span> (current === goal) <span className="text-accent-purple">break</span>
                  <br/>    
                  <br/>    <span className="text-text-tertiary">// ... expansion logic</span>
                  <br/>  {'}'}
                  <br/>{'}'}
                </code>
              </pre>
              
              {/* Overlay gradient to fade bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[rgba(15,15,15,0.6)] to-transparent pointer-events-none" />
            </div>
          </ScrollReveal>
          
        </div>
      </div>
    </section>
  )
}
