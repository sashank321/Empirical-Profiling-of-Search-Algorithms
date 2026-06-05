import type { SearchResult, SearchStep, AlgoMetrics } from '@/lib/types';

/* ─── Helpers ─── */

type Adjacency = Record<string, Record<string, number>>;
type Heuristic = Record<string, number>;

interface FrontierEntry {
  id: string;
  f?: number;
  g?: number;
  h?: number;
}

function reconstructPath(
  parents: Record<string, string | null>,
  goal: string
): string[] {
  const path: string[] = [];
  let current: string | null = goal;
  while (current !== null) {
    path.unshift(current);
    current = parents[current] ?? null;
  }
  return path;
}

function computePathCost(path: string[], adjacency: Adjacency): number {
  let cost = 0;
  for (let i = 0; i < path.length - 1; i++) {
    cost += adjacency[path[i]]?.[path[i + 1]] ?? 0;
  }
  return cost;
}

function computeBranchingFactor(
  adjacency: Adjacency,
  visitedOrder: string[]
): number {
  let totalChildren = 0;
  let nonLeafNodes = 0;
  for (const node of visitedOrder) {
    const neighbors = Object.keys(adjacency[node] ?? {});
    if (neighbors.length > 0) {
      totalChildren += neighbors.length;
      nonLeafNodes++;
    }
  }
  return nonLeafNodes > 0 ? totalChildren / nonLeafNodes : 0;
}

function timer(): { elapsed: () => number } {
  const start = performance.now();
  return { elapsed: () => performance.now() - start };
}

/* ═══════════════════════════════════════════════════════
   1. Breadth-First Search (BFS)
   ═══════════════════════════════════════════════════════ */
export function bfs(
  adjacency: Adjacency,
  start: string,
  goal: string
): SearchResult {
  const t = timer();
  const visited = new Set<string>();
  const visitedOrder: string[] = [];
  const parents: Record<string, string | null> = { [start]: null };
  const queue: string[] = [start];
  const steps: SearchStep[] = [];
  let peakFrontier = 1;
  let totalOps = 0;

  visited.add(start);

  while (queue.length > 0) {
    const node = queue.shift()!;
    totalOps++;
    visitedOrder.push(node);

    const frontierSnapshot: FrontierEntry[] = queue.map((id) => ({ id }));
    steps.push({
      step: steps.length + 1,
      node,
      action: `Dequeue node ${node}`,
      reason: `FIFO order — ${node} was added first among frontier`,
      frontier: frontierSnapshot,
      visited: [...visited],
      path: reconstructPath(parents, node),
    });

    if (node === goal) {
      const path = reconstructPath(parents, goal);
      return {
        algorithm: 'BFS',
        path,
        visitedOrder,
        steps,
        metrics: {
          executionMs: t.elapsed(),
          nodesExpanded: visitedOrder.length,
          peakFrontier,
          pathCost: computePathCost(path, adjacency),
          branchingFactor: computeBranchingFactor(adjacency, visitedOrder),
          totalOps,
          timeComplexity: 'O(V+E)',
          spaceComplexity: 'O(V)',
        },
      };
    }

    const neighbors = Object.keys(adjacency[node] ?? {}).sort();
    for (const neighbor of neighbors) {
      totalOps++;
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parents[neighbor] = node;
        queue.push(neighbor);
      }
    }
    peakFrontier = Math.max(peakFrontier, queue.length);
  }

  return {
    algorithm: 'BFS',
    path: [],
    visitedOrder,
    steps,
    metrics: {
      executionMs: t.elapsed(),
      nodesExpanded: visitedOrder.length,
      peakFrontier,
      pathCost: 0,
      branchingFactor: computeBranchingFactor(adjacency, visitedOrder),
      totalOps,
      timeComplexity: 'O(V+E)',
      spaceComplexity: 'O(V)',
    },
  };
}

/* ═══════════════════════════════════════════════════════
   2. Depth-First Search (DFS)
   ═══════════════════════════════════════════════════════ */
