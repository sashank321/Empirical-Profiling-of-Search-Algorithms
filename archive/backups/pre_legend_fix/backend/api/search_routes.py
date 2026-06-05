from flask import Blueprint, request, jsonify, abort
from algorithms.bfs import breadth_first_search
from algorithms.dfs import depth_first_search
from algorithms.ucs import uniform_cost_search
from algorithms.gbfs import greedy_best_first_search
from algorithms.astar import a_star_search
from algorithms.dijkstra import dijkstra_search
from algorithms.iddfs import iterative_deepening_dfs
from algorithms.idastar import ida_star_search
from utils.validators import validate_adjacency, validate_nodes, validate_heuristic, ValidationError

search_bp = Blueprint('search', __name__)

ALGORITHMS = {
    'bfs': breadth_first_search,
    'dfs': depth_first_search,
    'ucs': uniform_cost_search,
    'gbfs': greedy_best_first_search,
    'astar': a_star_search,
    'dijkstra': dijkstra_search,
    'iddfs': iterative_deepening_dfs,
    'idastar': ida_star_search,
}

@search_bp.route('/execute', methods=['POST'])
def execute_search_from_body():
    data = request.get_json()
    if not data:
        abort(400, description="Missing JSON payload")
    algo_id = data.get('algorithm')
    if not algo_id or algo_id not in ALGORITHMS:
        abort(400, description=f"Unknown algorithm: {algo_id}")
    
    try:
        # Validate inputs
        adjacency = validate_adjacency(data.get('adjacency'))
        start, goal = validate_nodes(adjacency, data.get('start'), data.get('goal'))
        
        algorithm_fn = ALGORITHMS[algo_id]
        
        # Check if algorithm requires heuristic
        if algo_id in ('gbfs', 'astar', 'idastar'):
            heuristic = validate_heuristic(data.get('heuristic', {}), set(adjacency.keys()))
            result = algorithm_fn(adjacency, start, goal, heuristic)
        else:
            result = algorithm_fn(adjacency, start, goal)
            
        return jsonify(result)
        
    except ValidationError as e:
        abort(400, description=str(e))
    except Exception as e:
        # Log exception here in production
        print(f"Error in {algo_id}: {str(e)}")
        abort(500, description="Algorithm execution failed")

@search_bp.route('/<algo_id>', methods=['POST'])
def execute_search(algo_id):
    """Execute a search algorithm based on algorithm ID."""
    if algo_id not in ALGORITHMS:
        abort(400, description=f"Unknown algorithm: {algo_id}")
        
    data = request.get_json()
    if not data:
        abort(400, description="Missing JSON payload")
        
    try:
        # Validate inputs
        adjacency = validate_adjacency(data.get('adjacency'))
        start, goal = validate_nodes(adjacency, data.get('start'), data.get('goal'))
        
        algorithm_fn = ALGORITHMS[algo_id]
        
        # Check if algorithm requires heuristic
        if algo_id in ('gbfs', 'astar', 'idastar'):
            heuristic = validate_heuristic(data.get('heuristic', {}), set(adjacency.keys()))
            result = algorithm_fn(adjacency, start, goal, heuristic)
        else:
            result = algorithm_fn(adjacency, start, goal)
            
        return jsonify(result)
        
    except ValidationError as e:
        abort(400, description=str(e))
    except Exception as e:
        # Log exception here in production
        print(f"Error in {algo_id}: {str(e)}")
        abort(500, description="Algorithm execution failed")
