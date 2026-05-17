'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  RotateCcw,
  Gauge,
  ChevronDown,
  Layers,
  GitFork,
  Zap,
  Search,
  ArrowRight,
  Shuffle,
  Target,
  ScanSearch,
  Route,
  Navigation,
  Radar,
  Waypoints,
} from 'lucide-react';
import CommandBar from '@/components/ui/CommandBar';
import ReasoningTimeline from '@/components/shared/ReasoningTimeline';
import AnalyticsPanel from '@/components/shared/AnalyticsPanel';
import { bfs, dfs, ucs, gbfs, astar, dijkstra, iddfs, idaStar } from '@/lib/algorithms/search';
import type { SearchResult, SearchStep, GraphNode, GraphEdge } from '@/lib/types';

/* ─── Algorithm metadata ─── */
interface AlgorithmInfo {
  id: string;
  name: string;
  shortName: string;
  icon: React.ReactNode;
  description: string;
  needsHeuristic: boolean;
}

const ALGORITHMS: AlgorithmInfo[] = [
  { id: 'bfs', name: 'Breadth-First Search', shortName: 'BFS', icon: <Layers className="w-3.5 h-3.5" />, description: 'Queue-based, level order', needsHeuristic: false },
  { id: 'dfs', name: 'Depth-First Search', shortName: 'DFS', icon: <GitFork className="w-3.5 h-3.5" />, description: 'Stack-based, deep dive', needsHeuristic: false },
  { id: 'ucs', name: 'Uniform Cost Search', shortName: 'UCS', icon: <Gauge className="w-3.5 h-3.5" />, description: 'Priority by g(n)', needsHeuristic: false },
  { id: 'gbfs', name: 'Greedy Best-First', shortName: 'GBFS', icon: <Target className="w-3.5 h-3.5" />, description: 'Priority by h(n)', needsHeuristic: true },
  { id: 'astar', name: 'A* Search', shortName: 'A*', icon: <ScanSearch className="w-3.5 h-3.5" />, description: 'f(n) = g(n) + h(n)', needsHeuristic: true },
  { id: 'dijkstra', name: "Dijkstra's Algorithm", shortName: 'Dijkstra', icon: <Route className="w-3.5 h-3.5" />, description: 'Shortest path, all nodes', needsHeuristic: false },
  { id: 'iddfs', name: 'Iterative Deepening', shortName: 'IDDFS', icon: <Navigation className="w-3.5 h-3.5" />, description: 'DFS with increasing depth', needsHeuristic: false },
  { id: 'idaStar', name: 'IDA*', shortName: 'IDA*', icon: <Radar className="w-3.5 h-3.5" />, description: 'Iterative deepening A*', needsHeuristic: true },
];

/* ─── Default graph (10 nodes: A–J) ─── */
const DEFAULT_NODES: GraphNode[] = [
  { id: 'A', x: 120, y: 80, label: 'A' },
  { id: 'B', x: 280, y: 60, label: 'B' },
  { id: 'C', x: 80, y: 220, label: 'C' },
  { id: 'D', x: 260, y: 200, label: 'D' },
  { id: 'E', x: 440, y: 120, label: 'E' },
  { id: 'F', x: 420, y: 280, label: 'F' },
  { id: 'G', x: 180, y: 360, label: 'G' },
  { id: 'H', x: 560, y: 200, label: 'H' },
  { id: 'I', x: 340, y: 400, label: 'I' },
  { id: 'J', x: 540, y: 380, label: 'J' },
];

const DEFAULT_EDGES: GraphEdge[] = [
  { from: 'A', to: 'B', weight: 4 },
  { from: 'A', to: 'C', weight: 2 },
  { from: 'B', to: 'D', weight: 5 },
  { from: 'B', to: 'E', weight: 10 },
  { from: 'C', to: 'D', weight: 8 },
  { from: 'C', to: 'G', weight: 3 },
  { from: 'D', to: 'E', weight: 2 },
  { from: 'D', to: 'F', weight: 3 },
  { from: 'E', to: 'H', weight: 6 },
  { from: 'F', to: 'I', weight: 1 },
  { from: 'F', to: 'J', weight: 7 },
  { from: 'G', to: 'I', weight: 4 },
  { from: 'H', to: 'J', weight: 2 },
  { from: 'I', to: 'J', weight: 5 },
];

