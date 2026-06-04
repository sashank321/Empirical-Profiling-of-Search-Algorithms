from flask import Blueprint, request, jsonify
import time
from algorithms.search import bfs, dfs, ucs, gbfs, astar, dijkstra, iddfs, ida_star

search_api = Blueprint('search_api', __name__)

ALGORITHMS = {
    'bfs': bfs,
    'dfs': dfs,
    'ucs': ucs,
    'gbfs': gbfs,
    'astar': astar,
    'dijkstra': dijkstra,
    'iddfs': iddfs,
    'idaStar': ida_star
}

@search_api.route('/execute', methods=['POST'])
def execute_search():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    algo_id = data.get('algorithm')
    adjacency = data.get('adjacency')
    start_node = data.get('start')
    goal_node = data.get('goal')
    heuristic = data.get('heuristic', {})

    if algo_id not in ALGORITHMS:
        return jsonify({"error": f"Unknown algorithm: {algo_id}"}), 400
    
    if not adjacency or not start_node or not goal_node:
        return jsonify({"error": "Missing required graph parameters"}), 400

    algo_func = ALGORITHMS[algo_id]

    # Needs heuristic check
    if algo_id in ['gbfs', 'astar', 'idaStar']:
        result = algo_func(adjacency, start_node, goal_node, heuristic)
    else:
        result = algo_func(adjacency, start_node, goal_node)

    return jsonify(result)