export function dfs(
  adjacency: Adjacency,
  start: string,
  goal: string
): SearchResult {
  const t = timer();
  const visited = new Set<string>();
  const visitedOrder: string[] = [];
  const parents: Record<string, string | null> = { [start]: null };
  const stack: string[] = [start];
  const steps: SearchStep[] = [];
  let peakFrontier = 1;
  let totalOps = 0;

  while (stack.length > 0) {
    const node = stack.pop()!;
    totalOps++;

    if (visited.has(node)) continue;
    visited.add(node);
    visitedOrder.push(node);

    const frontierSnapshot: FrontierEntry[] = stack.map((id) => ({ id }));
    steps.push({
      step: steps.length + 1,
      node,
      action: `Pop node ${node} from stack`,
      reason: `LIFO order — ${node} is on top of the stack`,
      frontier: frontierSnapshot,
      visited: [...visited],
      path: reconstructPath(parents, node),
    });

    if (node === goal) {
      const path = reconstructPath(parents, goal);
      return {
        algorithm: 'DFS',
        path,
        visitedOrder,
        steps,
        metrics: {
          executionMs: t.elapsed(),
          nodesExpanded: visitedOrder.length,
          peakFrontier,
          pathCost: computePathCost(path, adjacency),
          branchingFactor: computeBranchingFactor(adjacency, visitedOrder),
          totalOps,
          timeComplexity: 'O(V+E)',
          spaceComplexity: 'O(V)',
        },
      };
    }

    const neighbors = Object.keys(adjacency[node] ?? {}).sort().reverse();
    for (const neighbor of neighbors) {
      totalOps++;
      if (!visited.has(neighbor)) {
        parents[neighbor] = node;
        stack.push(neighbor);
      }
    }
    peakFrontier = Math.max(peakFrontier, stack.length);
  }

  return {
    algorithm: 'DFS',
    path: [],
    visitedOrder,
    steps,
    metrics: {
      executionMs: t.elapsed(),
      nodesExpanded: visitedOrder.length,
      peakFrontier,
      pathCost: 0,
      branchingFactor: computeBranchingFactor(adjacency, visitedOrder),
      totalOps,
      timeComplexity: 'O(V+E)',
      spaceComplexity: 'O(V)',
    },
  };
}

/* ═══════════════════════════════════════════════════════
   3. Uniform Cost Search (UCS)
   ═══════════════════════════════════════════════════════ */
export function ucs(
  adjacency: Adjacency,
  start: string,
  goal: string
): SearchResult {
  const t = timer();
  const visited = new Set<string>();
  const visitedOrder: string[] = [];
  const parents: Record<string, string | null> = { [start]: null };
  const gCost: Record<string, number> = { [start]: 0 };
  const frontier: { id: string; g: number }[] = [{ id: start, g: 0 }];
  const steps: SearchStep[] = [];
  let peakFrontier = 1;
  let totalOps = 0;

  while (frontier.length > 0) {
    frontier.sort((a, b) => a.g - b.g);
    const { id: node, g } = frontier.shift()!;
    totalOps++;

    if (visited.has(node)) continue;
    visited.add(node);
    visitedOrder.push(node);

    const frontierSnapshot: FrontierEntry[] = frontier.map((f) => ({
      id: f.id,
      g: f.g,
    }));
    steps.push({
      step: steps.length + 1,
      node,
      action: `Expand node ${node} with g(n)=${g}`,
      reason: `Lowest cumulative cost g(${node})=${g}`,
      frontier: frontierSnapshot,
      visited: [...visited],
      path: reconstructPath(parents, node),
    });

    if (node === goal) {
      const path = reconstructPath(parents, goal);
      return {
        algorithm: 'UCS',
        path,
        visitedOrder,
        steps,
        metrics: {
          executionMs: t.elapsed(),
          nodesExpanded: visitedOrder.length,
          peakFrontier,
          pathCost: g,
          branchingFactor: computeBranchingFactor(adjacency, visitedOrder),
          totalOps,
          timeComplexity: 'O(V²)',
          spaceComplexity: 'O(V)',
        },
      };
    }

    const neighbors = Object.keys(adjacency[node] ?? {}).sort();
    for (const neighbor of neighbors) {
      totalOps++;
      const newG = g + (adjacency[node][neighbor] ?? 0);
      if (!visited.has(neighbor) && (gCost[neighbor] === undefined || newG < gCost[neighbor])) {
        gCost[neighbor] = newG;
        parents[neighbor] = node;
        frontier.push({ id: neighbor, g: newG });
      }
    }
    peakFrontier = Math.max(peakFrontier, frontier.length);
  }

  return {
    algorithm: 'UCS',
    path: [],
    visitedOrder,
    steps,
    metrics: {
      executionMs: t.elapsed(),
      nodesExpanded: visitedOrder.length,
      peakFrontier,
      pathCost: 0,
      branchingFactor: computeBranchingFactor(adjacency, visitedOrder),
      totalOps,
      timeComplexity: 'O(V²)',
      spaceComplexity: 'O(V)',
    },
  };
}

/* ═══════════════════════════════════════════════════════
   4. Greedy Best-First Search (GBFS)
   ═══════════════════════════════════════════════════════ */
