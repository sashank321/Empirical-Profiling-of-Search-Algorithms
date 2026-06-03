'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import ScrollReveal from './ScrollReveal'

gsap.registerPlugin(ScrollTrigger)

const ALGORITHMS = ['BFS', 'DFS', 'UCS', 'A*', 'Greedy']

// Dummy static graph to render for the showcase
const GRAPH_NODES = [
  { id: 'S', x: 10, y: 50 },
  { id: 'A', x: 35, y: 20 },
  { id: 'B', x: 35, y: 80 },
  { id: 'C', x: 65, y: 20 },
  { id: 'D', x: 65, y: 80 },
  { id: 'G', x: 90, y: 50 },
]

const GRAPH_EDGES = [
  { from: 'S', to: 'A', cost: 1 },
  { from: 'S', to: 'B', cost: 4 },
  { from: 'A', to: 'C', cost: 2 },
  { from: 'A', to: 'D', cost: 5 },
  { from: 'B', to: 'D', cost: 1 },
  { from: 'C', to: 'G', cost: 3 },
  { from: 'D', to: 'G', cost: 2 },
]

export default function ShowcaseSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeAlgo, setActiveAlgo] = useState('A*')
  
  // States for animation
  const [visited, setVisited] = useState<string[]>(['S'])
  const [frontier, setFrontier] = useState<string[]>(['A', 'B'])
  const [path, setPath] = useState<string[]>([])
  
  // Simple fake traversal animation when algo changes
  useEffect(() => {
    setVisited(['S'])
    setFrontier(['A', 'B'])
    setPath([])
    
    let step = 0
    const sequence = [
      () => { setVisited(['S', 'A']); setFrontier(['B', 'C', 'D']) },
      () => { setVisited(['S', 'A', 'C']); setFrontier(['B', 'D', 'G']) },
      () => { setVisited(['S', 'A', 'C', 'G']); setFrontier(['B', 'D']); setPath(['S', 'A', 'C', 'G']) },
    ]
    
    const interval = setInterval(() => {
      if (step < sequence.length) {
        sequence[step]()
        step++
      } else {
        clearInterval(interval)
      }
    }, 800)
    
    return () => clearInterval(interval)
  }, [activeAlgo])

  useEffect(() => {
    // Pin section during scroll to allow internal animations
    if (!sectionRef.current || !containerRef.current) return
    
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "+=100%",
        pin: true,
        scrub: 1,
      })
    }, sectionRef)
    
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative h-screen bg-surface-0 overflow-hidden flex items-center">
      <div className="absolute inset-0 bg-grid opacity-50" />
      
      <div className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Text Content */}
        <div className="lg:col-span-5">
          <ScrollReveal direction="right">
            <h2 className="text-4xl md:text-5xl font-medium text-white mb-6 tracking-tight text-balance">
              Visualize the <br/> <span className="text-accent-blue">Search Frontier</span>
            </h2>
            <p className="text-text-secondary text-lg leading-relaxed mb-8">
              Watch algorithms traverse networks in real-time. Understand the difference between uninformed depth-first exploration and heuristic-driven A* pathfinding through interactive topology mapping.
            </p>
            
            <div className="flex flex-wrap gap-3 mb-8">
              {ALGORITHMS.map(algo => (
                <button
                  key={algo}
                  onClick={() => setActiveAlgo(algo)}
                  className={`px-4 py-2 rounded-full text-xs font-mono font-medium transition-all ${
                    activeAlgo === algo 
                      ? 'bg-accent-blue text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-accent-blue' 
                      : 'glass-subtle text-text-tertiary hover:text-white border-subtle border'
                  }`}
                >
                  {algo}
                </button>
              ))}
            </div>
            
            <div className="glass-card rounded-xl p-5 border-l-4 border-l-accent-blue">
              <div className="text-xs uppercase tracking-widest text-text-tertiary mb-2">Live Status</div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-white font-medium mb-1">Nodes Expanded</div>
                  <div className="text-3xl font-mono text-white tracking-tight">{visited.length}</div>
                </div>
                <div className="text-right">
                  <div className="text-text-secondary mb-1">Frontier Size</div>
                  <div className="text-xl font-mono text-text-secondary">{frontier.length}</div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Graph Visualizer Area */}
        <div className="lg:col-span-7 relative" ref={containerRef}>
          <ScrollReveal delay={0.2} direction="left">
            <div className="aspect-square md:aspect-video w-full glass-panel rounded-2xl relative overflow-hidden flex items-center justify-center p-8">
              
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="drop-shadow-2xl overflow-visible">
                {/* Edges */}
                {GRAPH_EDGES.map((edge, i) => {
                  const source = GRAPH_NODES.find(n => n.id === edge.from)!
                  const target = GRAPH_NODES.find(n => n.id === edge.to)!
                  const isPath = path.includes(edge.from) && path.includes(edge.to)
                  const isVisited = visited.includes(edge.from) && visited.includes(edge.to)
                  
                  return (
                    <g key={i}>
                      <line 
                        x1={source.x} y1={source.y} x2={target.x} y2={target.y}
                        stroke={isPath ? "#ffffff" : isVisited ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.1)"}
                        strokeWidth={isPath ? 1.5 : 0.5}
                        className="transition-colors duration-500"
                      />
                      {/* Edge weight label */}
                      <circle cx={(source.x + target.x)/2} cy={(source.y + target.y)/2} r="3" fill="#111" />
                      <text 
                        x={(source.x + target.x)/2} y={(source.y + target.y)/2 + 1} 
                        fill="#888" fontSize="4" textAnchor="middle" dominantBaseline="middle" className="font-mono"
                      >
                        {edge.cost}
                      </text>
                    </g>
                  )
                })}
                
                {/* Nodes */}
                {GRAPH_NODES.map((node) => {
                  const isPath = path.includes(node.id)
                  const isVisited = visited.includes(node.id)
                  const isFrontier = frontier.includes(node.id)
                  
                  let fill = "#1a1a1a"
                  let stroke = "rgba(255,255,255,0.2)"
                  if (isPath) { fill = "#ffffff"; stroke = "#ffffff" }
                  else if (isVisited) { fill = "#1a1a1a"; stroke = "#3b82f6" }
                  else if (isFrontier) { fill = "#1a1a1a"; stroke = "#f59e0b" }
                  
                  return (
                    <g key={node.id} className="transition-all duration-500" style={{ transform: `translate(${node.x}px, ${node.y}px)` }}>
                      <circle 
                        r="6" 
                        fill={fill} 
                        stroke={stroke} 
                        strokeWidth={isPath ? "0" : "0.5"}
                        className="transition-colors duration-500"
                      />
                      <text 
                        fill={isPath ? "#000" : "#fff"} 
                        fontSize="4" 
                        textAnchor="middle" 
                        dominantBaseline="middle" 
                        className="font-mono font-bold"
                      >
                        {node.id}
                      </text>
                    </g>
                  )
                })}
              </svg>
              
              {/* Legend overlay */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 glass-subtle p-3 rounded-lg border-subtle">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-text-tertiary">
                  <div className="w-2 h-2 rounded-full border border-white/20" /> Unexplored
                </div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-accent-amber">
                  <div className="w-2 h-2 rounded-full border border-accent-amber" /> Frontier
                </div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-accent-blue">
                  <div className="w-2 h-2 rounded-full border border-accent-blue" /> Visited
                </div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white">
                  <div className="w-2 h-2 rounded-full bg-white" /> Path
                </div>
              </div>
              
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
