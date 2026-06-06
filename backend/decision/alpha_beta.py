"""Alpha-Beta Pruning Implementation for Minimax.

Alpha-Beta pruning is an optimization technique for the minimax algorithm
that reduces the number of nodes evaluated in the search tree without
changing the final decision.

It maintains two values, alpha and beta, which represent the minimum score
that the maximizing player is assured of and the maximum score that the
minimizing player is assured of, respectively.

Complexity Analysis:
    Time:  O(b^(m/2)) best case (perfect ordering), O(b^m) worst case
    Space: O(bm) where b is branching factor and m is maximum depth

Author: CORTEX AI Engine
"""

from typing import Any, Callable, Dict, List, Optional, Tuple
import time


def alphabeta_search(
    state: Any,
    depth: int,
    alpha: float,
    beta: float,
    is_maximizing: bool,
    get_moves: Callable[[Any], List[Any]],
    apply_move: Callable[[Any, Any], Any],
    evaluate: Callable[[Any], float],
    is_terminal: Callable[[Any], bool],
) -> Tuple[float, Optional[Any], Dict]:
    """Execute Minimax with Alpha-Beta Pruning.

    Args:
        state: Current game state
        depth: Remaining depth to search
        alpha: Best already explored option along path to root for maximizer
        beta: Best already explored option along path to root for minimizer
        is_maximizing: True if it is the maximizing player's turn
        get_moves: Function returning list of valid moves for a state
        apply_move: Function returning new state after applying a move
        evaluate: Heuristic evaluation function for a state
        is_terminal: Function checking if state is an end-game state

    Returns:
        Tuple of (best_score, best_move, metrics_dict)
    """
    start_time = time.perf_counter()
    nodes_evaluated = 0
    nodes_pruned = 0
    max_depth_reached = 0

    def recursive_search(
        current_state: Any,
        current_depth: int,
        current_alpha: float,
        current_beta: float,
        maximizing: bool,
        current_level: int,
    ) -> Tuple[float, Optional[Any]]:
        nonlocal nodes_evaluated, nodes_pruned, max_depth_reached
        max_depth_reached = max(max_depth_reached, current_level)
        nodes_evaluated += 1

        if current_depth == 0 or is_terminal(current_state):
            return evaluate(current_state), None

        moves = get_moves(current_state)
        if not moves:
            return evaluate(current_state), None

        best_move = None

        if maximizing:
            max_eval = float('-inf')
            for move in moves:
                child_state = apply_move(current_state, move)
                eval_score, _ = recursive_search(
                    child_state, current_depth - 1, current_alpha, current_beta, False, current_level + 1
                )

                if eval_score > max_eval:
                    max_eval = eval_score
                    best_move = move

                current_alpha = max(current_alpha, eval_score)
                if current_beta <= current_alpha:
                    # Beta cut-off: Minimizing player had a better (lower) option earlier
                    # so they will never choose this branch. Prune remaining moves.
                    nodes_pruned += len(moves) - (moves.index(move) + 1)
                    break
            return max_eval, best_move

        else: # Minimizing
            min_eval = float('inf')
            for move in moves:
                child_state = apply_move(current_state, move)
                eval_score, _ = recursive_search(
                    child_state, current_depth - 1, current_alpha, current_beta, True, current_level + 1
                )

                if eval_score < min_eval:
                    min_eval = eval_score
                    best_move = move

                current_beta = min(current_beta, eval_score)
                if current_beta <= current_alpha:
                    # Alpha cut-off: Maximizing player had a better (higher) option earlier
                    # so they will never choose this branch. Prune remaining moves.
                    nodes_pruned += len(moves) - (moves.index(move) + 1)
                    break
            return min_eval, best_move

    best_score, best_move = recursive_search(state, depth, alpha, beta, is_maximizing, 0)
    
    elapsed_ms = (time.perf_counter() - start_time) * 1000

    metrics = {
        'nodes_evaluated': nodes_evaluated,
        'nodes_pruned': nodes_pruned,
        'max_depth_reached': max_depth_reached,
        'execution_ms': round(elapsed_ms, 4),
        'algorithm': 'Alpha-Beta Pruning',
    }

    return best_score, best_move, metrics
