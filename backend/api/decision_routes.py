from flask import Blueprint, request, jsonify
from decision.minimax import solve_minimax, solve_tic_tac_toe

decision_api = Blueprint('decision_api', __name__)

@decision_api.route('/execute', methods=['POST'])
def execute_decision():
    data = request.json
    problem = data.get('problem')
    use_alpha_beta = data.get('useAlphaBeta', False)

    if problem == 'tic_tac_toe':
        board = data.get('board')
        result = solve_tic_tac_toe(board, use_alpha_beta)
        return jsonify(result)

    tree = data.get('tree', {})
    root = data.get('root')
    max_depth = data.get('maxDepth', 3)

    if not tree or not root:
        return jsonify({"error": "Missing tree or root node"}), 400

    result = solve_minimax(tree, root, max_depth, use_alpha_beta)
    return jsonify(result)
