/* ── Graph ── */
export interface GraphNode { id: string; x: number; y: number; label?: string }
export interface GraphEdge { from: string; to: string; weight: number }
export interface Graph { nodes: GraphNode[]; edges: GraphEdge[]; adjacency: Record<string, Record<string, number>> }

/* ── Search ── */
export interface SearchStep {
  step: number; node: string; action: string; reason: string;
  frontier: { id: string; f?: number; g?: number; h?: number }[];
  visited: string[]; path: string[];
}

export interface AlgoMetrics {
  executionMs: number; nodesExpanded: number; peakFrontier: number;
  pathCost: number; branchingFactor: number; totalOps: number;
  timeComplexity: string; spaceComplexity: string;
}

export interface SearchResult {
  algorithm: string; path: string[]; visitedOrder: string[];
  steps: SearchStep[]; metrics: AlgoMetrics;
}

/* ── CSP ── */
export interface CSPStep {
  step: number; variable: string; value: number | string;
  action: 'assign' | 'backtrack' | 'prune' | 'consistent';
  reason: string; domains: Record<string, (number | string)[]>;
  assignments: Record<string, number | string>;
}

export interface CSPResult {
  algorithm: string; solution: Record<string, number | string> | null;
  steps: CSPStep[];
  metrics: { backtracks: number; nodesExplored: number; constraintChecks: number; executionMs: number };
}

/* ── Minimax ── */
export interface GameNode {
  id: string; value?: number; children: GameNode[]; isMax: boolean;
  alpha?: number; beta?: number; pruned: boolean; depth: number; move?: string;
}

export interface MinimaxStep {
  step: number; node: string; action: string; reason: string; value?: number;
}

export interface MinimaxResult {
  bestMove: string; value: number; tree: GameNode;
  nodesVisited: number; nodesPruned: number; executionMs: number; steps: MinimaxStep[];
}

/* ── Bayes ── */
export interface BayesStep { step: number; description: string; formula: string; value: number }
export interface BayesResult {
  prior: number; likelihood: number; evidence: number; posterior: number; steps: BayesStep[];
}

/* ── Module config ── */
export type ModuleId = 'search' | 'constraints' | 'decisions' | 'uncertainty';

export interface Scenario {
  id: string; title: string; subtitle: string; module: ModuleId;
  icon: string; description: string;
}
