'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, RotateCcw, Grid3X3, Palette, CalendarClock, Keyboard,
  ChevronRight, Activity, Clock, Hash, AlertTriangle,
  Zap, CheckCircle2, XCircle, SkipForward, Pause,
} from 'lucide-react';
import CommandBar from '@/components/ui/CommandBar';

import { fetchWithFallback, type Engine } from '@/lib/config';
import { CSPStep, CSPResult } from '@/lib/types';
import {
  solveCSP,
  createNQueens,
  createGraphColoring,
  createTimetable,
  DEFAULT_GRAPH_NODES,
  DEFAULT_GRAPH_EDGES,
  CSPSetup,
  CSPOptions,
  createCryptarithmetic,
} from '@/lib/algorithms/csp';

// Import extracted visualization components
import NQueensBoard from '@/components/constraints/NQueensBoard';
import GraphColoringViz from '@/components/constraints/GraphColoringViz';
import TimetableGrid from '@/components/constraints/TimetableGrid';
import CryptarithmeticViz from '@/components/constraints/CryptarithmeticViz';

/* ════════════════════════════════════════════
   Types
   ════════════════════════════════════════════ */

type ProblemType = 'nqueens' | 'coloring' | 'timetable' | 'cryptarithmetic';

interface ToggleState {
  forwardChecking: boolean;
  mrv: boolean;
  lcv: boolean;
  ac3: boolean;
}

/* ════════════════════════════════════════════
   Constants
   ════════════════════════════════════════════ */

const PROBLEM_OPTIONS: { id: ProblemType; label: string; icon: React.ReactNode; industryLabel: string }[] = [
  { id: 'nqueens', label: 'N-Queens', industryLabel: 'Drone Sector Mapping', icon: <Grid3X3 size={16} /> },
  { id: 'coloring', label: 'Graph Coloring', industryLabel: 'Frequency Allocation', icon: <Palette size={16} /> },
  { id: 'timetable', label: 'Timetabling', industryLabel: 'Gate Scheduling', icon: <CalendarClock size={16} /> },
  { id: 'cryptarithmetic', label: 'Cryptarithmetic', industryLabel: 'Resource Recon', icon: <Keyboard size={16} /> },
];

/* ════════════════════════════════════════════
   Shared Sub-components
   ════════════════════════════════════════════ */

function Toggle({ label, enabled, onChange, locked }: { label: string; enabled: boolean; onChange?: () => void; locked?: boolean }) {
  return (
    <button
      onClick={locked ? undefined : onChange}
      className={`flex items-center justify-between w-full px-3 py-2 rounded-xl transition-all duration-200 ${
        locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-3'
      }`}
    >
      <span className="text-sm text-text-secondary">{label}</span>
      <div
        className={`w-9 h-5 rounded-full transition-all duration-200 flex items-center px-0.5 ${
          enabled ? 'bg-accent-blue justify-end' : 'bg-surface-2 justify-start'
        }`}
      >
        <div className={`w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm`} />
      </div>
    </button>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-surface-1 border border-subtle rounded-xl p-3 flex flex-col gap-1 shadow-sm">
      <div className="flex items-center gap-1.5 text-text-tertiary">
        {icon}
        <span className="text-[11px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <span className="text-lg font-mono font-semibold text-white">{value}</span>
    </div>
  );
}

/* ════════════════════════════════════════════
   CSP State Panel (Domain Watch)
   ════════════════════════════════════════════ */

