'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, RotateCcw, Grid3X3, Palette, CalendarClock,
  ChevronRight, Activity, Clock, Hash, AlertTriangle,
  Zap, CheckCircle2, XCircle, ArrowLeft, SkipForward, Pause,
} from 'lucide-react';
import { CSPStep, CSPResult } from '@/lib/types';
import {
  solveCSP,
  createNQueens,
  createGraphColoring,
  createTimetable,
  decodeTimetableSlot,
  DEFAULT_GRAPH_NODES,
  DEFAULT_GRAPH_EDGES,
  TIMETABLE_ROOMS,
  TIMETABLE_TIMESLOTS,
  TIMETABLE_CONFLICTS,
  CSPSetup,
  CSPOptions,
} from '@/lib/algorithms/csp';

/* ════════════════════════════════════════════
   Types
   ════════════════════════════════════════════ */

type ProblemType = 'nqueens' | 'coloring' | 'timetable';

interface ToggleState {
  forwardChecking: boolean;
  mrv: boolean;
  lcv: boolean;
  ac3: boolean;
}

/* ════════════════════════════════════════════
   Constants
   ════════════════════════════════════════════ */

const PROBLEM_OPTIONS: { id: ProblemType; label: string; icon: React.ReactNode }[] = [
  { id: 'nqueens', label: 'N-Queens', icon: <Grid3X3 size={16} /> },
  { id: 'coloring', label: 'Graph Coloring', icon: <Palette size={16} /> },
  { id: 'timetable', label: 'Timetabling', icon: <CalendarClock size={16} /> },
];

const ACCENT_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7'];
const ACCENT_BG_CLASSES = ['bg-accent-blue', 'bg-accent-green', 'bg-accent-amber', 'bg-accent-red', 'bg-accent-purple'];

/* ════════════════════════════════════════════
   Shared Sub-components
   ════════════════════════════════════════════ */