export function gbfs(
  adjacency: Adjacency,
  start: string,
  goal: string,
  heuristic: Heuristic
): SearchResult {
  const t = timer();
  const visited = new Set<string>();
  const visitedOrder: string[] = [];
  const parents: Record<string, string | null> = { [start]: null };
  const frontier: { id: string; h: number }[] = [
    { id: start, h: heuristic[start] ?? 0 },
  ];
  const steps: SearchStep[] = [];
  let peakFrontier = 1;
  let totalOps = 0;

  while (frontier.length > 0) {
    frontier.sort((a, b) => a.h - b.h);
    const { id: node, h } = frontier.shift()!;
    totalOps++;

    if (visited.has(node)) continue;
    visited.add(node);
    visitedOrder.push(node);

    const frontierSnapshot: FrontierEntry[] = frontier.map((f) => ({
      id: f.id,
      h: f.h,
    }));
    steps.push({
      step: steps.length + 1,
      node,
      action: `Expand node ${node} with h(n)=${h}`,
      reason: `Lowest heuristic h(${node})=${h} — closest estimated to goal`,
      frontier: frontierSnapshot,
      visited: [...visited],
      path: reconstructPath(parents, node),
    });

    if (node === goal) {
      const path = reconstructPath(parents, goal);
      return {
        algorithm: 'GBFS',
        path,
        visitedOrder,
        steps,
        metrics: {
          executionMs: t.elapsed(),
          nodesExpanded: visitedOrder.length,
          peakFrontier,
          pathCost: computePathCost(path, adjacency),
          branchingFactor: computeBranchingFactor(adjacency, visitedOrder),
          totalOps,
          timeComplexity: 'O(V²)',
          spaceComplexity: 'O(V)',
        },
      };
    }

    const neighbors = Object.keys(adjacency[node] ?? {}).sort();
    for (const neighbor of neighbors) {
      totalOps++;
      if (!visited.has(neighbor)) {
        parents[neighbor] = node;
        frontier.push({ id: neighbor, h: heuristic[neighbor] ?? 0 });
      }
    }
    peakFrontier = Math.max(peakFrontier, frontier.length);
  }

  return {
    algorithm: 'GBFS',
    path: [],
    visitedOrder,
    steps,
    metrics: {
      executionMs: t.elapsed(),
      nodesExpanded: visitedOrder.length,
      peakFrontier,
      pathCost: 0,
      branchingFactor: computeBranchingFactor(adjacency, visitedOrder),
      totalOps,
      timeComplexity: 'O(V²)',
      spaceComplexity: 'O(V)',
    },
  };
}

/* ═══════════════════════════════════════════════════════
   5. A* Search
   ═══════════════════════════════════════════════════════ */
export function astar(
  adjacency: Adjacency,
  start: string,
  goal: string,
  heuristic: Heuristic
): SearchResult {
  const t = timer();
  const visited = new Set<string>();
  const visitedOrder: string[] = [];
  const parents: Record<string, string | null> = { [start]: null };
  const gCost: Record<string, number> = { [start]: 0 };
  const hVal = heuristic[start] ?? 0;
  const frontier: { id: string; g: number; h: number; f: number }[] = [
    { id: start, g: 0, h: hVal, f: hVal },
  ];
  const steps: SearchStep[] = [];
  let peakFrontier = 1;
  let totalOps = 0;

  while (frontier.length > 0) {
    frontier.sort((a, b) => a.f - b.f || a.h - b.h);
    const { id: node, g, h, f } = frontier.shift()!;
    totalOps++;

    if (visited.has(node)) continue;
    visited.add(node);
    visitedOrder.push(node);

    const frontierSnapshot: FrontierEntry[] = frontier.map((en) => ({
      id: en.id,
      f: en.f,
      g: en.g,
      h: en.h,
    }));
    steps.push({
      step: steps.length + 1,
      node,
      action: `Expand node ${node} — f(n)=${f}, g(n)=${g}, h(n)=${h}`,
      reason: `Lowest f(${node})=g(${g})+h(${h})=${f}`,
      frontier: frontierSnapshot,
      visited: [...visited],
      path: reconstructPath(parents, node),
    });

    if (node === goal) {
      const path = reconstructPath(parents, goal);
      return {
        algorithm: 'A*',
        path,
        visitedOrder,
        steps,
        metrics: {
          executionMs: t.elapsed(),
          nodesExpanded: visitedOrder.length,
          peakFrontier,
          pathCost: g,
          branchingFactor: computeBranchingFactor(adjacency, visitedOrder),
          totalOps,
          timeComplexity: 'O(V²)',
          spaceComplexity: 'O(V)',
        },
      };
    }

    const neighbors = Object.keys(adjacency[node] ?? {}).sort();
    for (const neighbor of neighbors) {
      totalOps++;
      const newG = g + (adjacency[node][neighbor] ?? 0);
      if (
        !visited.has(neighbor) &&
        (gCost[neighbor] === undefined || newG < gCost[neighbor])
      ) {
        gCost[neighbor] = newG;
        parents[neighbor] = node;
        const nH = heuristic[neighbor] ?? 0;
        frontier.push({ id: neighbor, g: newG, h: nH, f: newG + nH });
      }
    }
    peakFrontier = Math.max(peakFrontier, frontier.length);
  }

  return {
    algorithm: 'A*',
    path: [],
    visitedOrder,
    steps,
    metrics: {
      executionMs: t.elapsed(),
      nodesExpanded: visitedOrder.length,
      peakFrontier,
      pathCost: 0,
      branchingFactor: computeBranchingFactor(adjacency, visitedOrder),
      totalOps,
      timeComplexity: 'O(V²)',
      spaceComplexity: 'O(V)',
    },
  };
}

