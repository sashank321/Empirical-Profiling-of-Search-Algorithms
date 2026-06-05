'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, Brain, BarChart3, ChevronRight } from 'lucide-react';
import HeroBackground from '@/components/hero/HeroBackground';

/* ── Mini Simulations ── */

const MiniSearchSim = () => {
  const [step, setStep] = useState(0);
  const nodes = [
    { id: 'A', x: 20, y: 50 },
    { id: 'B', x: 80, y: 20 },
    { id: 'C', x: 80, y: 80 },
    { id: 'D', x: 140, y: 50 },
  ];
  const edges = [
    ['A', 'B'],
    ['A', 'C'],
    ['B', 'D'],
    ['C', 'D'],
  ];
  
  type MiniStep = { current: string | null; visited: string[]; frontier: string[]; path: string[] };
  const steps: MiniStep[] = [
    { current: 'A', visited: [], frontier: ['B', 'C'], path: [] },
    { current: 'B', visited: ['A'], frontier: ['C', 'D'], path: [] },
    { current: 'C', visited: ['A', 'B'], frontier: ['D'], path: [] },
    { current: 'D', visited: ['A', 'B', 'C'], frontier: [], path: [] },
    { current: null, visited: ['A', 'B', 'C', 'D'], frontier: [], path: ['A', 'B', 'D'] },
  ];

  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % steps.length), 1200);
    return () => clearInterval(t);
  }, [steps.length]);

  const s = steps[step];

  return (
    <svg viewBox="0 0 160 100" className="w-full h-full">
      {edges.map(([u, v]) => {
        const n1 = nodes.find((n) => n.id === u)!;
        const n2 = nodes.find((n) => n.id === v)!;
        const isPath = s.path.includes(u) && s.path.includes(v);
        return (
          <line
            key={`${u}-${v}`}
            x1={n1.x}
            y1={n1.y}
            x2={n2.x}
            y2={n2.y}
            stroke={isPath ? '#ffffff' : 'rgba(255,255,255,0.1)'}
            strokeWidth={isPath ? 2 : 1}
            className="transition-all duration-500"
          />
        );
      })}
      {nodes.map((n) => {
        let fill = '#111111';
        let stroke = 'rgba(255,255,255,0.2)';
        if (n.id === 'A') { fill = '#22c55e'; stroke = '#4ade80'; }
        else if (n.id === 'D') { fill = '#ef4444'; stroke = '#f87171'; }
        else if (s.path.includes(n.id)) { fill = '#ffffff'; stroke = '#ffffff'; }
        else if (s.current === n.id) { fill = '#3b82f6'; stroke = '#60a5fa'; }
        else if (s.frontier.includes(n.id)) { fill = '#111111'; stroke = '#f59e0b'; }
        else if (s.visited.includes(n.id)) { fill = '#111111'; stroke = '#3b82f6'; }

        return (
          <g key={n.id}>
            <circle
              cx={n.x}
              cy={n.y}
              r={12}
              fill={fill}
              stroke={stroke}
              strokeWidth={1.5}
              className="transition-all duration-500"
            />
            <text
              x={n.x}
              y={n.y + 3}
              textAnchor="middle"
              className="text-[8px] font-mono font-medium"
              fill={s.path.includes(n.id) || n.id === 'A' || n.id === 'D' || s.current === n.id ? '#000' : '#fff'}
            >
              {n.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const MiniConstraintSim = () => {
  const [step, setStep] = useState(0);
  const steps = [
    [0, -1, -1, -1],
    [0, 2, -1, -1],
    [0, 3, -1, -1],
    [0, 3, 1, -1],
    [1, 3, 0, 2], // Solution
  ];

  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % steps.length), 1000);
    return () => clearInterval(t);
  }, [steps.length]);

  const board = steps[step];

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="grid grid-cols-4 gap-1">
        {Array.from({ length: 16 }).map((_, i) => {
          const row = Math.floor(i / 4);
          const col = i % 4;
          const hasQueen = board[col] === row;
          const isConflict =
            hasQueen && step < steps.length - 1 && col === step - 1; // Simplify conflict visual

          return (
            <div
              key={i}
              className={`w-8 h-8 rounded flex items-center justify-center text-sm transition-colors duration-300 ${
                (row + col) % 2 === 0 ? 'bg-surface-2' : 'bg-surface-1'
              } ${isConflict ? 'border border-accent-red/50 bg-accent-red/10' : ''}`}
            >
              {hasQueen && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={step === steps.length - 1 ? 'text-accent-green' : 'text-white'}
                >
                  ♛
                </motion.span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MiniDecisionSim = () => {
  const [step, setStep] = useState(0);
  
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % 4), 1200);
    return () => clearInterval(t);
  }, []);

  const valRoot = step >= 3 ? 5 : '?';
  const valL = step >= 1 ? 3 : '?';
  const valR = step >= 2 ? 5 : '?';

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6 relative pt-4">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <line x1="50%" y1="20%" x2="25%" y2="65%" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
        <line x1="50%" y1="20%" x2="75%" y2="65%" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
      </svg>
      <div className="w-10 h-10 rounded-full bg-surface-1 border border-accent-blue/30 flex items-center justify-center z-10 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white font-mono text-xs">
        {valRoot}
      </div>
      <div className="flex gap-16 z-10">
        <div className="w-8 h-8 rounded-full bg-surface-2 border border-accent-red/30 flex items-center justify-center text-white font-mono text-xs">
          {valL}
        </div>
        <div className="w-8 h-8 rounded-full bg-surface-2 border border-accent-red/30 flex items-center justify-center text-white font-mono text-xs">
          {valR}
        </div>
      </div>
    </div>
  );
};

const MiniBayesSim = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % 2), 2000);
    return () => clearInterval(t);
  }, []);

  const isPrior = step === 0;

  return (
    <div className="w-full h-full flex flex-col justify-center px-8 gap-6">
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono text-text-secondary">
          <span>Prior P(H)</span>
          <span>1.0%</span>
        </div>
        <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
          <div className="h-full bg-text-tertiary rounded-full" style={{ width: '1%' }} />
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono">
          <span className={isPrior ? 'text-text-secondary' : 'text-accent-blue'}>Posterior P(H|E)</span>
          <span className={isPrior ? 'text-text-secondary' : 'text-white'}>
            {isPrior ? '...' : '16.1%'}
          </span>
        </div>
        <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-accent-blue rounded-full" 
            initial={{ width: '1%' }}
            animate={{ width: isPrior ? '1%' : '16.1%' }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </div>
  );
};