/* Build undirected adjacency */
function buildAdjacency(edges: GraphEdge[]): Record<string, Record<string, number>> {
  const adj: Record<string, Record<string, number>> = {};
  for (const node of DEFAULT_NODES) {
    adj[node.id] = {};
  }
  for (const edge of edges) {
    adj[edge.from][edge.to] = edge.weight;
    adj[edge.to][edge.from] = edge.weight;
  }
  return adj;
}

const ADJACENCY = buildAdjacency(DEFAULT_EDGES);

/* Heuristic: straight-line estimate to default goal 'J' */
const HEURISTIC: Record<string, number> = {
  A: 14,
  B: 12,
  C: 11,
  D: 9,
  E: 7,
  F: 5,
  G: 8,
  H: 3,
  I: 4,
  J: 0,
};

/* ─── Node status for visualization ─── */
type NodeStatus = 'default' | 'visited' | 'frontier' | 'path' | 'current' | 'start' | 'goal';

function getNodeStatus(
  nodeId: string,
  step: SearchStep | null,
  path: string[],
  start: string,
  goal: string,
  isComplete: boolean
): NodeStatus {
  if (isComplete && path.includes(nodeId)) return 'path';
  if (step?.node === nodeId) return 'current';
  if (nodeId === start) return 'start';
  if (nodeId === goal) return 'goal';
  if (step?.frontier.some((f) => f.id === nodeId)) return 'frontier';
  if (step?.visited.includes(nodeId)) return 'visited';
  return 'default';
}

/* ─── SVG Colors by status ─── */
function nodeColors(status: NodeStatus) {
  switch (status) {
    case 'current':
      return { fill: '#3b82f6', stroke: '#60a5fa', textColor: '#ffffff' };
    case 'visited':
      return { fill: '#111111', stroke: '#3b82f6', textColor: '#3b82f6' };
    case 'frontier':
      return { fill: '#111111', stroke: '#f59e0b', textColor: '#f59e0b' };
    case 'path':
      return { fill: '#ffffff', stroke: '#ffffff', textColor: '#000000' };
    case 'start':
      return { fill: '#22c55e', stroke: '#4ade80', textColor: '#000000' };
    case 'goal':
      return { fill: '#ef4444', stroke: '#f87171', textColor: '#ffffff' };
    default:
      return { fill: '#111111', stroke: 'rgba(255,255,255,0.2)', textColor: '#a1a1aa' };
  }
}

