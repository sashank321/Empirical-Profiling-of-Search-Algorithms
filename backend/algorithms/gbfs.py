"""Greedy Best-First Search (GBFS) Algorithm Implementation.

GBFS expands nodes based solely on a heuristic estimate h(n) of the cost
to the goal. It is often very fast but is neither complete nor optimal.

f(n) = h(n)

Complexity Analysis:
    Time:  O(b^m) worst case, much better with good heuristic
    Space: O(b^m) worst case

Optimality:
    - Not optimal. Can get stuck in local minima or take suboptimal paths.

Author: CORTEX AI Engine
"""

import heapq
from typing import Dict, List, Optional, Tuple
import time


def greedy_best_first_search(
    adjacency: Dict[str, Dict[str, float]],
    start: str,
    goal: str,
    heuristic: Dict[str, float],
) -> Dict:
    """Execute Greedy Best-First Search on a graph.

    Maintains a priority queue ordered strictly by heuristic value h(n).
    Ignores actual path cost accumulated so far.

    Args:
        adjacency: Adjacency list as {node: {neighbor: weight, ...}, ...}
        start: Starting node identifier
        goal: Target node identifier
        heuristic: Heuristic values as {node: estimated_cost, ...}

    Returns:
        Dictionary with algorithm name, path, visitedOrder, steps, and metrics
    """
    start_time = time.perf_counter()

    # Priority queue: (h_score, counter, node)
    counter = 0
    pq: List[Tuple[float, int, str]] = [(heuristic.get(start, 0), counter, start)]
    counter += 1

    # Keep track of paths (not optimal, just first found)
    came_from: Dict[str, Optional[str]] = {start: None}
    
    closed_set: set = set()
    visited_order: List[str] = []
    steps: List[Dict] = []
    nodes_expanded: int = 0
    peak_frontier: int = 1
    total_ops: int = 0
    step_num = 0

    while pq:
        peak_frontier = max(peak_frontier, len(pq))

        # Extract node with lowest h-score
        h_current, _, current = heapq.heappop(pq)
        total_ops += 1

        if current in closed_set:
            continue

        closed_set.add(current)
        visited_order.append(current)
        nodes_expanded += 1

        # Record visualization step
        frontier_state = [
            {'id': n, 'h': round(h, 2)}
            for h, _, n in sorted(pq) if n not in closed_set
        ]

        steps.append({
            'step': step_num,
            'node': current,
            'action': f'Expand "{current}" with h={round(h_current, 2)}',
            'reason': f'Lowest heuristic estimate h(n) in priority queue',
            'frontier': frontier_state,
            'visited': list(closed_set),
            'path': _reconstruct(came_from, current),
        })
        step_num += 1

        # Goal test
        if current == goal:
            break

        # Expand neighbors
        neighbors = adjacency.get(current, {})
        for neighbor in sorted(neighbors.keys()):
            total_ops += 1
            if neighbor in closed_set:
                continue

            # In strict GBFS, we don't care if we found a better path,
            # we just take the first path we find
            if neighbor not in came_from:
                came_from[neighbor] = current
                h_score = heuristic.get(neighbor, 0)
                heapq.heappush(pq, (h_score, counter, neighbor))
                counter += 1

    # Reconstruct path
    path = _reconstruct(came_from, goal) if goal in closed_set else []

    # Calculate actual path cost for reporting
    path_cost = 0.0
    for i in range(len(path) - 1):
        path_cost += adjacency.get(path[i], {}).get(path[i + 1], 0)

    non_leaf = max(1, sum(1 for n in visited_order if adjacency.get(n, {})))
    total_children = sum(len(adjacency.get(n, {})) for n in visited_order)
    branching_factor = total_children / non_leaf if non_leaf > 0 else 0

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    return {
        'algorithm': 'Greedy Best-First Search',
        'path': path,
        'visitedOrder': visited_order,
        'steps': steps,
        'metrics': {
            'executionMs': round(elapsed_ms, 4),
            'nodesExpanded': nodes_expanded,
            'peakFrontier': peak_frontier,
            'pathCost': path_cost,
            'branchingFactor': round(branching_factor, 2),
            'totalOps': total_ops,
            'timeComplexity': 'O(V²)',
            'spaceComplexity': 'O(V)',
        },
    }


def _reconstruct(came_from: Dict[str, Optional[str]], node: str) -> List[str]:
    """Reconstruct path from start to given node."""
    path = []
    current: Optional[str] = node
    while current is not None:
        path.append(current)
        current = came_from.get(current)
    return list(reversed(path))