/* ── Main Page ── */

export default function HomePage() {
  const [activePreview, setActivePreview] = useState<'search' | 'constraint' | 'decision' | 'uncertainty'>('search');

  const previews = {
    search: { title: 'Search Intelligence', desc: 'Graph traversal and heuristic pathfinding', comp: <MiniSearchSim /> },
    constraint: { title: 'Constraint Intelligence', desc: 'CSP backtracking and arc consistency', comp: <MiniConstraintSim /> },
    decision: { title: 'Decision Intelligence', desc: 'Minimax game trees and alpha-beta pruning', comp: <MiniDecisionSim /> },
    uncertainty: { title: 'Uncertainty Intelligence', desc: 'Bayesian networks and sensor fusion', comp: <MiniBayesSim /> },
  };

  const labs = [
    { id: 'search', icon: Search, title: 'Search Intelligence Lab', href: '/search', badge: '8 Algorithms' },
    { id: 'constraint', icon: Shield, title: 'Constraint Intelligence Lab', href: '/constraints', badge: 'CSP Engine' },
    { id: 'decision', icon: Brain, title: 'Decision Intelligence Lab', href: '/decisions', badge: 'Game Theory' },
    { id: 'uncertainty', icon: BarChart3, title: 'Uncertainty Intelligence Lab', href: '/uncertainty', badge: 'Probabilistic' },
  ];

  const frameworks = [
    'Next.js', 'React', 'TypeScript', 'Flask', 'Python', 'NetworkX', 'NumPy', 'Framer Motion', 'Three.js'
  ];

  return (
    <div className="relative min-h-screen bg-transparent text-white overflow-hidden selection:bg-white/10">
      
      {/* 3D Background */}
      <HeroBackground />

      {/* Navbar (Minimal) */}
      <nav className="fixed top-0 left-0 right-0 p-6 flex justify-center z-50 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-surface-1/30 backdrop-blur-md px-6 py-2 rounded-full border border-[rgba(255,255,255,0.05)] shadow-lg">
          <span className="shimmer-text text-sm font-semibold tracking-[0.3em] uppercase">CORTEX</span>
          <span className="text-sm font-light tracking-[0.3em] uppercase text-text-secondary">AI</span>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-6 flex flex-col items-center relative z-10">
        
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
          >
            <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-6 leading-tight drop-shadow-2xl">
              Interactive Intelligence <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-400 to-neutral-600 font-serif italic tracking-normal">
                Visualized.
              </span>
            </h1>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-base md:text-lg text-text-tertiary max-w-2xl font-light tracking-wide leading-relaxed drop-shadow-md"
          >
            A comprehensive suite of artificial intelligence algorithms explored through stunning, real-time interactive simulations.
          </motion.p>
        </div>

        {/* Framework Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-3 max-w-3xl mb-24"
        >
          {frameworks.map((fw, i) => (
            <motion.span 
              key={fw}
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
              className="px-4 py-1.5 rounded-full text-xs font-mono text-text-secondary bg-surface-1/40 border border-[rgba(255,255,255,0.08)] backdrop-blur-md shadow-lg cursor-default transition-colors duration-300"
            >
              {fw}
            </motion.span>
          ))}
        </motion.div>

        {/* Live Preview Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.19, 1, 0.22, 1] }}
          className="w-full max-w-5xl bg-surface-1/40 border border-[rgba(255,255,255,0.1)] rounded-3xl p-2 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] mb-24"
        >
          <div className="flex flex-col md:flex-row h-[360px]">
            {/* Tabs */}
            <div className="w-full md:w-1/3 p-2 flex flex-col gap-2 border-b md:border-b-0 md:border-r border-[rgba(255,255,255,0.06)]">
              {Object.entries(previews).map(([key, data]) => (
                <button
                  key={key}
                  onMouseEnter={() => setActivePreview(key as any)}
                  onClick={() => setActivePreview(key as any)}
                  className={`text-left px-5 py-4 rounded-2xl transition-all duration-300 ${
                    activePreview === key 
                      ? 'bg-surface-2 shadow-sm border border-[rgba(255,255,255,0.05)]' 
                      : 'hover:bg-surface-2/50 text-text-secondary border border-transparent'
                  }`}
                >
                  <h3 className={`text-sm font-medium mb-1 tracking-wide ${activePreview === key ? 'text-white drop-shadow-md' : ''}`}>
                    {data.title}
                  </h3>
                  <p className="text-[11px] text-text-tertiary leading-relaxed">
                    {data.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* Simulation Area */}
            <div className="w-full md:w-2/3 relative overflow-hidden rounded-r-2xl bg-[#020202]/50 shadow-inner">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePreview}
                  initial={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center p-8"
                >
                  {previews[activePreview].comp}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Lab Modules Grid */}
        <div className="w-full max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-8 px-2">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[rgba(255,255,255,0.1)]" />
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-text-tertiary drop-shadow-md">
              Explore Modules
            </span>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[rgba(255,255,255,0.1)]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {labs.map((lab, i) => {
              const Icon = lab.icon;
              return (
                <motion.div
                  key={lab.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.19, 1, 0.22, 1] }}
                >
                  <Link href={lab.href} className="block group h-full">
                    <div className="h-full bg-surface-1/60 backdrop-blur-md border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 transition-all duration-500 hover:bg-surface-2 hover:border-[rgba(255,255,255,0.15)] hover:-translate-y-1 relative overflow-hidden shadow-lg">
                      {/* Hover glow */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/[0.05] to-transparent transition-opacity duration-500 pointer-events-none" />
                      
                      <div className="flex flex-col h-full relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-[#020202] border border-[rgba(255,255,255,0.1)] flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 group-hover:border-white/20 transition-all duration-500">
                          <Icon className="w-4 h-4 text-text-secondary group-hover:text-white transition-colors duration-300" />
                        </div>
                        
                        <h3 className="text-sm font-medium tracking-wide text-white mb-2 drop-shadow-sm">
                          {lab.title}
                        </h3>
                        
                        <div className="mt-auto pt-6 flex items-center justify-between">
                          <span className="text-[10px] font-medium tracking-wider uppercase text-text-tertiary group-hover:text-text-secondary transition-colors duration-300">
                            {lab.badge}
                          </span>
                          <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="py-8 text-center relative z-10">
        <span className="text-text-muted text-[10px] tracking-widest uppercase">
          © 2026 CORTEX AI
        </span>
      </footer>
    </div>
  );
}