/* ═══════════════════════════════════════════════════════
   6. Dijkstra's Algorithm
   ═══════════════════════════════════════════════════════ */
export function dijkstra(
  adjacency: Adjacency,
  start: string,
  goal: string
): SearchResult {
  const t = timer();
  const visited = new Set<string>();
  const visitedOrder: string[] = [];
  const parents: Record<string, string | null> = { [start]: null };
  const dist: Record<string, number> = {};
  const allNodes = Object.keys(adjacency);
  for (const n of allNodes) {
    dist[n] = n === start ? 0 : Infinity;
  }
  const frontier: { id: string; g: number }[] = [{ id: start, g: 0 }];
  const steps: SearchStep[] = [];
  let peakFrontier = 1;
  let totalOps = 0;

  while (frontier.length > 0) {
    frontier.sort((a, b) => a.g - b.g);
    const { id: node, g } = frontier.shift()!;
    totalOps++;

    if (visited.has(node)) continue;
    visited.add(node);
    visitedOrder.push(node);

    const frontierSnapshot: FrontierEntry[] = frontier.map((f) => ({
      id: f.id,
      g: f.g,
    }));
    steps.push({
      step: steps.length + 1,
      node,
      action: `Expand ${node} — dist=${g}`,
      reason: `Shortest known distance to ${node} is ${g}`,
      frontier: frontierSnapshot,
      visited: [...visited],
      path: reconstructPath(parents, node),
    });

    const neighbors = Object.keys(adjacency[node] ?? {}).sort();
    for (const neighbor of neighbors) {
      totalOps++;
      const newDist = g + (adjacency[node][neighbor] ?? 0);
      if (newDist < dist[neighbor]) {
        dist[neighbor] = newDist;
        parents[neighbor] = node;
        if (!visited.has(neighbor)) {
          frontier.push({ id: neighbor, g: newDist });
        }
      }
    }
    peakFrontier = Math.max(peakFrontier, frontier.length);
  }

  const path = parents[goal] !== undefined || goal === start
    ? reconstructPath(parents, goal)
    : [];

  return {
    algorithm: 'Dijkstra',
    path,
    visitedOrder,
    steps,
    metrics: {
      executionMs: t.elapsed(),
      nodesExpanded: visitedOrder.length,
      peakFrontier,
      pathCost: dist[goal] === Infinity ? 0 : dist[goal],
      branchingFactor: computeBranchingFactor(adjacency, visitedOrder),
      totalOps,
      timeComplexity: 'O(V²)',
      spaceComplexity: 'O(V)',
    },
  };
}

/* ═══════════════════════════════════════════════════════
   7. Iterative Deepening DFS (IDDFS)
   ═══════════════════════════════════════════════════════ */
