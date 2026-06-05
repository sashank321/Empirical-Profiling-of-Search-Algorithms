"""Depth-First Search (DFS) Algorithm Implementation.

DFS explores as deep as possible along each branch before backtracking.
It uses a LIFO stack (or recursion) and is memory-efficient for deep graphs.

Complexity Analysis:
    Time:  O(V + E) where V = vertices, E = edges
    Space: O(bm) where b = branching factor, m = maximum depth

Use Cases:
    - File system traversal (exploring directory trees)
    - Topological sorting
    - Cycle detection in graphs
    - Maze solving
    - Strongly connected components (Tarjan/Kosaraju)

Limitations:
    - Not complete in infinite graphs
    - Not optimal (may find a longer path before the shortest)
    - Can get trapped in deep branches

Author: CORTEX AI Engine
"""

from typing import Dict, List, Optional
import time


def depth_first_search(
    adjacency: Dict[str, Dict[str, float]],
    start: str,
    goal: str,
) -> Dict:
    """Execute Depth-First Search on a graph using an explicit stack.

    DFS explores the deepest unexplored node first, backtracking when
    a dead end is reached. This implementation uses an iterative approach
    with an explicit stack rather than recursion to avoid stack overflow
    on deep graphs.

    Args:
        adjacency: Adjacency list as {node: {neighbor: weight, ...}, ...}
        start: Starting node identifier
        goal: Target node identifier

    Returns:
        Dictionary with algorithm name, path, visitedOrder, steps, and metrics
    """
    start_time = time.perf_counter()

    # Data structures
    stack: List[str] = [start]
    visited: set = set()
    came_from: Dict[str, Optional[str]] = {start: None}
    visited_order: List[str] = []
    steps: List[Dict] = []
    nodes_expanded: int = 0
    peak_frontier: int = 1
    total_ops: int = 0
    step_num = 0

    while stack:
        peak_frontier = max(peak_frontier, len(stack))

        # Pop from top of stack (LIFO — deepest node first)
        current = stack.pop()
        total_ops += 1

        if current in visited:
            continue

        visited.add(current)
        visited_order.append(current)
        nodes_expanded += 1

        # Record visualization step
        frontier_state = [{'id': n} for n in reversed(stack)]
        steps.append({
            'step': step_num,
            'node': current,
            'action': f'Pop "{current}" from stack (depth-first)',
            'reason': f'Deepest unexplored node on the stack',
            'frontier': frontier_state,
            'visited': list(visited),
            'path': _reconstruct(came_from, current),
        })
        step_num += 1

        # Goal test
        if current == goal:
            break

        # Push neighbors in reverse-sorted order so that alphabetically
        # first neighbor gets popped first (deterministic exploration)
        neighbors = adjacency.get(current, {})
        for neighbor in sorted(neighbors.keys(), reverse=True):
            total_ops += 1
            if neighbor not in visited:
                if neighbor not in came_from:
                    came_from[neighbor] = current
                stack.append(neighbor)

    # Reconstruct path
    path = _reconstruct(came_from, goal) if goal in visited else []

    # Calculate path cost
    path_cost = 0.0
    for i in range(len(path) - 1):
        path_cost += adjacency.get(path[i], {}).get(path[i + 1], 0)

    # Branching factor
    non_leaf = max(1, sum(1 for n in visited_order if adjacency.get(n, {})))
    total_children = sum(len(adjacency.get(n, {})) for n in visited_order)
    branching_factor = total_children / non_leaf if non_leaf > 0 else 0

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    return {
        'algorithm': 'Depth-First Search',
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
            'timeComplexity': 'O(V+E)',
            'spaceComplexity': 'O(bm)',
        },
    }


def _reconstruct(came_from: Dict[str, Optional[str]], node: str) -> List[str]:
    """Reconstruct path from start to given node using parent pointers."""
    path = []
    current: Optional[str] = node
    while current is not None:
        path.append(current)
        current = came_from.get(current)
    return list(reversed(path))