/* ─── Dropdown component ─── */
function NodeSelector({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-surface-0 text-white text-sm px-3 py-2 rounded-xl border border-subtle focus:outline-none focus:border-border-active cursor-pointer transition-all duration-200"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-text-tertiary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function SearchPage() {
  /* State */
  const [selectedAlgo, setSelectedAlgo] = useState('bfs');
  const [startNode, setStartNode] = useState('A');
  const [goalNode, setGoalNode] = useState('J');
  const [speed, setSpeed] = useState(400);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareResults, setCompareResults] = useState<SearchResult[]>([]);

  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodeIds = DEFAULT_NODES.map((n) => n.id);

  /* Run selected algorithm */
  const execute = useCallback(() => {
    if (isAnimating) return;
    setIsComplete(false);
    setCurrentStepIndex(-1);
    setCompareResults([]);

    let res: SearchResult;
    switch (selectedAlgo) {
      case 'bfs': res = bfs(ADJACENCY, startNode, goalNode); break;
      case 'dfs': res = dfs(ADJACENCY, startNode, goalNode); break;
      case 'ucs': res = ucs(ADJACENCY, startNode, goalNode); break;
      case 'gbfs': res = gbfs(ADJACENCY, startNode, goalNode, HEURISTIC); break;
      case 'astar': res = astar(ADJACENCY, startNode, goalNode, HEURISTIC); break;
      case 'dijkstra': res = dijkstra(ADJACENCY, startNode, goalNode); break;
      case 'iddfs': res = iddfs(ADJACENCY, startNode, goalNode); break;
      case 'idaStar': res = idaStar(ADJACENCY, startNode, goalNode, HEURISTIC); break;
      default: res = bfs(ADJACENCY, startNode, goalNode);
    }
    setResult(res);

    if (compareMode) {
      const all = ALGORITHMS.map((a) => {
        switch (a.id) {
          case 'bfs': return bfs(ADJACENCY, startNode, goalNode);
          case 'dfs': return dfs(ADJACENCY, startNode, goalNode);
          case 'ucs': return ucs(ADJACENCY, startNode, goalNode);
          case 'gbfs': return gbfs(ADJACENCY, startNode, goalNode, HEURISTIC);
          case 'astar': return astar(ADJACENCY, startNode, goalNode, HEURISTIC);
          case 'dijkstra': return dijkstra(ADJACENCY, startNode, goalNode);
          case 'iddfs': return iddfs(ADJACENCY, startNode, goalNode);
          case 'idaStar': return idaStar(ADJACENCY, startNode, goalNode, HEURISTIC);
          default: return bfs(ADJACENCY, startNode, goalNode);
        }
      });
      setCompareResults(all);
    }

    /* Animate steps */
    setIsAnimating(true);
    let step = 0;
    const animate = () => {
      if (step < res.steps.length) {
        setCurrentStepIndex(step);
        step++;
        animationRef.current = setTimeout(animate, speed);
      } else {
        setIsAnimating(false);
        setIsComplete(true);
      }
    };
    animationRef.current = setTimeout(animate, 300);
  }, [selectedAlgo, startNode, goalNode, speed, isAnimating, compareMode]);

  /* Reset */
  const reset = useCallback(() => {
    if (animationRef.current) clearTimeout(animationRef.current);
    setResult(null);
    setCurrentStepIndex(-1);
    setIsAnimating(false);
    setIsComplete(false);
    setCompareResults([]);
  }, []);

  /* Cleanup on unmount */
  useEffect(() => {
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, []);

  /* Current step data */
  const currentStep =
    result && currentStepIndex >= 0 && currentStepIndex < result.steps.length
      ? result.steps[currentStepIndex]
      : null;

  const algoInfo = ALGORITHMS.find((a) => a.id === selectedAlgo)!;

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      <CommandBar module="Search Intelligence Lab" subtitle={algoInfo.name} />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Panel: Controls ── */}
        <aside className="w-64 bg-surface-1 border-r border-subtle flex flex-col overflow-y-auto flex-shrink-0">
          {/* Algorithm Selector */}
          <div className="p-5 border-b border-subtle">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-text-tertiary" />
              <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                Algorithm
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {ALGORITHMS.map((algo) => (
                <button
                  key={algo.id}
                  onClick={() => {
                    if (!isAnimating) {
                      setSelectedAlgo(algo.id);
                      reset();
                    }
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-200 ${
                    selectedAlgo === algo.id
                      ? 'bg-surface-3 border border-border-active'
                      : 'bg-surface-1 border border-transparent hover:bg-surface-2'
                  }`}
                >
                  <span
                    className={
                      selectedAlgo === algo.id ? 'text-white' : 'text-text-tertiary'
                    }
                  >
                    {algo.icon}
                  </span>
                  <div className="flex flex-col">
                    <span
                      className={`text-xs font-medium ${
                        selectedAlgo === algo.id ? 'text-white' : 'text-text-secondary'
                      }`}
                    >
                      {algo.shortName}
                    </span>
                    <span className="text-[10px] text-text-tertiary">{algo.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Node Selectors */}
          <div className="p-5 border-b border-subtle flex flex-col gap-3">
            <NodeSelector
              label="Start Node"
              value={startNode}
              onChange={(v) => { setStartNode(v); reset(); }}
              options={nodeIds}
            />
            <NodeSelector
              label="Goal Node"
              value={goalNode}
              onChange={(v) => { setGoalNode(v); reset(); }}
              options={nodeIds}
            />
          </div>

          {/* Speed */}
          <div className="p-5 border-b border-subtle">
            <label className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider block mb-2">
              Animation Speed
            </label>
            <div className="flex items-center gap-3">
              <Zap className="w-3.5 h-3.5 text-text-tertiary" />
              <input
                type="range"
                min={50}
                max={1200}
                step={50}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="flex-1 h-1 bg-surface-3 rounded-full appearance-none cursor-pointer accent-white"
              />
              <span className="text-[10px] font-mono text-text-tertiary w-10 text-right">
                {speed}ms
              </span>
            </div>
          </div>

          {/* Compare Mode */}
          <div className="p-5 border-b border-subtle">
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-all duration-200 border ${
                compareMode
                  ? 'bg-surface-3 border-accent-purple/30 text-accent-purple'
                  : 'bg-surface-1 border-subtle text-text-secondary hover:bg-surface-2'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Compare Mode</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="p-5 flex flex-col gap-2 mt-auto">
            <button
              onClick={execute}
              disabled={isAnimating}
              className="flex items-center justify-center gap-2 w-full bg-white text-black font-medium text-sm py-2.5 rounded-xl hover:bg-neutral-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-3.5 h-3.5" />
              Execute
            </button>
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 w-full bg-surface-2 text-text-secondary font-medium text-sm py-2.5 rounded-xl hover:bg-surface-3 transition-all duration-200 border border-subtle"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </aside>

        {/* ── Center: Graph Visualizer ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative overflow-hidden">
            {/* Status bar */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
              {isAnimating && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 border border-subtle"
                >
                  <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse-subtle" />
                  <span className="text-xs text-text-secondary font-mono">
                    Exploring step {currentStepIndex + 1} / {result?.steps.length ?? 0}
                  </span>
                </motion.div>
              )}
              {isComplete && result && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 border border-subtle"
                >
                  <div className="w-2 h-2 rounded-full bg-accent-green" />
                  <span className="text-xs text-text-secondary font-mono">
                    {result.path.length > 0
                      ? `Path found: ${result.path.join(' → ')} (cost: ${result.metrics.pathCost})`
                      : 'No path found'}
                  </span>
                </motion.div>
              )}
            </div>

            {/* Heuristic legend (for heuristic algorithms) */}
            {algoInfo.needsHeuristic && (
              <div className="absolute top-4 right-4 z-10 px-3 py-2 rounded-lg bg-surface-2 border border-subtle">
                <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider block mb-1.5">
                  Heuristic h(n) to {goalNode}
                </span>
                <div className="grid grid-cols-5 gap-x-3 gap-y-0.5">
                  {DEFAULT_NODES.map((node) => (
                    <span key={node.id} className="text-[10px] font-mono text-text-secondary">
                      {node.id}:{HEURISTIC[node.id]}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* SVG Graph */}
            <svg
              viewBox="0 0 680 480"
              className="w-full h-full"
              style={{ minHeight: 400 }}
            >
              {/* Glow filter */}
              <defs>
                <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feFlood floodColor="#3b82f6" floodOpacity="0.3" />
                  <feComposite in2="blur" operator="in" />
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feFlood floodColor="#f59e0b" floodOpacity="0.25" />
                  <feComposite in2="blur" operator="in" />
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glow-current" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feFlood floodColor="#3b82f6" floodOpacity="0.5" />
                  <feComposite in2="blur" operator="in" />
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Edges */}
              {DEFAULT_EDGES.map((edge) => {
                const fromNode = DEFAULT_NODES.find((n) => n.id === edge.from)!;
                const toNode = DEFAULT_NODES.find((n) => n.id === edge.to)!;
                const isPathEdge =
                  isComplete &&
                  result &&
                  result.path.length > 0 &&
                  result.path.some(
                    (n, i) =>
                      i < result.path.length - 1 &&
                      ((n === edge.from && result.path[i + 1] === edge.to) ||
                        (n === edge.to && result.path[i + 1] === edge.from))
                  );

                const mx = (fromNode.x + toNode.x) / 2;
                const my = (fromNode.y + toNode.y) / 2;

                return (
                  <g key={`${edge.from}-${edge.to}`}>
                    <line
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                      stroke={isPathEdge ? '#ffffff' : 'rgba(255,255,255,0.08)'}
                      strokeWidth={isPathEdge ? 2.5 : 1}
                      className="transition-all duration-300"
                    />
                    <rect
                      x={mx - 10}
                      y={my - 8}
                      width={20}
                      height={16}
                      rx={4}
                      fill={isPathEdge ? '#1a1a1a' : '#0a0a0a'}
                      stroke={isPathEdge ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}
                      strokeWidth={0.5}
                    />
                    <text
                      x={mx}
                      y={my + 4}
                      textAnchor="middle"
                      className="text-[10px] font-mono"
                      fill={isPathEdge ? '#ffffff' : '#71717a'}
                    >
                      {edge.weight}
                    </text>
                  </g>
                );
              })}

              {/* Nodes */}
              {DEFAULT_NODES.map((node) => {
                const status = getNodeStatus(
                  node.id,
                  currentStep,
                  result?.path ?? [],
                  startNode,
                  goalNode,
                  isComplete
                );
                const colors = nodeColors(status);
                const glowFilter =
                  status === 'current'
                    ? 'url(#glow-current)'
                    : status === 'visited'
                    ? 'url(#glow-blue)'
                    : status === 'frontier'
                    ? 'url(#glow-amber)'
                    : undefined;

                return (
                  <g key={node.id} filter={glowFilter}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={20}
                      fill={colors.fill}
                      stroke={colors.stroke}
                      strokeWidth={status === 'current' || status === 'path' ? 2.5 : 1.5}
                      className="transition-all duration-300"
                    />
                    <text
                      x={node.x}
                      y={node.y + 4.5}
                      textAnchor="middle"
                      fill={colors.textColor}
                      className="text-xs font-semibold select-none"
                      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                    >
                      {node.label ?? node.id}
                    </text>
                    {/* h(n) label for heuristic algos */}
                    {algoInfo.needsHeuristic && (
                      <text
                        x={node.x}
                        y={node.y - 26}
                        textAnchor="middle"
                        fill="#71717a"
                        className="text-[9px] font-mono"
                      >
                        h={HEURISTIC[node.id]}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Legend */}
              <g transform="translate(16, 430)">
                {[
                  { color: '#22c55e', label: 'Start' },
                  { color: '#ef4444', label: 'Goal' },
                  { color: '#3b82f6', label: 'Visited' },
                  { color: '#f59e0b', label: 'Frontier' },
                  { color: '#ffffff', label: 'Path' },
                ].map((item, i) => (
                  <g key={item.label} transform={`translate(${i * 90}, 0)`}>
                    <circle cx={6} cy={6} r={4} fill={item.color} />
                    <text
                      x={16}
                      y={10}
                      fill="#71717a"
                      className="text-[10px]"
                      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                    >
                      {item.label}
                    </text>
                  </g>
                ))}
              </g>
            </svg>
          </div>

          {/* Compare Mode Table */}
          <AnimatePresence>
            {compareMode && compareResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-subtle bg-surface-1 overflow-x-auto"
              >
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Waypoints className="w-4 h-4 text-accent-purple" />
                    <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                      Comparison Results
                    </span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-subtle">
                        {['Algorithm', 'Nodes', 'Peak Frontier', 'Path Cost', 'Time (ms)', 'Path'].map(
                          (h) => (
                            <th
                              key={h}
                              className="text-left py-2 px-3 text-text-tertiary font-medium"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {compareResults.map((r) => {
                        const isBest = r.metrics.pathCost > 0 &&
                          r.metrics.pathCost ===
                            Math.min(
                              ...compareResults
                                .filter((cr) => cr.metrics.pathCost > 0)
                                .map((cr) => cr.metrics.pathCost)
                            );
                        return (
                          <tr
                            key={r.algorithm}
                            className={`border-b border-subtle ${
                              isBest ? 'bg-accent-green/5' : ''
                            }`}
                          >
                            <td className="py-2 px-3 font-medium text-white">
                              {r.algorithm}
                            </td>
                            <td className="py-2 px-3 font-mono text-text-secondary">
                              {r.metrics.nodesExpanded}
                            </td>
                            <td className="py-2 px-3 font-mono text-text-secondary">
                              {r.metrics.peakFrontier}
                            </td>
                            <td className={`py-2 px-3 font-mono ${isBest ? 'text-accent-green' : 'text-text-secondary'}`}>
                              {r.metrics.pathCost || '—'}
                            </td>
                            <td className="py-2 px-3 font-mono text-text-secondary">
                              {r.metrics.executionMs.toFixed(3)}
                            </td>
                            <td className="py-2 px-3 font-mono text-text-tertiary">
                              {r.path.length > 0 ? r.path.join('→') : 'None'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reasoning Timeline */}
          <ReasoningTimeline
            steps={result?.steps ?? []}
            currentStep={currentStepIndex}
            onStepClick={(i) => {
              if (!isAnimating) setCurrentStepIndex(i);
            }}
          />
        </main>

        {/* ── Right Panel: Analytics ── */}
        <AnalyticsPanel
          metrics={result?.metrics ?? null}
          algorithmName={result ? algoInfo.name : undefined}
        />
      </div>
    </div>
  );
}
