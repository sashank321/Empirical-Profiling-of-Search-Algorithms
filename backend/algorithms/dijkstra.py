"""Dijkstra's Shortest Path Algorithm Implementation.

Unlike UCS which stops at the goal, Dijkstra's algorithm computes
shortest paths from the source to ALL reachable nodes, building
a complete shortest-path tree (routing table).

This is the backbone of internet routing protocols (OSPF, IS-IS).

Complexity Analysis:
    Time:  O(V²) with linear scan, O((V+E) log V) with binary heap
    Space: O(V) for distance table and predecessor map

Use Cases:
    - Internet routing (OSPF protocol)
    - Network distance computation
    - Road network shortest paths
    - Social network proximity analysis

Author: CORTEX AI Engine
"""

import heapq
from typing import Dict, List, Optional, Tuple
import time


def dijkstra_search(
    adjacency: Dict[str, Dict[str, float]],
    start: str,
    goal: str,
) -> Dict:
    """Execute Dijkstra's algorithm for single-source shortest paths.

    Computes shortest distances from start to all reachable nodes,
    building a routing table. Returns the specific path to goal.

    Args:
        adjacency: Adjacency list as {node: {neighbor: weight, ...}, ...}
        start: Starting node identifier
        goal: Target node identifier

    Returns:
        Dictionary with path, routing table snapshot, and metrics
    """
    start_time = time.perf_counter()

    counter = 0
    pq: List[Tuple[float, int, str]] = [(0, counter, start)]
    counter += 1

    dist: Dict[str, float] = {start: 0}
    came_from: Dict[str, Optional[str]] = {start: None}
    visited: set = set()
    visited_order: List[str] = []
    steps: List[Dict] = []
    nodes_expanded: int = 0
    peak_frontier: int = 1
    total_ops: int = 0
    step_num = 0

    while pq:
        peak_frontier = max(peak_frontier, len(pq))
        d, _, current = heapq.heappop(pq)
        total_ops += 1

        if current in visited:
            continue

        visited.add(current)
        visited_order.append(current)
        nodes_expanded += 1

        frontier_state = [
            {'id': n, 'g': round(dist.get(n, float('inf')), 2)}
            for _, _, n in sorted(pq) if n not in visited
        ]

        steps.append({
            'step': step_num,
            'node': current,
            'action': f'Finalize "{current}" with distance {round(d, 2)}',
            'reason': f'Shortest unfinalized distance in priority queue',
            'frontier': frontier_state,
            'visited': list(visited),
            'path': _reconstruct(came_from, current),
        })
        step_num += 1

        # Dijkstra continues past goal to compute all distances
        # but we can stop early for visualization if goal is reached
        if current == goal:
            break

        neighbors = adjacency.get(current, {})
        for neighbor, weight in sorted(neighbors.items()):
            total_ops += 1
            if neighbor in visited:
                continue

            new_dist = d + weight
            if new_dist < dist.get(neighbor, float('inf')):
                dist[neighbor] = new_dist
                came_from[neighbor] = current
                heapq.heappush(pq, (new_dist, counter, neighbor))
                counter += 1

    path = _reconstruct(came_from, goal) if goal in visited else []
    path_cost = dist.get(goal, 0) if goal in visited else 0

    non_leaf = max(1, sum(1 for n in visited_order if adjacency.get(n, {})))
    total_children = sum(len(adjacency.get(n, {})) for n in visited_order)
    branching_factor = total_children / non_leaf if non_leaf > 0 else 0

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    return {
        'algorithm': "Dijkstra's Algorithm",
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
