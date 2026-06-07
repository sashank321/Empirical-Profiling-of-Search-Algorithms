"""Heuristic functions for informed search algorithms.

Provides distance estimation functions used by A*, GBFS, and IDA*
to guide search towards the goal node. Includes admissibility and
consistency verification utilities.

Author: CORTEX AI Engine
"""

import math
from typing import Dict, List, Optional, Tuple


def euclidean_distance(
    pos1: Tuple[float, float],
    pos2: Tuple[float, float],
) -> float:
    """Calculate Euclidean (straight-line) distance between two points.

    This is the most common admissible heuristic for geometric problems.
    It is admissible because the straight-line distance never overestimates
    the actual shortest path length in Euclidean space.

    Args:
        pos1: (x, y) coordinates of first point
        pos2: (x, y) coordinates of second point

    Returns:
        Euclidean distance between the two points
    """
    dx = pos1[0] - pos2[0]
    dy = pos1[1] - pos2[1]
    return math.sqrt(dx * dx + dy * dy)


def manhattan_distance(
    pos1: Tuple[float, float],
    pos2: Tuple[float, float],
) -> float:
    """Calculate Manhattan (L1 / taxicab) distance between two points.

    Sum of absolute differences in x and y coordinates. Admissible
    for grid-based movement where only horizontal/vertical moves
    are allowed (no diagonal movement).

    Args:
        pos1: (x, y) coordinates of first point
        pos2: (x, y) coordinates of second point

    Returns:
        Manhattan distance between the two points
    """
    return abs(pos1[0] - pos2[0]) + abs(pos1[1] - pos2[1])


def chebyshev_distance(
    pos1: Tuple[float, float],
    pos2: Tuple[float, float],
) -> float:
    """Calculate Chebyshev (L∞) distance between two points.

    Maximum of absolute differences. Admissible for grid movement
    that allows diagonal moves at the same cost as cardinal moves
    (like a King in chess).

    Args:
        pos1: (x, y) coordinates of first point
        pos2: (x, y) coordinates of second point

    Returns:
        Chebyshev distance between the two points
    """
    return max(abs(pos1[0] - pos2[0]), abs(pos1[1] - pos2[1]))


def octile_distance(
    pos1: Tuple[float, float],
    pos2: Tuple[float, float],
) -> float:
    """Calculate Octile distance for grid with diagonal movement.

    Assumes cardinal moves cost 1 and diagonal moves cost sqrt(2).
    This is the optimal distance function for 8-directional grid movement.

    Args:
        pos1: (x, y) coordinates of first point
        pos2: (x, y) coordinates of second point

    Returns:
        Octile distance between the two points
    """
    dx = abs(pos1[0] - pos2[0])
    dy = abs(pos1[1] - pos2[1])
    return max(dx, dy) + (math.sqrt(2) - 1) * min(dx, dy)


def compute_true_shortest_paths(
    adjacency: Dict[str, Dict[str, float]],
    goal: str,
) -> Dict[str, float]:
    """Compute true shortest path distances from all nodes to goal.

    Uses Dijkstra's algorithm in reverse (from goal) to compute
    the actual shortest path cost from each node. This is used
    as the ground truth for admissibility checking.

    Args:
        adjacency: Graph adjacency list
        goal: Target node

    Returns:
        Dictionary of true shortest distances {node: distance}
    """
    import heapq

    # Run Dijkstra from goal (on reversed graph for directed graphs)
    dist: Dict[str, float] = {goal: 0}
    pq: List[Tuple[float, str]] = [(0, goal)]
    visited: set = set()

    while pq:
        d, u = heapq.heappop(pq)
        if u in visited:
            continue
        visited.add(u)

        for v, w in adjacency.get(u, {}).items():
            new_d = d + w
            if new_d < dist.get(v, float('inf')):
                dist[v] = new_d
                heapq.heappush(pq, (new_d, v))

    return dist


def is_admissible(
    heuristic: Dict[str, float],
    true_costs: Dict[str, float],
    tolerance: float = 1e-6,
) -> Dict:
    """Check if a heuristic is admissible (never overestimates).

    A heuristic h(n) is admissible if h(n) <= h*(n) for all nodes n,
    where h*(n) is the true shortest path cost from n to the goal.

    Args:
        heuristic: Heuristic values {node: h(n)}
        true_costs: True shortest distances {node: h*(n)}
        tolerance: Numerical tolerance for floating point comparison

    Returns:
        Dictionary with:
            - is_admissible: Boolean
            - violations: List of nodes where h(n) > h*(n)
            - max_overestimate: Maximum overestimate amount
    """
    violations = []
    max_overestimate = 0.0

    for node, h_val in heuristic.items():
        true_cost = true_costs.get(node, float('inf'))
        if h_val > true_cost + tolerance:
            violations.append({
                'node': node,
                'h': h_val,
                'true_cost': true_cost,
                'overestimate': h_val - true_cost,
            })
            max_overestimate = max(max_overestimate, h_val - true_cost)

    return {
        'is_admissible': len(violations) == 0,
        'violations': violations,
        'max_overestimate': round(max_overestimate, 4),
        'nodes_checked': len(heuristic),
    }


def is_consistent(
    heuristic: Dict[str, float],
    adjacency: Dict[str, Dict[str, float]],
    tolerance: float = 1e-6,
) -> Dict:
    """Check if a heuristic is consistent (monotone).

    A heuristic is consistent if for every edge (u, v) with cost c:
        h(u) <= c(u, v) + h(v)

    Consistency implies admissibility, and A* with a consistent heuristic
    never re-expands nodes, ensuring optimal efficiency.

    Args:
        heuristic: Heuristic values {node: h(n)}
        adjacency: Graph adjacency list
        tolerance: Numerical tolerance

    Returns:
        Dictionary with consistency check results
    """
    violations = []

    for u, neighbors in adjacency.items():
        h_u = heuristic.get(u, 0)
        for v, cost in neighbors.items():
            h_v = heuristic.get(v, 0)
            if h_u > cost + h_v + tolerance:
                violations.append({
                    'from': u,
                    'to': v,
                    'h_from': h_u,
                    'h_to': h_v,
                    'edge_cost': cost,
                    'violation': h_u - cost - h_v,
                })

    return {
        'is_consistent': len(violations) == 0,
        'violations': violations,
        'edges_checked': sum(len(n) for n in adjacency.values()),
    }