function CSPStatePanel({ variables, domains, assignments }: {
  variables: string[];
  domains: Record<string, (number | string)[]>;
  assignments: Record<string, number | string>;
}) {
  return (
    <div className="bg-surface-1 border border-subtle rounded-xl p-4 flex flex-col gap-2 shadow-sm">
      <h3 className="text-xs uppercase tracking-wider text-text-tertiary font-medium mb-1">CSP State — Domains</h3>
      <div className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto">
        {variables.map(v => {
          const isAssigned = v in assignments;
          const domainValues = domains[v] || [];
          return (
            <div key={v} className="flex items-center gap-2">
              <span className={`text-xs font-mono w-16 flex-shrink-0 ${isAssigned ? 'text-accent-green' : 'text-text-secondary'}`}>
                {v}
              </span>
              {isAssigned ? (
                <span className="text-xs font-mono text-accent-green">= {assignments[v]}</span>
              ) : (
                <div className="flex flex-wrap gap-0.5">
                  {domainValues.map((d, i) => (
                    <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 bg-surface-3 rounded text-text-tertiary border border-surface-3">
                      {d}
                    </span>
                  ))}
                  {domainValues.length === 0 && (
                    <span className="text-[10px] font-mono text-accent-red font-bold">∅ DWO</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   Reasoning Timeline
   ════════════════════════════════════════════ */

function ReasoningTimeline({ steps, currentStep }: { steps: CSPStep[]; currentStep: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [currentStep]);

  const visibleSteps = steps.slice(0, currentStep + 1);

  const actionIcon = (action: string) => {
    switch (action) {
      case 'assign': return <CheckCircle2 size={12} className="text-accent-green flex-shrink-0" />;
      case 'backtrack': return <XCircle size={12} className="text-accent-red flex-shrink-0" />;
      case 'prune': return <AlertTriangle size={12} className="text-accent-amber flex-shrink-0" />;
      default: return <Activity size={12} className="text-accent-blue flex-shrink-0" />;
    }
  };

  const actionColor = (action: string) => {
    switch (action) {
      case 'assign': return 'text-accent-green';
      case 'backtrack': return 'text-accent-red';
      case 'prune': return 'text-accent-amber';
      default: return 'text-accent-blue';
    }
  };

  return (
    <div className="bg-surface-1 border-t border-subtle flex flex-col h-[240px]">
      <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between shadow-sm">
        <h3 className="text-xs uppercase tracking-wider text-text-tertiary font-medium">Reasoning Timeline</h3>
        <span className="text-[10px] font-mono text-text-tertiary">
          {visibleSteps.length}/{steps.length} steps
        </span>
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
        {visibleSteps.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-tertiary text-xs">
            Run the solver to see reasoning steps
          </div>
        ) : (
          visibleSteps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className={`flex items-start gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-200 ${
                i === currentStep ? 'bg-surface-3 shadow-inner' : 'hover:bg-surface-2'
              }`}
            >
              <div className="mt-0.5">{actionIcon(step.action)}</div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className={`font-mono font-medium ${actionColor(step.action)}`}>
                  {step.variable}={String(step.value)} — {step.action}
                </span>
                <span className="text-text-tertiary text-[11px] truncate">{step.reason}</span>
              </div>
              <span className="ml-auto text-[10px] text-text-muted font-mono flex-shrink-0">#{step.step}</span>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   Main Page
   ════════════════════════════════════════════ */

export default function ConstraintIntelligenceLabPage() {
  /* ── State ── */
  const [problem, setProblem] = useState<ProblemType>('nqueens');
  const [appMode, setAppMode] = useState<'academic' | 'industry'>('academic');
  
  const [nQueensSize, setNQueensSize] = useState(8);
  const [nColors, setNColors] = useState(3);
  
  const [cryptoWords, setCryptoWords] = useState({ word1: 'SEND', word2: 'MORE', resultWord: 'MONEY' });
  
  const [toggles, setToggles] = useState<ToggleState>({
    forwardChecking: false,
    mrv: false,
    lcv: false,
    ac3: false,
  });
  
  const [speed, setSpeed] = useState(50);
  const [result, setResult] = useState<CSPResult | null>(null);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSolving, setIsSolving] = useState(false);

  const animFrameRef = useRef<number | null>(null);
  const playingRef = useRef(false);

  /* ── Derived ── */
  const currentStepData = result && currentStep >= 0 && currentStep < result.steps.length
    ? result.steps[currentStep]
    : null;

  const currentAssignments: Record<string, number | string> = currentStepData?.assignments || {};
  const currentDomains: Record<string, (number | string)[]> = currentStepData?.domains || {};

  const variables = result?.steps[0]
    ? Object.keys(result.steps[0].domains)
    : [];

  /* ── N-Queens conflicts ── */
  const nqueensConflicts = new Set<string>();
  if (problem === 'nqueens') {
    const assigned = Object.entries(currentAssignments);
    for (let i = 0; i < assigned.length; i++) {
      const [v1, r1] = assigned[i];
      const c1 = parseInt(v1.slice(1));
      for (let j = i + 1; j < assigned.length; j++) {
        const [v2, r2] = assigned[j];
        const c2 = parseInt(v2.slice(1));
        if (Number(r1) === Number(r2) || Math.abs(Number(r1) - Number(r2)) === Math.abs(c1 - c2)) {
          nqueensConflicts.add(v1);
          nqueensConflicts.add(v2);
        }
      }
    }
  }

  /* ── Playback ── */
  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    playingRef.current = false;
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const startPlayback = useCallback(() => {
    if (!result || result.steps.length === 0) return;
    setIsPlaying(true);
    playingRef.current = true;

    let lastTime = 0;
    const interval = Math.max(20, 600 - speed * 5.5);

    const tick = (timestamp: number) => {
      if (!playingRef.current) return;
      if (timestamp - lastTime >= interval) {
        lastTime = timestamp;
        setCurrentStep(prev => {
          const next = prev + 1;
          if (next >= (result?.steps.length ?? 0)) {
            playingRef.current = false;
            setIsPlaying(false);
            return prev;
          }
          return next;
        });
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, [result, speed]);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [isPlaying, stopPlayback, startPlayback]);

  /* ── Solve ── */
  const handleSolve = useCallback(async () => {
    stopPlayback();
    setIsSolving(true);

    const options: CSPOptions = {
      useForwardChecking: toggles.forwardChecking,
      useMRV: toggles.mrv,
      useLCV: toggles.lcv,
      useAC3: toggles.ac3,
    };

    let problemKey = problem as string;
    if (problem === 'nqueens') problemKey = 'n_queens';
    if (problem === 'coloring') problemKey = 'graph_coloring';
    if (problem === 'timetable') problemKey = 'timetabling';

    try {
      const localFallback = (): CSPResult => {
        let setup: CSPSetup;
        if (problem === 'nqueens') setup = createNQueens(nQueensSize);
        else if (problem === 'coloring') setup = createGraphColoring(DEFAULT_GRAPH_NODES, DEFAULT_GRAPH_EDGES, nColors);
        else if (problem === 'cryptarithmetic') setup = createCryptarithmetic(cryptoWords.word1, cryptoWords.word2, cryptoWords.resultWord);
        else setup = createTimetable();
        return solveCSP(setup.variables, setup.domains, setup.isConsistent, options);
      };
      
      const payload: any = {
        problem: problemKey,
        options: options
      };
      
      if (problem === 'nqueens') payload.n = nQueensSize;
      if (problem === 'coloring') {
        payload.nodes = DEFAULT_GRAPH_NODES;
        payload.edges = DEFAULT_GRAPH_EDGES;
        payload.nColors = nColors;
      }
      if (problem === 'cryptarithmetic') {
        payload.word1 = cryptoWords.word1;
        payload.word2 = cryptoWords.word2;
        payload.result_word = cryptoWords.resultWord;
      }

      const { data: cspResult, engine } = await fetchWithFallback<CSPResult>(
        '/api/csp/execute',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        },
        localFallback
      );
      setEngineType(engine);

      setResult(cspResult);
      setCurrentStep(-1);
      setIsSolving(false);

      setTimeout(() => {
        setCurrentStep(0);
        playingRef.current = true;
        setIsPlaying(true);

        let lastTime = 0;
        const interval = Math.max(20, 600 - speed * 5.5);

        const tick = (timestamp: number) => {
          if (!playingRef.current) return;
          if (timestamp - lastTime >= interval) {
            lastTime = timestamp;
            setCurrentStep(prev => {
              const next = prev + 1;
              if (next >= cspResult.steps.length) {
                playingRef.current = false;
                setIsPlaying(false);
                return prev;
              }
              return next;
            });
          }
          animFrameRef.current = requestAnimationFrame(tick);
        };
        animFrameRef.current = requestAnimationFrame(tick);
      }, 100);
    } catch (err) {
      console.error("Failed to execute CSP solver:", err);
      setIsSolving(false);
    }
  }, [problem, nQueensSize, nColors, cryptoWords, toggles, stopPlayback, speed]);

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    stopPlayback();
    setResult(null);
    setCurrentStep(-1);
  }, [stopPlayback]);

  /* ── Cleanup ── */
  useEffect(() => {
    return () => {
      playingRef.current = false;
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const [engineType, setEngineType] = useState<Engine | null>(null);

  /* ── Render ── */
  return (
    <div className="h-screen bg-surface-0 flex flex-col overflow-hidden">

      <CommandBar 
        module="Constraint Intelligence Lab" 
        engineIndicator={engineType}
        mode={appMode}
        onModeChange={setAppMode}
      />

      {/* ── Main Layout ── */}
      <div className="flex-1 flex overflow-hidden pt-14">

        {/* ── Left Panel ── */}
        <aside className="w-[300px] flex-shrink-0 border-r border-subtle bg-surface-0/80 backdrop-blur-xl flex flex-col overflow-y-auto shadow-[4px_0_24px_rgba(0,0,0,0.2)] z-10">
          <div className="p-5 flex flex-col gap-6">

            {/* Problem Selector */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] uppercase tracking-wider text-text-tertiary font-medium">Simulation Subject</span>
              <div className="flex flex-col gap-1.5">
                {PROBLEM_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setProblem(opt.id); handleReset(); }}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-300 ${
                      problem === opt.id
                        ? 'bg-surface-3 text-white shadow-inner border border-[rgba(255,255,255,0.05)]'
                        : 'text-text-secondary hover:bg-surface-2 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className={problem === opt.id ? 'text-accent-blue' : 'text-text-tertiary'}>
                      {opt.icon}
                    </div>
                    {appMode === 'industry' ? opt.industryLabel : opt.label}
                    {problem === opt.id && <ChevronRight size={14} className="ml-auto text-text-tertiary" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Problem-specific Config */}
            <div className="min-h-[60px]">
              <AnimatePresence mode="wait">
                {problem === 'nqueens' && (
                  <motion.div
                    key="nqueens-config"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex flex-col gap-2.5"
                  >
                    <span className="text-[11px] uppercase tracking-wider text-text-tertiary font-medium">Grid Size</span>
                    <div className="flex items-center gap-3 bg-surface-1 p-3 rounded-xl border border-subtle">
                      <input
                        type="range" min={4} max={12} value={nQueensSize}
                        onChange={e => setNQueensSize(Number(e.target.value))}
                        className="flex-1 accent-accent-blue h-1.5 bg-surface-3 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-blue [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                      />
                      <span className="text-sm font-mono text-white w-6 text-right bg-surface-2 px-1 rounded">{nQueensSize}</span>
                    </div>
                  </motion.div>
                )}
                {problem === 'coloring' && (
                  <motion.div
                    key="coloring-config"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex flex-col gap-2.5"
                  >
                    <span className="text-[11px] uppercase tracking-wider text-text-tertiary font-medium">Allocations</span>
                    <div className="flex gap-2 p-1.5 bg-surface-1 border border-subtle rounded-xl">
                      {[3, 4, 5].map(c => (
                        <button
                          key={c}
                          onClick={() => setNColors(c)}
                          className={`flex-1 py-1.5 rounded-lg text-sm font-mono transition-all duration-200 ${
                            nColors === c ? 'bg-accent-blue text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)]' : 'text-text-secondary hover:bg-surface-2 hover:text-white'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
                {problem === 'cryptarithmetic' && (
                  <motion.div
                    key="crypto-config"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex flex-col gap-2.5"
                  >
                    <span className="text-[11px] uppercase tracking-wider text-text-tertiary font-medium">Expression</span>
                    <div className="flex flex-col gap-2 bg-surface-1 p-3 rounded-xl border border-subtle text-xs font-mono">
                      <div className="flex items-center gap-2">
                         <span className="w-8 text-text-tertiary text-right">+</span>
                         <input value={cryptoWords.word1} onChange={e => setCryptoWords({...cryptoWords, word1: e.target.value.toUpperCase()})} className="bg-surface-3 text-white px-2 py-1 rounded w-full outline-none focus:border-accent-blue border border-transparent transition-colors" />
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="w-8 text-text-tertiary text-right">+</span>
                         <input value={cryptoWords.word2} onChange={e => setCryptoWords({...cryptoWords, word2: e.target.value.toUpperCase()})} className="bg-surface-3 text-white px-2 py-1 rounded w-full outline-none focus:border-accent-blue border border-transparent transition-colors" />
                      </div>
                      <div className="h-[1px] bg-surface-3 w-full my-1"></div>
                      <div className="flex items-center gap-2">
                         <span className="w-8 text-text-tertiary text-right">=</span>
                         <input value={cryptoWords.resultWord} onChange={e => setCryptoWords({...cryptoWords, resultWord: e.target.value.toUpperCase()})} className="bg-surface-3 text-accent-blue font-bold px-2 py-1 rounded w-full outline-none focus:border-accent-blue border border-transparent transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Technique Toggles */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-text-tertiary font-medium mb-1">Constraints & Heuristics</span>
              <div className="bg-surface-1 border border-subtle rounded-xl overflow-hidden flex flex-col p-1">
                <Toggle label="Backtracking Engine" enabled locked />
                <Toggle label="Forward Checking" enabled={toggles.forwardChecking} onChange={() => setToggles(t => ({ ...t, forwardChecking: !t.forwardChecking }))} />
                <Toggle label="MRV Variable Ordering" enabled={toggles.mrv} onChange={() => setToggles(t => ({ ...t, mrv: !t.mrv }))} />
                <Toggle label="LCV Value Ordering" enabled={toggles.lcv} onChange={() => setToggles(t => ({ ...t, lcv: !t.lcv }))} />
                <Toggle label="AC-3 Arc Consistency" enabled={toggles.ac3} onChange={() => setToggles(t => ({ ...t, ac3: !t.ac3 }))} />
              </div>
            </div>

            {/* Speed */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] uppercase tracking-wider text-text-tertiary font-medium">Execution Velocity</span>
              <input
                type="range" min={1} max={100} value={speed}
                onChange={e => setSpeed(Number(e.target.value))}
                className="w-full accent-accent-blue h-1.5 bg-surface-3 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-blue"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 mt-auto">
              <button
                onClick={handleSolve}
                disabled={isSolving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black hover:bg-neutral-200 text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                {isSolving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Executing CSP...
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" />
                    Initialize Solver
                  </>
                )}
              </button>

              {result && (
                <div className="flex gap-2">
                  <button
                    onClick={togglePlayback}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-surface-2 hover:bg-surface-3 text-white text-xs font-medium tracking-wide rounded-xl transition-all duration-200 border border-subtle"
                  >
                    {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                    {isPlaying ? 'PAUSE' : 'PLAY'}
                  </button>
                  <button
                    onClick={() => { stopPlayback(); setCurrentStep(prev => Math.min(prev + 1, (result?.steps.length ?? 1) - 1)); }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-surface-2 hover:bg-surface-3 text-white text-xs font-medium tracking-wide rounded-xl transition-all duration-200 border border-subtle"
                  >
                    <SkipForward size={14} fill="currentColor" />
                    STEP
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-surface-2 hover:bg-surface-3 text-white text-xs font-medium rounded-xl transition-all duration-200 border border-subtle"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ── Center + Right ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-surface-0 relative">
          
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />

          {/* Center + Right Row */}
          <div className="flex-1 flex overflow-hidden z-10">

            {/* Center Visualization */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-auto relative">
              <AnimatePresence mode="wait">
                {!result ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center gap-5 text-text-tertiary max-w-sm text-center"
                  >
                    <div className="w-20 h-20 rounded-3xl bg-surface-1/50 border border-subtle flex items-center justify-center shadow-xl backdrop-blur-md">
                      {problem === 'nqueens' && <Grid3X3 size={32} className="text-text-secondary" />}
                      {problem === 'coloring' && <Palette size={32} className="text-text-secondary" />}
                      {problem === 'timetable' && <CalendarClock size={32} className="text-text-secondary" />}
                      {problem === 'cryptarithmetic' && <Keyboard size={32} className="text-text-secondary" />}
                    </div>
                    <div>
                      <h3 className="text-white font-medium text-lg tracking-wide mb-2">Awaiting Parameters</h3>
                      <p className="text-sm text-text-secondary leading-relaxed">Configure the constraint environment on the left and initialize the solver to visualize the logic tree.</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="viz"
                    initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    {problem === 'nqueens' && (
                      <NQueensBoard n={nQueensSize} assignments={currentAssignments} conflicts={nqueensConflicts} mode={appMode} />
                    )}
                    {problem === 'coloring' && (
                      <GraphColoringViz assignments={currentAssignments} edges={DEFAULT_GRAPH_EDGES} nodes={DEFAULT_GRAPH_NODES} mode={appMode} />
                    )}
                    {problem === 'timetable' && (
                      <TimetableGrid
                        assignments={currentAssignments}
                        courses={['CS101', 'CS201', 'MATH101', 'PHYS101', 'ENG101']}
                        mode={appMode}
                      />
                    )}
                    {problem === 'cryptarithmetic' && (
                      <CryptarithmeticViz
                        assignments={currentAssignments}
                        mode={appMode}
                        word1={cryptoWords.word1}
                        word2={cryptoWords.word2}
                        resultWord={cryptoWords.resultWord}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Panel */}
            <aside className="w-80 flex-shrink-0 border-l border-[rgba(255,255,255,0.06)] bg-surface-0/80 backdrop-blur-xl overflow-y-auto p-5 flex flex-col gap-6 shadow-[-4px_0_24px_rgba(0,0,0,0.2)]">

              {/* Metrics */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] uppercase tracking-wider text-text-tertiary font-medium">Solver Telemetry</span>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    label="Backtracks"
                    value={result?.metrics.backtracks ?? '—'}
                    icon={<RotateCcw size={12} />}
                  />
                  <MetricCard
                    label="Explored"
                    value={result?.metrics.nodesExplored ?? '—'}
                    icon={<Hash size={12} />}
                  />
                  <MetricCard
                    label="Checks"
                    value={result?.metrics.constraintChecks ?? '—'}
                    icon={<Zap size={12} />}
                  />
                  <MetricCard
                    label="Time (ms)"
                    value={result ? result.metrics.executionMs.toFixed(1) : '—'}
                    icon={<Clock size={12} />}
                  />
                </div>
              </div>

              {/* Algorithm Badge */}
              {result && (
                <div className="bg-surface-1 border border-subtle rounded-xl p-4 flex flex-col gap-2 shadow-sm">
                  <span className="text-[11px] uppercase tracking-wider text-text-tertiary font-medium">Solver Details</span>
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-mono text-white tracking-wide">{result.algorithm}</span>
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-sm ${result.solution ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'}`}>
                      {result.solution ? 'SOLUTION FOUND' : 'FAILED'}
                    </span>
                  </div>
                </div>
              )}

              {/* Current Operation (Information Density Task) */}
              {currentStepData && (
                <div className="flex flex-col gap-2 bg-surface-1 border border-subtle rounded-xl p-4 shadow-sm">
                  <span className="text-[11px] uppercase tracking-wider text-text-tertiary font-medium">Current Operation</span>
                  <div className="flex flex-col gap-2 mt-1">
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-text-secondary">Variable</span>
                       <span className="font-mono text-white bg-surface-2 px-1.5 py-0.5 rounded">{currentStepData.variable}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-text-secondary">Domain Size</span>
                       <span className="font-mono text-white">{currentStepData.domains[currentStepData.variable]?.length ?? '—'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-text-secondary">Action</span>
                       <span className={`font-mono ${
                         currentStepData.action === 'assign' ? 'text-accent-blue' :
                         currentStepData.action === 'backtrack' ? 'text-accent-red' :
                         currentStepData.action === 'prune' ? 'text-accent-amber' :
                         'text-accent-green'
                       }`}>{currentStepData.action.toUpperCase()}</span>
                    </div>
                    <div className="mt-1 pt-2 border-t border-[rgba(255,255,255,0.06)]">
                       <p className="text-[10px] text-text-tertiary leading-relaxed">{currentStepData.reason}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* CSP State */}
              {result && variables.length > 0 && (
                <div className="flex-1 min-h-0">
                  <CSPStatePanel
                    variables={variables}
                    domains={currentDomains}
                    assignments={currentAssignments}
                  />
                </div>
              )}

              {/* Step Slider */}
              {result && result.steps.length > 0 && (
                <div className="flex flex-col gap-2 bg-surface-1 p-3 border border-subtle rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-text-tertiary font-medium">Timeline Position</span>
                    <span className="text-[11px] font-mono text-accent-purple font-medium">
                      {Math.max(0, currentStep + 1)} / {result.steps.length}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={result.steps.length - 1}
                    value={Math.max(0, currentStep)}
                    onChange={e => { stopPlayback(); setCurrentStep(Number(e.target.value)); }}
                    className="w-full accent-accent-purple h-1.5 bg-surface-3 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-purple [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(168,85,247,0.5)] mt-1"
                  />
                </div>
              )}
            </aside>
          </div>

          {/* Bottom: Reasoning Timeline */}
          <div className="z-20">
            <ReasoningTimeline steps={result?.steps ?? []} currentStep={currentStep} />
          </div>
        </div>
      </div>
    </div>
  );
}
