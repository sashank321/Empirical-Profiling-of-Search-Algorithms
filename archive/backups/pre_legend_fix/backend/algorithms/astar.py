"""A* Search Algorithm Implementation.

A* combines the cost-so-far g(n) with a heuristic estimate h(n) to
find the optimal path efficiently. It is both complete and optimal
when the heuristic is admissible (never overestimates).

f(n) = g(n) + h(n)
    - g(n): Actual cost from start to node n
    - h(n): Estimated cost from node n to goal
    - f(n): Estimated total cost through node n

Complexity Analysis:
    Time:  O(b^d) in the worst case, but typically much better
    Space: O(b^d) for the open and closed sets

Optimality:
    - Optimal when h(n) is admissible (h(n) <= h*(n) for all n)
    - Optimal and efficient when h(n) is consistent (monotone)

Use Cases:
    - GPS/map navigation (shortest route)
    - Robot path planning
    - Game AI pathfinding
    - Puzzle solving (8-puzzle, 15-puzzle)

Author: CORTEX AI Engine
"""

import heapq
from typing import Dict, List, Optional, Tuple
import time


def a_star_search(
    adjacency: Dict[str, Dict[str, float]],
    start: str,
    goal: str,
    heuristic: Dict[str, float],
) -> Dict:
    """Execute A* Search on a weighted graph.

    A* maintains an open set (priority queue) ordered by f(n) = g(n) + h(n).
    It expands the node with lowest f-value, guaranteeing optimal paths
    when the heuristic is admissible.

    Args:
        adjacency: Adjacency list as {node: {neighbor: weight, ...}, ...}
        start: Starting node identifier
        goal: Target node identifier
        heuristic: Heuristic values as {node: estimated_cost_to_goal, ...}

    Returns:
        Dictionary with algorithm name, path, visitedOrder, steps, and metrics
    """
    start_time = time.perf_counter()

    # Priority queue: (f_score, counter, node)
    # Counter breaks ties deterministically
    counter = 0
    open_set: List[Tuple[float, int, str]] = [(heuristic.get(start, 0), counter, start)]
    counter += 1

    # Cost tracking
    g_score: Dict[str, float] = {start: 0}
    came_from: Dict[str, Optional[str]] = {start: None}

    # Visited tracking
    closed_set: set = set()
    visited_order: List[str] = []
    steps: List[Dict] = []
    nodes_expanded: int = 0
    peak_frontier: int = 1
    total_ops: int = 0
    step_num = 0

    while open_set:
        peak_frontier = max(peak_frontier, len(open_set))

        # Extract node with lowest f-score
        f_current, _, current = heapq.heappop(open_set)
        total_ops += 1

        if current in closed_set:
            continue

        closed_set.add(current)
        visited_order.append(current)
        nodes_expanded += 1

        g_current = g_score[current]
        h_current = heuristic.get(current, 0)

        # Build frontier state for visualization
        frontier_state = [
            {
                'id': n,
                'f': round(f, 2),
                'g': round(g_score.get(n, 0), 2),
                'h': round(heuristic.get(n, 0), 2),
            }
            for f, _, n in sorted(open_set) if n not in closed_set
        ]

        steps.append({
            'step': step_num,
            'node': current,
            'action': f'Expand "{current}" with f={round(f_current, 2)} (g={round(g_current, 2)}, h={round(h_current, 2)})',
            'reason': f'Lowest f(n) = g(n) + h(n) = {round(g_current, 2)} + {round(h_current, 2)} = {round(f_current, 2)}',
            'frontier': frontier_state,
            'visited': list(closed_set),
            'path': _reconstruct(came_from, current),
        })
        step_num += 1

        # Goal test (after expansion, not when generated)
        if current == goal:
            break

        # Expand neighbors
        neighbors = adjacency.get(current, {})
        for neighbor, weight in sorted(neighbors.items()):
            total_ops += 1
            if neighbor in closed_set:
                continue

            tentative_g = g_current + weight

            # Only update if this path is better
            if tentative_g < g_score.get(neighbor, float('inf')):
                g_score[neighbor] = tentative_g
                came_from[neighbor] = current
                f_score = tentative_g + heuristic.get(neighbor, 0)
                heapq.heappush(open_set, (f_score, counter, neighbor))
                counter += 1

    # Reconstruct optimal path
    path = _reconstruct(came_from, goal) if goal in closed_set else []

    # Calculate path cost from g_score
    path_cost = g_score.get(goal, 0) if goal in closed_set else 0

    # Branching factor
    non_leaf = max(1, sum(1 for n in visited_order if adjacency.get(n, {})))
    total_children = sum(len(adjacency.get(n, {})) for n in visited_order)
    branching_factor = total_children / non_leaf if non_leaf > 0 else 0

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    return {
        'algorithm': 'A* Search',
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
