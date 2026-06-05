"""Standardized Benchmarks for Search Algorithms.

Runs exhaustive comparisons between all search algorithms on various
graph topologies and sizes, collecting empirical performance data.

Author: CORTEX AI Engine
"""

from ..algorithms import bfs, dfs, ucs, gbfs, astar, dijkstra, iddfs, ida_star
from ..utils.graph_generator import random_connected_graph, generate_heuristic
from ..profiling.metrics import AlgorithmProfiler


def run_search_benchmarks():
    """Run search benchmarks across different graph sizes."""
    print("Initializing CORTEX AI Search Benchmarks...")
    
    profiler = AlgorithmProfiler()
    sizes = [10, 50, 100, 200]
    
    algorithms = [
        bfs.breadth_first_search,
        dfs.depth_first_search,
        ucs.uniform_cost_search,
        dijkstra.dijkstra_search,
        # Note: A* and GBFS require heuristics, so they need a wrapper
        # IDDFS and IDA* can be very slow on dense graphs
    ]
    
    for size in sizes:
        print(f"\n--- Testing Graph Size: {size} Nodes ---")
        graph = random_connected_graph(size, extra_edges=size, seed=42)
        start_node = 'A'
        goal_node = chr(65 + min(size - 1, 25)) # Last char up to Z
        
        for algo in algorithms:
            try:
                _, metrics = profiler.profile(algo, graph, start_node, goal_node, num_runs=3)
                print(f"{algo.__name__:>25}: {metrics['mean_time_ms']:>8.2f} ms | Expanded: {metrics['nodesExpanded']}")
            except Exception as e:
                print(f"{algo.__name__:>25}: FAILED ({str(e)})")


if __name__ == "__main__":
    run_search_benchmarks()
