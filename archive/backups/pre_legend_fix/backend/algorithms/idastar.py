"""IDA* (Iterative Deepening A*) Algorithm Implementation.

IDA* combines the space efficiency of IDDFS with the informed
heuristic search of A*. It uses f-cost (g + h) as the threshold
for iterative deepening instead of depth.

Complexity Analysis:
    Time:  O(b^d) worst case
    Space: O(d) where d is maximum search depth

Optimality:
    - Optimal if the heuristic is admissible.
    - Memory bounded, making it suitable for very large state spaces (e.g., 15-puzzle).

Author: CORTEX AI Engine
"""

from typing import Dict, List, Optional, Tuple
import time


def ida_star_search(
    adjacency: Dict[str, Dict[str, float]],
    start: str,
    goal: str,
    heuristic: Dict[str, float],
) -> Dict:
    """Execute IDA* Search.

    Uses an f-cost threshold that increases in each iteration.
    Within each iteration, performs a depth-first search that prunes
    paths exceeding the current threshold.

    Args:
        adjacency: Adjacency list as {node: {neighbor: weight, ...}, ...}
        start: Starting node identifier
        goal: Target node identifier
        heuristic: Heuristic values as {node: estimated_cost, ...}

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
    
    # Initial threshold is the heuristic estimate of the start node
    threshold = heuristic.get(start, 0)
    
    # To prevent infinite loops if goal is unreachable
    MAX_ITERATIONS = 1000 
    iterations = 0

    while not found and iterations < MAX_ITERATIONS:
        iterations += 1
        
        # State for this iteration (Stack items: (node, path, g_cost))
        stack: List[Tuple[str, List[str], float]] = [(start, [start], 0.0)]
        next_threshold = float('inf')
        
        visited: set = set()
        iteration_visited = []
        
        steps.append({
            'step': step_num,
            'node': start,
            'action': f'Start new iteration with f-limit = {round(threshold, 2)}',
            'reason': f'Iterative deepening f-cost limit increase',
            'frontier': [{'id': start, 'f': round(heuristic.get(start, 0), 2)}],
            'visited': [],
            'path': [],
        })
        step_num += 1

        while stack:
            peak_frontier = max(peak_frontier, len(stack))
            
            current, current_path, current_g = stack.pop()
            total_ops += 1
            
            f_cost = current_g + heuristic.get(current, 0)
            
            # Threshold pruning
            if f_cost > threshold:
                next_threshold = min(next_threshold, f_cost)
                steps.append({
                    'step': step_num,
                    'node': current,
                    'action': f'Prune "{current}" (f={round(f_cost, 2)} > limit {round(threshold, 2)})',
                    'reason': f'f-cost exceeded current threshold',
                    'frontier': [{'id': n} for n, _, _ in reversed(stack)],
                    'visited': list(visited),
                    'path': current_path,
                })
                step_num += 1
                continue
                
            iteration_visited.append(current)
            nodes_expanded += 1
            visited.add(current)
            
            frontier_state = [{'id': n} for n, _, _ in reversed(stack)]
            steps.append({
                'step': step_num,
                'node': current,
                'action': f'Expand "{current}" (f={round(f_cost, 2)} <= {round(threshold, 2)})',
                'reason': f'Valid f-cost within threshold',
                'frontier': frontier_state,
                'visited': list(visited),
                'path': current_path,
            })
            step_num += 1

            if current == goal:
                path = current_path
                found = True
                break
                
            neighbors = adjacency.get(current, {})
            # Sort reversed for stable deterministic DFS
            for neighbor, weight in sorted(neighbors.items(), reverse=True):
                total_ops += 1
                if neighbor not in current_path: # Prevent simple cycles
                    stack.append((neighbor, current_path + [neighbor], current_g + weight))
                        
        visited_order.extend(iteration_visited)
        
        if found:
            break
            
        if next_threshold == float('inf'):
            break # Goal unreachable
            
        threshold = next_threshold

    path_cost = 0.0
    for i in range(len(path) - 1):
        path_cost += adjacency.get(path[i], {}).get(path[i + 1], 0)

    non_leaf = max(1, sum(1 for n in set(visited_order) if adjacency.get(n, {})))
    total_children = sum(len(adjacency.get(n, {})) for n in set(visited_order))
    branching_factor = total_children / non_leaf if non_leaf > 0 else 0

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    return {
        'algorithm': 'IDA* Search',
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
