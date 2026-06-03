'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowRight, Github } from 'lucide-react'
import MagneticButton from './MagneticButton'
import AnimatedCounter from './AnimatedCounter'
import ScrollReveal from './ScrollReveal'

// Dynamically import Three.js components to prevent SSR errors and reduce initial bundle size
const ParticleField = dynamic(() => import('./ParticleField'), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface-3 via-surface-1 to-surface-0" />
})
const ShaderBackground = dynamic(() => import('./ShaderBackground'), { ssr: false })

const WORDS = ['Analyze', 'Benchmark', 'Simulate', 'Compare', 'Optimize']

export default function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % WORDS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-32">
      {/* Background Layers */}
      <ShaderBackground />
      <ParticleField />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col items-center">
        
        {/* Top Tag */}
        <ScrollReveal direction="down" delay={0.1}>
          <div className="glass-subtle inline-flex items-center gap-2 px-3 py-1 rounded-full border-subtle mb-8">
            <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse-subtle" />
            <span className="text-xs font-mono text-text-secondary uppercase tracking-widest">
              Platform v1.0.0
            </span>
          </div>
        </ScrollReveal>

        {/* Main Headline */}
        <ScrollReveal delay={0.2} className="text-center mb-6">
          <h1 className="text-5xl md:text-7xl font-medium tracking-tight text-white mb-4 text-balance">
            Empirical Profiling of <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-text-tertiary">
              Search Algorithms
            </span>
          </h1>
          
          <div className="h-12 md:h-16 flex items-center justify-center text-3xl md:text-4xl font-light text-text-secondary">
            <span className="mr-3">A unified platform to</span>
            <div className="relative w-[180px] text-left">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={wordIndex}
                  initial={{ y: 20, opacity: 0, rotateX: -90 }}
                  animate={{ y: 0, opacity: 1, rotateX: 0 }}
                  exit={{ y: -20, opacity: 0, rotateX: 90 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute text-white font-medium"
                >
                  {WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </ScrollReveal>

        {/* Glass Action Panel */}
        <ScrollReveal delay={0.4} className="w-full max-w-3xl mt-8">
          <div className="glass-panel rounded-2xl p-8 md:p-10 text-center relative overflow-hidden group">
            {/* Subtle glow effect on hover inside the card */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <p className="text-text-secondary text-lg leading-relaxed mb-8 text-balance max-w-2xl mx-auto relative z-10">
              Interactive visualization and reasoning intelligence for <b className="text-white font-medium">Search</b>, <b className="text-white font-medium">Constraints</b>, <b className="text-white font-medium">Decision Making</b>, and <b className="text-white font-medium">Uncertainty</b>. Built for enterprise analysis.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link href="/search" passHref legacyBehavior>
                <MagneticButton variant="primary" className="w-full sm:w-auto h-12 px-8">
                  Launch Platform <ArrowRight className="w-4 h-4 ml-1" />
                </MagneticButton>
              </Link>
              
              <Link href="https://github.com" target="_blank" passHref legacyBehavior>
                <MagneticButton variant="secondary" className="w-full sm:w-auto h-12 px-8">
                  <Github className="w-4 h-4 mr-2" /> View Source
                </MagneticButton>
              </Link>
            </div>
          </div>
        </ScrollReveal>

        {/* Metrics Strip */}
        <ScrollReveal delay={0.6} direction="up" className="mt-20 w-full max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-px md:bg-border/50 rounded-xl overflow-hidden glass-card">
            {[
              { label: "Algorithms", value: 8, prefix: "" },
              { label: "Operations tracked", value: 10, suffix: "M+", prefix: "" },
              { label: "Heuristics", value: 4, suffix: "", prefix: "" },
              { label: "Latency", value: 16, suffix: "ms", prefix: "< " },
            ].map((stat, i) => (
              <div key={i} className="bg-surface-1/80 backdrop-blur-md p-6 text-center">
                <div className="text-3xl font-light text-white mb-1 font-mono tracking-tight">
                  <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </div>
                <div className="text-xs uppercase tracking-widest text-text-tertiary">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

      </div>
      
      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-50"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-[1px] h-12 bg-gradient-to-b from-text-muted to-transparent mb-2" />
        <span className="text-[10px] uppercase tracking-widest text-text-tertiary">Scroll</span>
      </motion.div>
    </section>
  )
}
