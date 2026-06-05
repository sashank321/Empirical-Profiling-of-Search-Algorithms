"""Uniform Cost Search (UCS) Algorithm Implementation.

UCS expands nodes in order of their cost from the start node, g(n).
It is equivalent to Dijkstra's algorithm running until the goal is found.
It is optimal for graphs with non-negative edge weights.

Complexity Analysis:
    Time:  O(V²) or O((V+E) log V) with priority queue
    Space: O(V) for the priority queue and visited set

Optimality:
    - Guaranteed optimal if all edge weights are >= 0

Author: CORTEX AI Engine
"""

import heapq
from typing import Dict, List, Optional, Tuple
import time


def uniform_cost_search(
    adjacency: Dict[str, Dict[str, float]],
    start: str,
    goal: str,
) -> Dict:
    """Execute Uniform Cost Search on a weighted graph.

    Maintains a priority queue of paths ordered by path cost (g).
    Expands the lowest-cost path first.

    Args:
        adjacency: Adjacency list as {node: {neighbor: weight, ...}, ...}
        start: Starting node identifier
        goal: Target node identifier

    Returns:
        Dictionary with algorithm name, path, visitedOrder, steps, and metrics
    """
    start_time = time.perf_counter()

    # Priority queue: (cost, counter, node)
    counter = 0
    pq: List[Tuple[float, int, str]] = [(0, counter, start)]
    counter += 1

    # Track best cost to each node
    dist: Dict[str, float] = {start: 0}
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

        # Extract lowest cost node
        current_cost, _, current = heapq.heappop(pq)
        total_ops += 1

        # We might have pushed a node multiple times with different costs
        # If we already finalized it, skip
        if current in closed_set:
            continue

        closed_set.add(current)
        visited_order.append(current)
        nodes_expanded += 1

        # Record visualization step
        frontier_state = [
            {'id': n, 'g': round(c, 2)}
            for c, _, n in sorted(pq) if n not in closed_set
        ]

        steps.append({
            'step': step_num,
            'node': current,
            'action': f'Expand "{current}" with cost g={round(current_cost, 2)}',
            'reason': f'Lowest accumulated cost g(n) in priority queue',
            'frontier': frontier_state,
            'visited': list(closed_set),
            'path': _reconstruct(came_from, current),
        })
        step_num += 1

        # Goal test after extraction
        if current == goal:
            break

        # Expand neighbors
        neighbors = adjacency.get(current, {})
        for neighbor, weight in sorted(neighbors.items()):
            total_ops += 1
            if neighbor in closed_set:
                continue

            new_cost = current_cost + weight

            # If better path found, push to queue and update tracking
            if new_cost < dist.get(neighbor, float('inf')):
                dist[neighbor] = new_cost
                came_from[neighbor] = current
                heapq.heappush(pq, (new_cost, counter, neighbor))
                counter += 1

    # Reconstruct optimal path
    path = _reconstruct(came_from, goal) if goal in closed_set else []
    path_cost = dist.get(goal, 0) if goal in closed_set else 0

    non_leaf = max(1, sum(1 for n in visited_order if adjacency.get(n, {})))
    total_children = sum(len(adjacency.get(n, {})) for n in visited_order)
    branching_factor = total_children / non_leaf if non_leaf > 0 else 0

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    return {
        'algorithm': 'Uniform Cost Search',
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
    """Reconstruct optimal path from start to given node."""
    path = []
    current: Optional[str] = node
    while current is not None:
        path.append(current)
        current = came_from.get(current)
    return list(reversed(path))
