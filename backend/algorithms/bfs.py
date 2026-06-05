"""Breadth-First Search (BFS) Algorithm Implementation.

BFS explores nodes level-by-level using a FIFO queue. It guarantees finding
the shortest path (in terms of number of edges) in unweighted graphs.

Complexity Analysis:
    Time:  O(V + E) where V = vertices, E = edges
    Space: O(V) for the visited set and queue

Use Cases:
    - Network broadcasting (reaching all nodes at minimum hops)
    - Social network friend-of-friend discovery
    - Web crawling (breadth-first page exploration)
    - Finding shortest path in unweighted graphs

Author: CORTEX AI Engine
"""

from collections import deque
from typing import Dict, List, Optional, Tuple
import time


def build_step(
    step_num: int,
    node: str,
    action: str,
    reason: str,
    frontier: List[Dict],
    visited: List[str],
    path: List[str],
) -> Dict:
    """Construct a visualization step record.

    Args:
        step_num: Sequential step number
        node: Current node being processed
        action: Description of the action taken
        reason: Why this node was selected
        frontier: Current state of the exploration frontier
        visited: List of all visited nodes
        path: Current partial path

    Returns:
        Dictionary containing all step data for frontend visualization
    """
    return {
        'step': step_num,
        'node': node,
        'action': action,
        'reason': reason,
        'frontier': frontier,
        'visited': list(visited),
        'path': list(path),
    }


def breadth_first_search(
    adjacency: Dict[str, Dict[str, float]],
    start: str,
    goal: str,
) -> Dict:
    """Execute Breadth-First Search on a weighted/unweighted graph.

    BFS uses a FIFO queue to explore nodes level-by-level, ensuring
    that the first path found to any node is the shortest (by hop count).
    Edge weights are ignored for exploration order but tracked for path cost.

    Args:
        adjacency: Adjacency list as {node: {neighbor: weight, ...}, ...}
        start: Starting node identifier
        goal: Target node identifier

    Returns:
        Dictionary containing:
            - algorithm: Algorithm name
            - path: List of nodes in the solution path
            - visitedOrder: Order in which nodes were visited
            - steps: List of step records for visualization
            - metrics: Performance metrics dict
    """
    start_time = time.perf_counter()

    # Data structures
    queue: deque = deque([start])
    visited: set = {start}
    came_from: Dict[str, Optional[str]] = {start: None}
    visited_order: List[str] = []
    steps: List[Dict] = []
    nodes_expanded: int = 0
    peak_frontier: int = 1
    total_ops: int = 0

    step_num = 0

    while queue:
        # Track peak frontier size
        peak_frontier = max(peak_frontier, len(queue))

        # Dequeue the front node (FIFO)
        current = queue.popleft()
        visited_order.append(current)
        nodes_expanded += 1
        total_ops += 1

        # Record the exploration step
        frontier_state = [{'id': n} for n in queue]
        steps.append(build_step(
            step_num=step_num,
            node=current,
            action=f'Dequeue "{current}" from FIFO queue',
            reason=f'First node in queue (level-order exploration)',
            frontier=frontier_state,
            visited=list(visited),
            path=_reconstruct(came_from, current),
        ))
        step_num += 1

        # Goal test
        if current == goal:
            break

        # Expand neighbors in sorted order for deterministic behavior
        neighbors = adjacency.get(current, {})
        for neighbor in sorted(neighbors.keys()):
            total_ops += 1
            if neighbor not in visited:
                visited.add(neighbor)
                came_from[neighbor] = current
                queue.append(neighbor)

    # Reconstruct path
    path = _reconstruct(came_from, goal) if goal in came_from else []

    # Calculate path cost
    path_cost = 0.0
    for i in range(len(path) - 1):
        path_cost += adjacency.get(path[i], {}).get(path[i + 1], 0)

    # Calculate branching factor
    non_leaf = max(1, sum(1 for n in visited_order if adjacency.get(n, {})))
    total_children = sum(len(adjacency.get(n, {})) for n in visited_order)
    branching_factor = total_children / non_leaf if non_leaf > 0 else 0

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    return {
        'algorithm': 'Breadth-First Search',
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
            'spaceComplexity': 'O(V)',
        },
    }


def _reconstruct(came_from: Dict[str, Optional[str]], node: str) -> List[str]:
    """Reconstruct path from start to given node using parent pointers.

    Args:
        came_from: Dictionary mapping each node to its parent
        node: Target node to trace back from

    Returns:
        Ordered list of nodes from start to target
    """
    path = []
    current: Optional[str] = node
    while current is not None:
        path.append(current)
        current = came_from.get(current)
    return list(reversed(path))
