'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { fetchWithFallback, type Engine } from '@/lib/config';
import SearchTree from '@/components/search/SearchTree';
import XAIPanel from '@/components/search/XAIPanel';
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
  { id: 'A', x: 150, y: 100, label: 'A' },
  { id: 'B', x: 350, y: 80, label: 'B' },
  { id: 'C', x: 100, y: 300, label: 'C' },
  { id: 'D', x: 300, y: 280, label: 'D' },
  { id: 'E', x: 550, y: 150, label: 'E' },
  { id: 'F', x: 500, y: 350, label: 'F' },
  { id: 'G', x: 200, y: 500, label: 'G' },
  { id: 'H', x: 750, y: 250, label: 'H' },
  { id: 'I', x: 400, y: 520, label: 'I' },
  { id: 'J', x: 650, y: 480, label: 'J' },
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

/* These are used as defaults for initialization */

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
  if (isComplete && path.length > 0 && path.includes(nodeId)) return 'path';
  if (nodeId === goal) return 'goal';
  if (nodeId === start) return 'start';
  if (step?.node === nodeId) return 'current';
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
  const [nodes, setNodes] = useState<GraphNode[]>(DEFAULT_NODES);
  const [edges, setEdges] = useState<GraphEdge[]>(DEFAULT_EDGES);
  const [isDirected, setIsDirected] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'graph' | 'tree' | 'xai'>('graph');
  const [selectedElement, setSelectedElement] = useState<{type: 'node' | 'edge', id: string} | null>(null);
  
  // For edge creation interaction
  const [edgeSourceNode, setEdgeSourceNode] = useState<string | null>(null);

  const adjacency = useMemo(() => {
    const adj: Record<string, Record<string, number>> = {};
    for (const node of nodes) {
      adj[node.id] = {};
    }
    for (const edge of edges) {
      if (adj[edge.from] && adj[edge.to]) {
        adj[edge.from][edge.to] = edge.weight;
        if (!isDirected) {
          adj[edge.to][edge.from] = edge.weight;
        }
      }
    }
    return adj;
  }, [nodes, edges, isDirected]);

  const heuristic = React.useMemo(() => {
    const h: Record<string, number> = {};
    const goal = nodes.find(n => n.id === goalNode);
    if (!goal) return h;
    for (const node of nodes) {
      const dist = Math.sqrt(Math.pow(node.x - goal.x, 2) + Math.pow(node.y - goal.y, 2));
      h[node.id] = Math.round(dist / 40); // Scaled estimate
    }
    return h;
  }, [nodes, goalNode]);

  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodeIds = nodes.map((n) => n.id);

  const algoInfo = ALGORITHMS.find((a) => a.id === selectedAlgo)!;

  const [engineType, setEngineType] = useState<Engine | null>(null);
  const [executeError, setExecuteError] = useState<string | null>(null);

  /* Local fallback for search algorithms */
  const localSearchFallback = useCallback((algo: string): SearchResult => {
    const algoMap: Record<string, Function> = { bfs, dfs, ucs, gbfs, astar, dijkstra, iddfs, idaStar };
    const fn = algoMap[algo];
    const h = ALGORITHMS.find(a => a.id === algo)?.needsHeuristic ? heuristic : undefined;
    return h ? fn(adjacency, startNode, goalNode, h) : fn(adjacency, startNode, goalNode);
  }, [adjacency, startNode, goalNode, heuristic]);

  /* Run selected algorithm via Python Backend with local fallback */
  const execute = useCallback(async () => {
    if (isAnimating) return;
    setIsComplete(false);
    setCurrentStepIndex(-1);
    setCompareResults([]);
    setExecuteError(null);

    try {
      const { data: res, engine } = await fetchWithFallback<SearchResult>(
        '/api/search/execute',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            algorithm: selectedAlgo,
            adjacency: adjacency,
            start: startNode,
            goal: goalNode,
            heuristic: algoInfo.needsHeuristic ? heuristic : {}
          })
        },
        () => localSearchFallback(selectedAlgo)
      );
      setEngineType(engine);
      setResult(res);

      if (compareMode) {
        const compareResults = await Promise.all(
          ALGORITHMS.map(async (a) => {
            try {
              const { data } = await fetchWithFallback<SearchResult>(
                '/api/search/execute',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    algorithm: a.id,
                    adjacency: adjacency,
                    start: startNode,
                    goal: goalNode,
                    heuristic: a.needsHeuristic ? heuristic : {}
                  })
                },
                () => localSearchFallback(a.id)
              );
              return data;
            } catch { return null; }
          })
        );
        setCompareResults(compareResults.filter((r): r is SearchResult => r !== null));
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
      
    } catch (err) {
      setExecuteError('Failed to execute algorithm. Please try again.');
      console.error("Execution failed:", err);
    }
  }, [selectedAlgo, startNode, goalNode, speed, isAnimating, compareMode, algoInfo, adjacency, heuristic, localSearchFallback]);

  /* Reset */
  const reset = useCallback(() => {
    if (animationRef.current) clearTimeout(animationRef.current);
    setResult(null);
    setCurrentStepIndex(-1);
    setIsAnimating(false);
    setIsComplete(false);
    setCompareResults([]);
    setSelectedElement(null);
    setEdgeSourceNode(null);
  }, []);

  /* Graph Builder Handlers */
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!editMode || isAnimating) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    
    let nextLetter = 'A';
    for (let i = 0; i < 26; i++) {
      const char = String.fromCharCode(65 + i);
      if (!nodes.find(n => n.id === char)) {
        nextLetter = char;
        break;
      }
    }
    const newNode = { id: nextLetter, x, y, label: nextLetter };
    setNodes(prev => [...prev, newNode]);
    setEdgeSourceNode(null);
    setSelectedElement(null);
  };

  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    if (!editMode || isAnimating) return;
    e.stopPropagation();
    
    if (edgeSourceNode) {
       if (edgeSourceNode !== nodeId) {
          const existing = edges.find(ed => (ed.from === edgeSourceNode && ed.to === nodeId) || (!isDirected && ed.from === nodeId && ed.to === edgeSourceNode));
          if (!existing) {
             setEdges(prev => [...prev, { from: edgeSourceNode, to: nodeId, weight: 1 }]);
          }
       }
       setEdgeSourceNode(null);
       setSelectedElement(null);
    } else {
       setSelectedElement({ type: 'node', id: nodeId });
       setEdgeSourceNode(nodeId);
    }
  };

  const handleEdgeClick = (e: React.MouseEvent, from: string, to: string) => {
    if (!editMode || isAnimating) return;
    e.stopPropagation();
    setSelectedElement({ type: 'edge', id: `${from}-${to}` });
    setEdgeSourceNode(null);
  };

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

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      <CommandBar module="Search Intelligence Lab" subtitle={algoInfo.name} engineIndicator={engineType} />

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row relative pt-14">
        {/* ── Left Panel: Controls ── */}
        <aside className="w-full md:w-64 min-w-[16rem] bg-surface-1 border-r border-subtle flex flex-col overflow-y-visible flex-shrink-0 z-20">
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

          {/* Edit Mode */}
          <div className="p-5 border-b border-subtle">
            <button
              onClick={() => {
                setEditMode(!editMode);
                setEdgeSourceNode(null);
                setSelectedElement(null);
              }}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-all duration-200 border ${
                editMode
                  ? 'bg-surface-3 border-accent-blue/30 text-accent-blue'
                  : 'bg-surface-1 border-subtle text-text-secondary hover:bg-surface-2'
              }`}
            >
              <Waypoints className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Edit Mode</span>
            </button>
            {editMode && (
              <div className="mt-3 flex flex-col gap-1.5">
                <button
                  onClick={() => {
                     setNodes([]); setEdges([]); setStartNode(''); setGoalNode('');
                  }}
                  className="text-[10px] text-text-tertiary hover:text-white text-left px-2 py-1 rounded hover:bg-surface-2 transition-colors"
                >
                  Clear Canvas
                </button>
                <button
                  onClick={() => {
                     setNodes(DEFAULT_NODES); setEdges(DEFAULT_EDGES); setStartNode('A'); setGoalNode('J');
                  }}
                  className="text-[10px] text-text-tertiary hover:text-white text-left px-2 py-1 rounded hover:bg-surface-2 transition-colors"
                >
                  Reset Default Graph
                </button>
                <button
                  onClick={() => setIsDirected(!isDirected)}
                  className="text-[10px] text-text-tertiary hover:text-white text-left px-2 py-1 rounded hover:bg-surface-2 transition-colors"
                >
                  {isDirected ? 'Make Undirected' : 'Make Directed'}
                </button>
              </div>
            )}
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

        {/* ── Center + Right: Main Content ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top: Graph + XAI side by side */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Graph Visualization */}
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
            {algoInfo.needsHeuristic && !editMode && (
              <div className="absolute top-4 right-4 z-10 px-3 py-2 rounded-lg bg-surface-2 border border-subtle">
                <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider block mb-1.5">
                  Heuristic h(n) to {goalNode}
                </span>
                <div className="grid grid-cols-5 gap-x-3 gap-y-0.5">
                  {nodes.map((node) => (
                    <span key={node.id} className="text-[10px] font-mono text-text-secondary">
                      {node.id}:{heuristic[node.id]}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Element Edit Panel */}
            {editMode && selectedElement && (
              <div className="absolute top-4 right-4 z-20 p-4 rounded-xl bg-surface-1 border border-subtle w-48 shadow-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-medium text-white">
                    Edit {selectedElement.type === 'node' ? 'Node' : 'Edge'}
                  </span>
                  <button onClick={() => setSelectedElement(null)} className="text-text-tertiary hover:text-white">✕</button>
                </div>
                {selectedElement.type === 'node' ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-text-tertiary uppercase tracking-wider">Label</label>
                    <input 
                      type="text" 
                      maxLength={3}
                      value={nodes.find(n => n.id === selectedElement.id)?.label || ''}
                      onChange={(e) => setNodes(nodes.map(n => n.id === selectedElement.id ? {...n, label: e.target.value} : n))}
                      className="bg-surface-2 border border-subtle rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-border-active"
                    />
                    <button 
                      onClick={() => {
                        setNodes(nodes.filter(n => n.id !== selectedElement.id));
                        setEdges(edges.filter(e => e.from !== selectedElement.id && e.to !== selectedElement.id));
                        setSelectedElement(null);
                      }}
                      className="mt-2 w-full py-1.5 bg-accent-red/10 text-accent-red rounded-lg text-xs hover:bg-accent-red/20 transition-colors"
                    >
                      Delete Node
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-text-tertiary uppercase tracking-wider">Weight</label>
                    <input 
                      type="number"
                      min={1}
                      max={99}
                      value={edges.find(e => `${e.from}-${e.to}` === selectedElement.id)?.weight || 1}
                      onChange={(e) => setEdges(edges.map(ed => `${ed.from}-${ed.to}` === selectedElement.id ? {...ed, weight: Number(e.target.value)} : ed))}
                      className="bg-surface-2 border border-subtle rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-border-active"
                    />
                    <button 
                      onClick={() => {
                        setEdges(edges.filter(e => `${e.from}-${e.to}` !== selectedElement.id));
                        setSelectedElement(null);
                      }}
                      className="mt-2 w-full py-1.5 bg-accent-red/10 text-accent-red rounded-lg text-xs hover:bg-accent-red/20 transition-colors"
                    >
                      Delete Edge
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SVG Graph */}
            <svg
              viewBox="0 0 850 600"
              className={`w-full h-full ${editMode ? 'cursor-crosshair' : ''}`}
              style={{ minHeight: 400 }}
              onClick={handleSvgClick}
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
              {edges.map((edge) => {
                const fromNode = nodes.find((n) => n.id === edge.from);
                const toNode = nodes.find((n) => n.id === edge.to);
                if (!fromNode || !toNode) return null;

                const isPathEdge =
                  isComplete &&
                  result &&
                  result.path.length > 0 &&
                  result.path.some(
                    (n, i) =>
                      i < result.path.length - 1 &&
                      ((n === edge.from && result.path[i + 1] === edge.to) ||
                        (!isDirected && n === edge.to && result.path[i + 1] === edge.from))
                  );
                  
                const isSelected = selectedElement?.id === `${edge.from}-${edge.to}`;

                const mx = (fromNode.x + toNode.x) / 2;
                const my = (fromNode.y + toNode.y) / 2;

                return (
                  <g 
                    key={`${edge.from}-${edge.to}`} 
                    onClick={(e) => handleEdgeClick(e, edge.from, edge.to)}
                    className={editMode ? "cursor-pointer" : ""}
                  >
                    {/* Invisible thicker line for easier clicking */}
                    {editMode && (
                      <line
                        x1={fromNode.x} y1={fromNode.y}
                        x2={toNode.x} y2={toNode.y}
                        stroke="transparent"
                        strokeWidth={20}
                      />
                    )}
                    <line
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                      stroke={isPathEdge ? '#ffffff' : isSelected ? '#3b82f6' : 'rgba(255,255,255,0.08)'}
                      strokeWidth={isPathEdge || isSelected ? 2.5 : 1}
                      className="transition-all duration-300"
                    />
                    <rect
                      x={mx - 10}
                      y={my - 8}
                      width={20}
                      height={16}
                      rx={4}
                      fill={isPathEdge ? '#1a1a1a' : isSelected ? '#1e3a8a' : '#0a0a0a'}
                      stroke={isPathEdge ? 'rgba(255,255,255,0.2)' : isSelected ? '#60a5fa' : 'rgba(255,255,255,0.06)'}
                      strokeWidth={0.5}
                    />
                    <text
                      x={mx}
                      y={my + 4}
                      textAnchor="middle"
                      className="text-[10px] font-mono"
                      fill={isPathEdge || isSelected ? '#ffffff' : '#71717a'}
                    >
                      {edge.weight}
                    </text>
                  </g>
                );
              })}

              {/* Nodes */}
              {nodes.map((node) => {
                const status = getNodeStatus(
                  node.id,
                  currentStep,
                  result?.path ?? [],
                  startNode,
                  goalNode,
                  isComplete
                );
                let colors = nodeColors(status);
                
                // Override for Edit Mode selection
                const isSelected = selectedElement?.id === node.id;
                const isEdgeSource = edgeSourceNode === node.id;
                if (editMode) {
                  if (isSelected || isEdgeSource) {
                     colors = { fill: '#1e3a8a', stroke: '#3b82f6', textColor: '#ffffff' };
                  }
                }

                const glowFilter =
                  status === 'current'
                    ? 'url(#glow-current)'
                    : status === 'visited'
                    ? 'url(#glow-blue)'
                    : status === 'frontier'
                    ? 'url(#glow-amber)'
                    : undefined;

                return (
                  <g 
                    key={node.id} 
                    filter={!editMode ? glowFilter : undefined}
                    onClick={(e) => handleNodeClick(e, node.id)}
                    className={editMode ? "cursor-pointer hover:opacity-80" : ""}
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={20}
                      fill={colors.fill}
                      stroke={colors.stroke}
                      strokeWidth={status === 'current' || status === 'path' || isSelected || isEdgeSource ? 2.5 : 1.5}
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
                    {algoInfo.needsHeuristic && !editMode && (
                      <text
                        x={node.x}
                        y={node.y - 26}
                        textAnchor="middle"
                        fill="#71717a"
                        className="text-[9px] font-mono"
                      >
                        h={heuristic[node.id]}
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

            {/* XAI Panel (right side) */}
            <aside className="w-64 bg-surface-1 border-l border-[rgba(255,255,255,0.06)] flex-shrink-0 overflow-hidden">
              <XAIPanel
                step={currentStep}
                algorithmId={selectedAlgo}
                algorithmName={algoInfo.name}
                isComplete={isComplete}
                path={result?.path ?? []}
              />
            </aside>
          </div>

          {/* Bottom: SearchTree + Timeline side by side */}
          <div className="h-52 flex border-t border-[rgba(255,255,255,0.06)] flex-shrink-0">
            {/* Search Tree */}
            <div className="w-1/2 border-r border-[rgba(255,255,255,0.06)] bg-surface-0 overflow-hidden">
              <SearchTree
                steps={result?.steps ?? []}
                currentStepIndex={currentStepIndex}
                path={result?.path ?? []}
                isComplete={isComplete}
                algorithmName={algoInfo.name}
              />
            </div>
            {/* Reasoning Timeline */}
            <div className="w-1/2 overflow-hidden">

          {/* ── Compare Mode Panel ── */}
            <ReasoningTimeline
              steps={result?.steps ?? []}
              currentStep={currentStepIndex}
              onStepClick={(i) => {
                if (!isAnimating) setCurrentStepIndex(i);
              }}
            />
            </div>
          </div>

          {/* ── Compare Mode Panel ── */}
          <AnimatePresence>
            {compareMode && compareResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-subtle bg-surface-1 overflow-hidden flex flex-col max-h-[300px]"
              >
                <div className="p-4 border-b border-subtle shrink-0">
                  <div className="flex items-center gap-2">
                    <Waypoints className="w-4 h-4 text-accent-purple" />
                    <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                      Comparison Results
                    </span>
                  </div>
                </div>
                <div className="overflow-auto min-h-0 flex-1 relative">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-surface-1 z-10 shadow-sm">
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
                        const stepLimit = isAnimating || !isComplete ? currentStepIndex : r.steps.length - 1;
                        const boundedStep = Math.max(0, Math.min(stepLimit, r.steps.length - 1));
                        const stepData = r.steps[boundedStep];
                        const finished = boundedStep === r.steps.length - 1 && isComplete;

                        const liveNodes = boundedStep;
                        const livePeak = stepData?.frontier?.length || 0;
                        const liveCost = finished ? (r.metrics.pathCost || '—') : '...';
                        const liveTime = finished ? r.metrics.executionMs.toFixed(3) : '...';
                        const livePath = finished ? (r.path.length > 0 ? r.path.join('→') : 'None') : '...';

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
                              finished && isBest ? 'bg-accent-green/5' : ''
                            }`}
                          >
                            <td className="py-2 px-3 font-medium text-white">
                              {r.algorithm}
                            </td>
                            <td className="py-2 px-3 font-mono text-text-secondary">
                              {finished ? r.metrics.nodesExpanded : liveNodes}
                            </td>
                            <td className="py-2 px-3 font-mono text-text-secondary">
                              {finished ? r.metrics.peakFrontier : livePeak}
                            </td>
                            <td className={`py-2 px-3 font-mono ${finished && isBest ? 'text-accent-green' : 'text-text-secondary'}`}>
                              {liveCost}
                            </td>
                            <td className="py-2 px-3 font-mono text-text-secondary">
                              {liveTime}
                            </td>
                            <td className="py-2 px-3 font-mono text-text-tertiary">
                              {livePath}
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
        </div>

        {/* ── Right Panel: Analytics ── */}
        <AnalyticsPanel
          metrics={result?.metrics ?? null}
          algorithmName={result ? algoInfo.name : undefined}
        />
      </div>
    </div>
  );
}