function Toggle({ label, enabled, onChange, locked }: { label: string; enabled: boolean; onChange: () => void; locked?: boolean }) {
  return (
    <button
      onClick={locked ? undefined : onChange}
      className={`flex items-center justify-between w-full px-3 py-2 rounded-xl transition-all duration-200 ${
        locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-3'
      }`}
    >
      <span className="text-sm text-text-secondary">{label}</span>
      <div
        className={`w-9 h-5 rounded-full transition-all duration-200 relative ${
          enabled ? 'bg-accent-blue' : 'bg-surface-2'
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${
            enabled ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </div>
    </button>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-surface-1 border-subtle rounded-xl p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-text-tertiary">
        {icon}
        <span className="text-[11px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <span className="text-lg font-mono font-semibold text-white">{value}</span>
    </div>
  );
}

/* ════════════════════════════════════════════
   N-Queens Visualization
   ════════════════════════════════════════════ */

function NQueensBoard({ n, assignments, conflicts }: { n: number; assignments: Record<string, number | string>; conflicts: Set<string> }) {
  const cellSize = Math.max(28, Math.min(48, 400 / n));

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div
        className="inline-grid border-subtle rounded-xl overflow-hidden"
        style={{ gridTemplateColumns: `repeat(${n}, ${cellSize}px)`, gridTemplateRows: `repeat(${n}, ${cellSize}px)` }}
      >
        {Array.from({ length: n * n }, (_, idx) => {
          const row = Math.floor(idx / n);
          const col = idx % n;
          const varName = `Q${col}`;
          const isQueenHere = varName in assignments && Number(assignments[varName]) === row;
          const isConflict = isQueenHere && conflicts.has(varName);
          const isDark = (row + col) % 2 === 1;

          return (
            <motion.div
              key={idx}
              className={`flex items-center justify-center transition-all duration-200 ${
                isDark ? 'bg-surface-2' : 'bg-surface-1'
              } ${isConflict ? 'border-2 border-accent-red' : ''}`}
              style={{ width: cellSize, height: cellSize }}
            >
              {isQueenHere && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={`text-2xl select-none ${isConflict ? 'text-accent-red' : 'text-accent-blue'}`}
                  style={{ fontSize: Math.max(16, cellSize * 0.55) }}
                >
                  ♛
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   Graph Coloring Visualization
   ════════════════════════════════════════════ */

const GRAPH_NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  WA: { x: 80, y: 160 },
  NT: { x: 200, y: 60 },
  SA: { x: 220, y: 200 },
  Q: { x: 350, y: 80 },
  NSW: { x: 370, y: 200 },
  V: { x: 310, y: 300 },
  T: { x: 340, y: 380 },
};

function GraphColoringViz({ assignments, edges }: { assignments: Record<string, number | string>; edges: [string, string][] }) {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <svg viewBox="0 0 460 440" className="w-full max-w-[460px] max-h-[440px]">
        {edges.map(([a, b], i) => {
          const pa = GRAPH_NODE_POSITIONS[a];
          const pb = GRAPH_NODE_POSITIONS[b];
          if (!pa || !pb) return null;
          return (
            <line
              key={i}
              x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke="rgba(255,255,255,0.08)" strokeWidth={1.5}
            />
          );
        })}
        {DEFAULT_GRAPH_NODES.map(node => {
          const pos = GRAPH_NODE_POSITIONS[node];
          if (!pos) return null;
          const colorIdx = node in assignments ? Number(assignments[node]) : -1;
          const fill = colorIdx >= 0 ? ACCENT_COLORS[colorIdx % ACCENT_COLORS.length] : '#1a1a1a';
          const textColor = colorIdx >= 0 ? '#fff' : '#a1a1aa';

          return (
            <g key={node}>
              <motion.circle
                cx={pos.x} cy={pos.y} r={24}
                fill={fill}
                stroke="rgba(255,255,255,0.1)" strokeWidth={1}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              />
              <text x={pos.x} y={pos.y + 5} textAnchor="middle" fill={textColor} fontSize={12} fontFamily="Inter, sans-serif" fontWeight={500}>
                {node}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════
   Timetable Visualization
   ════════════════════════════════════════════ */

function TimetableGrid({ assignments, courses }: { assignments: Record<string, number | string>; courses: string[] }) {
  const conflictCells = new Set<string>();

  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      const c1 = courses[i];
      const c2 = courses[j];
      if (!(c1 in assignments) || !(c2 in assignments)) continue;
      const s1 = Number(assignments[c1]);
      const s2 = Number(assignments[c2]);
      if (s1 === s2) {
        conflictCells.add(`${c1}-${s1}`);
        conflictCells.add(`${c2}-${s2}`);
      }
      const t1 = s1 % TIMETABLE_TIMESLOTS.length;
      const t2 = s2 % TIMETABLE_TIMESLOTS.length;
      for (const [ca, cb] of TIMETABLE_CONFLICTS) {
        if ((c1 === ca && c2 === cb) || (c1 === cb && c2 === ca)) {
          if (t1 === t2) {
            conflictCells.add(`${c1}-${s1}`);
            conflictCells.add(`${c2}-${s2}`);
          }
        }
      }
    }
  }

  return (
    <div className="flex items-center justify-center w-full h-full overflow-auto">
      <div className="inline-block">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-[11px] text-text-tertiary uppercase tracking-wider border-subtle bg-surface-1 rounded-tl-xl" />
              {TIMETABLE_TIMESLOTS.map(ts => (
                <th key={ts} className="p-2 text-[11px] text-text-tertiary uppercase tracking-wider border-subtle bg-surface-1 font-medium">
                  {ts}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.map(course => (
              <tr key={course}>
                <td className="p-2 text-xs font-mono text-text-secondary border-subtle bg-surface-1 font-medium whitespace-nowrap">
                  {course}
                </td>
                {TIMETABLE_TIMESLOTS.map((_, tIdx) => {
                  const cellContent: { room: string; slot: number }[] = [];
                  if (course in assignments) {
                    const slot = Number(assignments[course]);
                    const { room, timeslot } = decodeTimetableSlot(slot);
                    if (TIMETABLE_TIMESLOTS[tIdx] === timeslot) {
                      cellContent.push({ room, slot });
                    }
                  }
                  const hasContent = cellContent.length > 0;
                  const hasConflict = hasContent && conflictCells.has(`${course}-${cellContent[0].slot}`);

                  return (
                    <td
                      key={tIdx}
                      className={`p-2 text-center text-xs font-mono border-subtle transition-all duration-200 min-w-[64px] ${
                        hasConflict
                          ? 'bg-accent-red/10 border-accent-red/30'
                          : hasContent
                          ? 'bg-accent-blue/10'
                          : 'bg-surface-0'
                      }`}
                    >
                      {hasContent && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={hasConflict ? 'text-accent-red' : 'text-accent-blue'}
                        >
                          {cellContent[0].room}
                        </motion.span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
    <div className="bg-surface-1 border-subtle rounded-xl p-4 flex flex-col gap-2">
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
                    <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 bg-surface-3 rounded text-text-tertiary">
                      {d}
                    </span>
                  ))}
                  {domainValues.length === 0 && (
                    <span className="text-[10px] font-mono text-accent-red">∅</span>
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
    <div className="bg-surface-1 border-subtle rounded-xl flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider text-text-tertiary font-medium">Reasoning Timeline</h3>
        <span className="text-[10px] font-mono text-text-tertiary">
          {visibleSteps.length}/{steps.length} steps
        </span>
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-1 max-h-[200px]">
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
              className={`flex items-start gap-2 px-2 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                i === currentStep ? 'bg-surface-3' : ''
              }`}
            >
              {actionIcon(step.action)}
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
  const [nQueensSize, setNQueensSize] = useState(8);
  const [nColors, setNColors] = useState(3);
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
  const handleSolve = useCallback(() => {
    stopPlayback();
    setIsSolving(true);

    let setup: CSPSetup;

    switch (problem) {
      case 'nqueens':
        setup = createNQueens(nQueensSize);
        break;
      case 'coloring':
        setup = createGraphColoring(DEFAULT_GRAPH_NODES, DEFAULT_GRAPH_EDGES, nColors);
        break;
      case 'timetable':
        setup = createTimetable();
        break;
    }

    const options: CSPOptions = {
      useForwardChecking: toggles.forwardChecking,
      useMRV: toggles.mrv,
      useLCV: toggles.lcv,
      useAC3: toggles.ac3,
    };

    setTimeout(() => {
      const cspResult = solveCSP(setup.variables, setup.domains, setup.isConsistent, options);
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
    }, 30);
  }, [problem, nQueensSize, nColors, toggles, stopPlayback, speed]);

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

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-surface-0 bg-grid flex flex-col">

      {/* ── Command Bar ── */}
      <header className="h-14 border-b border-[rgba(255,255,255,0.06)] bg-surface-0/80 backdrop-blur-xl flex items-center px-6 gap-4 flex-shrink-0 z-50">
        <a href="/" className="flex items-center gap-2 text-text-tertiary hover:text-white transition-all duration-200">
          <ArrowLeft size={16} />
        </a>
        <div className="w-px h-5 bg-[rgba(255,255,255,0.06)]" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent-purple" />
          <span className="text-sm font-medium text-white">Constraint Intelligence Lab</span>
        </div>
        <div className="flex-1" />
        <span className="text-[11px] text-text-tertiary font-mono">CORTEX AI</span>
      </header>

      {/* ── Main Layout ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left Panel ── */}
        <aside className="w-64 flex-shrink-0 border-r border-[rgba(255,255,255,0.06)] bg-surface-0 flex flex-col overflow-y-auto">
          <div className="p-4 flex flex-col gap-5">

            {/* Problem Selector */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wider text-text-tertiary font-medium">Problem</span>
              <div className="flex flex-col gap-1">
                {PROBLEM_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setProblem(opt.id); handleReset(); }}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                      problem === opt.id
                        ? 'bg-surface-3 text-white'
                        : 'text-text-secondary hover:bg-surface-2 hover:text-white'
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                    {problem === opt.id && <ChevronRight size={14} className="ml-auto text-text-tertiary" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Problem-specific Config */}
            <AnimatePresence mode="wait">
              {problem === 'nqueens' && (
                <motion.div
                  key="nqueens-config"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex flex-col gap-2"
                >
                  <span className="text-[11px] uppercase tracking-wider text-text-tertiary font-medium">Board Size</span>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min={4} max={12} value={nQueensSize}
                      onChange={e => setNQueensSize(Number(e.target.value))}
                      className="flex-1 accent-accent-blue h-1 bg-surface-3 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-blue"
                    />
                    <span className="text-sm font-mono text-white w-6 text-right">{nQueensSize}</span>
                  </div>
                </motion.div>
              )}
              {problem === 'coloring' && (
                <motion.div
                  key="coloring-config"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex flex-col gap-2"
                >
                  <span className="text-[11px] uppercase tracking-wider text-text-tertiary font-medium">Colors</span>
                  <div className="flex gap-1.5">
                    {[3, 4, 5].map(c => (
                      <button
                        key={c}
                        onClick={() => setNColors(c)}
                        className={`flex-1 py-1.5 rounded-xl text-sm font-mono transition-all duration-200 ${
                          nColors === c ? 'bg-accent-blue text-white' : 'bg-surface-2 text-text-secondary hover:bg-surface-3'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Technique Toggles */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wider text-text-tertiary font-medium mb-1">Techniques</span>
              <Toggle label="Backtracking" enabled locked />
              <Toggle label="Forward Checking" enabled={toggles.forwardChecking} onChange={() => setToggles(t => ({ ...t, forwardChecking: !t.forwardChecking }))} />
              <Toggle label="MRV Heuristic" enabled={toggles.mrv} onChange={() => setToggles(t => ({ ...t, mrv: !t.mrv }))} />
              <Toggle label="LCV Heuristic" enabled={toggles.lcv} onChange={() => setToggles(t => ({ ...t, lcv: !t.lcv }))} />
              <Toggle label="Arc Consistency" enabled={toggles.ac3} onChange={() => setToggles(t => ({ ...t, ac3: !t.ac3 }))} />
            </div>

            {/* Speed */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wider text-text-tertiary font-medium">Speed</span>
              <input
                type="range" min={1} max={100} value={speed}
                onChange={e => setSpeed(Number(e.target.value))}
                className="w-full accent-accent-blue h-1 bg-surface-3 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-blue"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSolve}
                disabled={isSolving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-blue hover:bg-accent-blue/90 text-white text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSolving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Solving…
                  </>
                ) : (
                  <>
                    <Play size={15} />
                    Solve
                  </>
                )}
              </button>

              {result && (
                <div className="flex gap-2">
                  <button
                    onClick={togglePlayback}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-white text-xs rounded-xl transition-all duration-200"
                  >
                    {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </button>
                  <button
                    onClick={() => { stopPlayback(); setCurrentStep(prev => Math.min(prev + 1, (result?.steps.length ?? 1) - 1)); }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-white text-xs rounded-xl transition-all duration-200"
                  >
                    <SkipForward size={13} />
                    Step
                  </button>
                </div>
              )}

              {result && (
                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-white text-sm rounded-xl transition-all duration-200"
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ── Center + Right ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Center + Right Row */}
          <div className="flex-1 flex overflow-hidden">

            {/* Center Visualization */}
            <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
              <AnimatePresence mode="wait">
                {!result ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4 text-text-tertiary"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-surface-2 border-subtle flex items-center justify-center">
                      {problem === 'nqueens' && <Grid3X3 size={28} className="text-text-tertiary" />}
                      {problem === 'coloring' && <Palette size={28} className="text-text-tertiary" />}
                      {problem === 'timetable' && <CalendarClock size={28} className="text-text-tertiary" />}
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-text-secondary">Select options and press Solve</p>
                      <p className="text-xs text-text-tertiary mt-1">
                        {problem === 'nqueens' && `Place ${nQueensSize} queens on a ${nQueensSize}×${nQueensSize} board`}
                        {problem === 'coloring' && `Color the map of Australia with ${nColors} colors`}
                        {problem === 'timetable' && 'Schedule 5 courses across rooms and timeslots'}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="viz"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="w-full h-full"
                  >
                    {problem === 'nqueens' && (
                      <NQueensBoard n={nQueensSize} assignments={currentAssignments} conflicts={nqueensConflicts} />
                    )}
                    {problem === 'coloring' && (
                      <GraphColoringViz assignments={currentAssignments} edges={DEFAULT_GRAPH_EDGES} />
                    )}
                    {problem === 'timetable' && (
                      <TimetableGrid
                        assignments={currentAssignments}
                        courses={['CS101', 'CS201', 'MATH101', 'PHYS101', 'ENG101']}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Panel */}
            <aside className="w-72 flex-shrink-0 border-l border-[rgba(255,255,255,0.06)] bg-surface-0 overflow-y-auto p-4 flex flex-col gap-4">

              {/* Metrics */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] uppercase tracking-wider text-text-tertiary font-medium">Metrics</span>
                <div className="grid grid-cols-2 gap-2">
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
                    label="Time"
                    value={result ? `${result.metrics.executionMs.toFixed(1)}ms` : '—'}
                    icon={<Clock size={12} />}
                  />
                </div>
              </div>

              {/* Algorithm Badge */}
              {result && (
                <div className="bg-surface-1 border-subtle rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider text-text-tertiary font-medium">Algorithm</span>
                  <span className="text-xs font-mono text-accent-blue">{result.algorithm}</span>
                  <span className={`text-xs font-mono mt-1 ${result.solution ? 'text-accent-green' : 'text-accent-red'}`}>
                    {result.solution ? '✓ Solution found' : '✗ No solution'}
                  </span>
                </div>
              )}

              {/* CSP State */}
              {result && variables.length > 0 && (
                <CSPStatePanel
                  variables={variables}
                  domains={currentDomains}
                  assignments={currentAssignments}
                />
              )}

              {/* Step Slider */}
              {result && result.steps.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-text-tertiary font-medium">Step</span>
                    <span className="text-[11px] font-mono text-text-tertiary">
                      {Math.max(0, currentStep + 1)} / {result.steps.length}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={result.steps.length - 1}
                    value={Math.max(0, currentStep)}
                    onChange={e => { stopPlayback(); setCurrentStep(Number(e.target.value)); }}
                    className="w-full accent-accent-purple h-1 bg-surface-3 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-purple"
                  />
                </div>
              )}
            </aside>
          </div>

          {/* Bottom: Reasoning Timeline */}
          <div className="h-[240px] flex-shrink-0 border-t border-[rgba(255,255,255,0.06)]">
            <ReasoningTimeline steps={result?.steps ?? []} currentStep={currentStep} />
          </div>
        </div>
      </div>
    </div>
  );
}
