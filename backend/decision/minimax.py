import time
import math

def build_decision_step(step_idx, node, depth, alpha, beta, action, value, reason):
    return {
        "step": step_idx,
        "node": node,
        "depth": depth,
        "alpha": alpha,
        "beta": beta,
        "action": action,
        "value": value,
        "reason": reason
    }

def solve_minimax(tree, root, max_depth, use_alpha_beta=False):
    start_time = time.time()
    steps = []
    step_idx = [1]
    metrics = {"nodesExplored": 0, "prunedBranches": 0, "executionMs": 0}

    def evaluate(node, depth, is_maximizing, alpha=-math.inf, beta=math.inf):
        metrics["nodesExplored"] += 1
        
        # Leaf node check
        if depth == max_depth or not tree.get(node):
            val = tree.get(node, {}).get("value", 0)
            steps.append(build_decision_step(step_idx[0], node, depth, alpha, beta, "evaluate", val, "Leaf node reached"))
            step_idx[0] += 1
            return val

        if is_maximizing:
            max_eval = -math.inf
            steps.append(build_decision_step(step_idx[0], node, depth, alpha, beta, "expand_max", max_eval, "Maximizing player turn"))
            step_idx[0] += 1
            
            for child in tree[node].get("children", []):
                eval_val = evaluate(child, depth + 1, False, alpha, beta)
                max_eval = max(max_eval, eval_val)
                steps.append(build_decision_step(step_idx[0], node, depth, alpha, beta, "update_max", max_eval, f"Child {child} returned {eval_val}"))
                step_idx[0] += 1
                
                if use_alpha_beta:
                    alpha = max(alpha, eval_val)
                    if beta <= alpha:
                        metrics["prunedBranches"] += 1
                        steps.append(build_decision_step(step_idx[0], node, depth, alpha, beta, "prune", max_eval, f"Beta cutoff ({beta} <= {alpha})"))
                        step_idx[0] += 1
                        break
            return max_eval
        else:
            min_eval = math.inf
            steps.append(build_decision_step(step_idx[0], node, depth, alpha, beta, "expand_min", min_eval, "Minimizing player turn"))
            step_idx[0] += 1
            
            for child in tree[node].get("children", []):
                eval_val = evaluate(child, depth + 1, True, alpha, beta)
                min_eval = min(min_eval, eval_val)
                steps.append(build_decision_step(step_idx[0], node, depth, alpha, beta, "update_min", min_eval, f"Child {child} returned {eval_val}"))
                step_idx[0] += 1
                
                if use_alpha_beta:
                    beta = min(beta, eval_val)
                    if beta <= alpha:
                        metrics["prunedBranches"] += 1
                        steps.append(build_decision_step(step_idx[0], node, depth, alpha, beta, "prune", min_eval, f"Alpha cutoff ({beta} <= {alpha})"))
                        step_idx[0] += 1
                        break
            return min_eval

    best_val = evaluate(root, 0, True)
    metrics["executionMs"] = (time.time() - start_time) * 1000

    return {
        "algorithm": "Alpha-Beta" if use_alpha_beta else "Minimax",
        "bestValue": best_val,
        "steps": steps,
        "metrics": metrics
    }

def check_winner(board):
    win_patterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], # rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], # cols
        [0, 4, 8], [2, 4, 6]             # diagonals
    ]
    for p in win_patterns:
        if board[p[0]] and board[p[0]] == board[p[1]] and board[p[1]] == board[p[2]]:
            return board[p[0]]
    if all(board):
        return 'draw'
    return None

def get_available_moves(board):
    return [i for i, v in enumerate(board) if v is None]

def solve_tic_tac_toe(board, use_alpha_beta=False):
    start_time = time.time()
    steps = []
    step_idx = [1]
    metrics = {"nodesExplored": 0, "prunedBranches": 0, "executionMs": 0}

    def evaluate(curr_board, depth, is_maximizing, alpha=-math.inf, beta=math.inf):
        metrics["nodesExplored"] += 1
        winner = check_winner(curr_board)
        if winner == 'X':
            val = 10 - depth
            steps.append(build_decision_step(step_idx[0], "board", depth, alpha, beta, "evaluate", val, "X wins"))
            step_idx[0] += 1
            return val
        elif winner == 'O':
            val = depth - 10
            steps.append(build_decision_step(step_idx[0], "board", depth, alpha, beta, "evaluate", val, "O wins"))
            step_idx[0] += 1
            return val
        elif winner == 'draw':
            steps.append(build_decision_step(step_idx[0], "board", depth, alpha, beta, "evaluate", 0, "Draw"))
            step_idx[0] += 1
            return 0

        moves = get_available_moves(curr_board)
        
        if is_maximizing:
            max_eval = -math.inf
            steps.append(build_decision_step(step_idx[0], "board", depth, alpha, beta, "maximize", max_eval, "AI (X) turn"))
            step_idx[0] += 1
            
            for move in moves:
                next_board = list(curr_board)
                next_board[move] = 'X'
                eval_val = evaluate(next_board, depth + 1, False, alpha, beta)
                max_eval = max(max_eval, eval_val)
                steps.append(build_decision_step(step_idx[0], "board", depth, alpha, beta, "update_max", max_eval, f"Move {move} returned {eval_val}"))
                step_idx[0] += 1
                
                if use_alpha_beta:
                    alpha = max(alpha, eval_val)
                    if beta <= alpha:
                        metrics["prunedBranches"] += 1
                        steps.append(build_decision_step(step_idx[0], "board", depth, alpha, beta, "prune", max_eval, f"Beta cutoff ({beta} <= {alpha})"))
                        step_idx[0] += 1
                        break
            return max_eval
        else:
            min_eval = math.inf
            steps.append(build_decision_step(step_idx[0], "board", depth, alpha, beta, "minimize", min_eval, "Player (O) turn"))
            step_idx[0] += 1
            
            for move in moves:
                next_board = list(curr_board)
                next_board[move] = 'O'
                eval_val = evaluate(next_board, depth + 1, True, alpha, beta)
                min_eval = min(min_eval, eval_val)
                steps.append(build_decision_step(step_idx[0], "board", depth, alpha, beta, "update_min", min_eval, f"Move {move} returned {eval_val}"))
                step_idx[0] += 1
                
                if use_alpha_beta:
                    beta = min(beta, eval_val)
                    if beta <= alpha:
                        metrics["prunedBranches"] += 1
                        steps.append(build_decision_step(step_idx[0], "board", depth, alpha, beta, "prune", min_eval, f"Alpha cutoff ({beta} <= {alpha})"))
                        step_idx[0] += 1
                        break
            return min_eval

    # Root call
    best_move = -1
    best_val = -math.inf
    alpha = -math.inf
    beta = math.inf
    
    moves = get_available_moves(board)
    for move in moves:
        next_board = list(board)
        next_board[move] = 'X'
        move_val = evaluate(next_board, 1, False, alpha, beta)
        
        if move_val > best_val:
            best_val = move_val
            best_move = move
            
        if use_alpha_beta:
            alpha = max(alpha, move_val)

    metrics["executionMs"] = (time.time() - start_time) * 1000

    return {
        "algorithm": "Alpha-Beta" if use_alpha_beta else "Minimax",
        "bestValue": best_val,
        "bestMove": f"Move→{best_move}",
        "steps": steps,
        "metrics": metrics
    }

