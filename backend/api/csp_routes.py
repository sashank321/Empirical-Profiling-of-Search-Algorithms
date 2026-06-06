from flask import Blueprint, request, jsonify
from csp.solvers import solve_csp_backtracking, create_n_queens, create_graph_coloring, create_timetabling, create_cryptarithmetic

csp_api = Blueprint('csp_api', __name__)

@csp_api.route('/execute', methods=['POST'])
def execute_csp():
    data = request.json
    problem_type = data.get('problem')
    options = data.get('options', {})

    if problem_type == 'n_queens':
        n = data.get('n', 8)
        variables, domains, constraints = create_n_queens(n)
    elif problem_type == 'graph_coloring':
        nodes = data.get('nodes', [])
        edges = data.get('edges', [])
        n_colors = data.get('nColors', 3)
        variables, domains, constraints = create_graph_coloring(nodes, edges, n_colors)
    elif problem_type == 'timetabling':
        variables, domains, constraints = create_timetabling()
    elif problem_type == 'cryptarithmetic':
        word1 = data.get('word1', 'SEND')
        word2 = data.get('word2', 'MORE')
        result_word = data.get('result_word', 'MONEY')
        variables, domains, constraints = create_cryptarithmetic(word1, word2, result_word)
    else:
        return jsonify({"error": f"Unknown CSP problem: {problem_type}"}), 400

    result = solve_csp_backtracking(variables, domains, constraints, options)
    return jsonify(result)