export function iddfs(
  adjacency: Adjacency,
  start: string,
  goal: string
): SearchResult {
  const t = timer();
  const visitedOrder: string[] = [];
  const steps: SearchStep[] = [];
  let peakFrontier = 0;
  let totalOps = 0;

  const maxDepth = Object.keys(adjacency).length;

  for (let depthLimit = 0; depthLimit <= maxDepth; depthLimit++) {
    const visited = new Set<string>();
    const parents: Record<string, string | null> = { [start]: null };

    const dls = (
      node: string,
      depth: number
    ): string[] | null => {
      totalOps++;
      visited.add(node);
      if (!visitedOrder.includes(node)) {
        visitedOrder.push(node);
      }

      steps.push({
        step: steps.length + 1,
        node,
        action: `DLS depth-limit=${depthLimit}: visit ${node} at depth ${depth}`,
        reason: `Iterative deepening — exploring to depth ${depthLimit}`,
        frontier: [],
        visited: [...visited],
        path: reconstructPath(parents, node),
      });

      if (node === goal) {
        return reconstructPath(parents, goal);
      }

      if (depth >= depthLimit) return null;

      const neighbors = Object.keys(adjacency[node] ?? {}).sort();
      peakFrontier = Math.max(peakFrontier, neighbors.length);

      for (const neighbor of neighbors) {
        totalOps++;
        if (!visited.has(neighbor)) {
          parents[neighbor] = node;
          const result = dls(neighbor, depth + 1);
          if (result) return result;
        }
      }
      return null;
    };

    const result = dls(start, 0);
    if (result) {
      return {
        algorithm: 'IDDFS',
        path: result,
        visitedOrder,
        steps,
        metrics: {
          executionMs: t.elapsed(),
          nodesExpanded: visitedOrder.length,
          peakFrontier,
          pathCost: computePathCost(result, adjacency),
          branchingFactor: computeBranchingFactor(adjacency, visitedOrder),
          totalOps,
          timeComplexity: 'O(b^d)',
          spaceComplexity: 'O(d)',
        },
      };
    }
  }

  return {
    algorithm: 'IDDFS',
    path: [],
    visitedOrder,
    steps,
    metrics: {
      executionMs: t.elapsed(),
      nodesExpanded: visitedOrder.length,
      peakFrontier,
      pathCost: 0,
      branchingFactor: computeBranchingFactor(adjacency, visitedOrder),
      totalOps,
      timeComplexity: 'O(b^d)',
      spaceComplexity: 'O(d)',
    },
  };
}

/* ═══════════════════════════════════════════════════════
   8. IDA* (Iterative Deepening A*)
   ═══════════════════════════════════════════════════════ */
export function idaStar(
  adjacency: Adjacency,
  start: string,
  goal: string,
  heuristic: Heuristic
): SearchResult {
  const t = timer();
  const visitedOrder: string[] = [];
  const steps: SearchStep[] = [];
  let peakFrontier = 0;
  let totalOps = 0;

  let threshold = heuristic[start] ?? 0;
  const FOUND = -1;

  const search = (
    path: string[],
    g: number
  ): number => {
    const node = path[path.length - 1];
    const f = g + (heuristic[node] ?? 0);
    totalOps++;

    if (f > threshold) return f;

    if (!visitedOrder.includes(node)) {
      visitedOrder.push(node);
    }

    steps.push({
      step: steps.length + 1,
      node,
      action: `IDA* threshold=${threshold}: visit ${node}, f=${f}, g=${g}, h=${heuristic[node] ?? 0}`,
      reason: `f(${node})=${f} ≤ threshold ${threshold}`,
      frontier: [],
      visited: [...visitedOrder],
      path: [...path],
    });

    if (node === goal) return FOUND;

    let min = Infinity;
    const neighbors = Object.keys(adjacency[node] ?? {}).sort();
    peakFrontier = Math.max(peakFrontier, neighbors.length);

    for (const neighbor of neighbors) {
      totalOps++;
      if (!path.includes(neighbor)) {
        path.push(neighbor);
        const result = search(path, g + (adjacency[node][neighbor] ?? 0));
        if (result === FOUND) return FOUND;
        if (result < min) min = result;
        path.pop();
      }
    }

    return min;
  };

  const startPath = [start];
  const maxIterations = Object.keys(adjacency).length * 20;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;
    const result = search(startPath, 0);
    if (result === FOUND) {
      const finalPath = [...startPath];
      return {
        algorithm: 'IDA*',
        path: finalPath,
        visitedOrder,
        steps,
        metrics: {
          executionMs: t.elapsed(),
          nodesExpanded: visitedOrder.length,
          peakFrontier,
          pathCost: computePathCost(finalPath, adjacency),
          branchingFactor: computeBranchingFactor(adjacency, visitedOrder),
          totalOps,
          timeComplexity: 'O(b^d)',
          spaceComplexity: 'O(d)',
        },
      };
    }
    if (result === Infinity) break;
    threshold = result;
  }

  return {
    algorithm: 'IDA*',
    path: [],
    visitedOrder,
    steps,
    metrics: {
      executionMs: t.elapsed(),
      nodesExpanded: visitedOrder.length,
      peakFrontier,
      pathCost: 0,
      branchingFactor: computeBranchingFactor(adjacency, visitedOrder),
      totalOps,
      timeComplexity: 'O(b^d)',
      spaceComplexity: 'O(d)',
    },
  };
}
