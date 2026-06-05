"""Iterative Deepening DFS (IDDFS) Algorithm Implementation.

IDDFS repeatedly performs depth-limited DFS, incrementing the depth
limit in each iteration. It combines the space efficiency of DFS
with the completeness and optimality (for unweighted graphs) of BFS.

Complexity Analysis:
    Time:  O(b^d) where b is branching factor and d is depth of goal
    Space: O(d) for the recursion stack

Optimality:
    - Guaranteed optimal in terms of number of edges (like BFS).

Author: CORTEX AI Engine
"""

from typing import Dict, List, Optional, Set
import time


def iterative_deepening_dfs(
    adjacency: Dict[str, Dict[str, float]],
    start: str,
    goal: str,
) -> Dict:
    """Execute Iterative Deepening DFS.

    Runs depth-limited DFS starting from depth limit 0 and incrementing
    until the goal is found or the graph is fully explored.

    Args:
        adjacency: Adjacency list as {node: {neighbor: weight, ...}, ...}
        start: Starting node identifier
        goal: Target node identifier

    Returns:
        Dictionary with algorithm name, path, visitedOrder, steps, and metrics
    """
    start_time = time.perf_counter()

    visited_order: List[str] = []
    steps: List[Dict] = []
    nodes_expanded = 0
    total_ops = 0
    step_num = 0
    peak_frontier = 0
    
    path = []
    found = False
    
    # We need to know when to stop if goal is unreachable
    max_possible_depth = len(adjacency)

    for depth_limit in range(max_possible_depth + 1):
        # State for this iteration
        stack: List[str] = [start]
        # Store (node, path_to_node) to reconstruct without globals
        path_stack: List[List[str]] = [[start]]
        
        # Track visited purely to prevent cycles within the SAME path
        # IDDFS can visit the same node across different branches
        visited: Set[str] = set()
        iteration_visited_order = []
        
        steps.append({
            'step': step_num,
            'node': start,
            'action': f'Start new iteration with depth limit = {depth_limit}',
            'reason': f'Iterative deepening limit increase',
            'frontier': [{'id': start}],
            'visited': [],
            'path': [],
        })
        step_num += 1

        while stack:
            peak_frontier = max(peak_frontier, len(stack))
            
            current = stack.pop()
            current_path = path_stack.pop()
            current_depth = len(current_path) - 1
            
            total_ops += 1
            
            # This is simplified: true IDDFS handles cycles carefully
            # but for visualization, we just track the current branch
            
            iteration_visited_order.append(current)
            nodes_expanded += 1
            visited.add(current)
            
            frontier_state = [{'id': n} for n in reversed(stack)]
            steps.append({
                'step': step_num,
                'node': current,
                'action': f'Pop "{current}" (depth {current_depth}/{depth_limit})',
                'reason': f'Deepest node on stack',
                'frontier': frontier_state,
                'visited': list(visited),
                'path': current_path,
            })
            step_num += 1

            if current == goal:
                path = current_path
                found = True
                break
                
            if current_depth < depth_limit:
                neighbors = adjacency.get(current, {})
                for neighbor in sorted(neighbors.keys(), reverse=True):
                    total_ops += 1
                    if neighbor not in current_path: # Prevent simple cycles
                        stack.append(neighbor)
                        path_stack.append(current_path + [neighbor])
                        
        visited_order.extend(iteration_visited_order)
        if found:
            break

    # Calculate path cost
    path_cost = 0.0
    for i in range(len(path) - 1):
        path_cost += adjacency.get(path[i], {}).get(path[i + 1], 0)

    # Branching factor estimate
    non_leaf = max(1, sum(1 for n in set(visited_order) if adjacency.get(n, {})))
    total_children = sum(len(adjacency.get(n, {})) for n in set(visited_order))
    branching_factor = total_children / non_leaf if non_leaf > 0 else 0

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    return {
        'algorithm': 'Iterative Deepening DFS',
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
            'timeComplexity': 'O(b^d)',
            'spaceComplexity': 'O(d)',
        },
    }
