"""Benchmark runner for systematic algorithm performance evaluation.

Provides a structured framework for running algorithms across multiple
trials, computing statistical summaries, and generating formatted
comparison reports. Supports both search algorithms and CSP techniques.
"""

import time
import statistics
import random
from typing import Any, Callable, Dict, List, Optional, Tuple


class BenchmarkSuite:
    """Configurable benchmark suite for algorithm comparison.

    Runs a set of algorithms against generated test graphs, collects
    timing and metric data across multiple trials, and produces
    statistical summaries and formatted reports.

    Example:
        >>> suite = BenchmarkSuite(
        ...     algorithms={"BFS": bfs, "DFS": dfs},
        ...     graph_generator=random_connected_graph,
        ... )
        >>> suite.run_benchmark(num_trials=10)
        >>> report = suite.generate_report()
    """

    def __init__(
        self,
        algorithms: Dict[str, Callable],
        graph_generator: Callable,
    ) -> None:
        """Initialize benchmark suite.

        Args:
            algorithms: Dictionary mapping algorithm names to callable
                        functions with signature (adjacency, start, goal, ...).
            graph_generator: Callable that returns (adjacency, start, goal)
                             tuples for generating test inputs.
        """
        self.algorithms: Dict[str, Callable] = algorithms
        self.graph_generator: Callable = graph_generator
        self.results: Dict[str, List[Dict[str, Any]]] = {
            name: [] for name in algorithms
        }
        self._completed: bool = False

    def run_benchmark(
        self,
        num_trials: int = 10,
        graph_size: int = 10,
    ) -> None:
        """Run all algorithms across multiple trials.

        Each trial generates a new random graph and runs every algorithm
        on the same graph for fair comparison.

        Args:
            num_trials: Number of independent trials to run.
            graph_size: Number of nodes in the generated graphs.
        """
        self.results = {name: [] for name in self.algorithms}

        for trial in range(num_trials):
            # Generate a shared graph for all algorithms in this trial
            graph_data = self.graph_generator(graph_size)
            adjacency = graph_data[0]
            start = graph_data[1]
            goal = graph_data[2]
            extra_args = graph_data[3:] if len(graph_data) > 3 else ()

            for name, func in self.algorithms.items():
                start_time = time.perf_counter_ns()
                try:
                    result = func(adjacency, start, goal, *extra_args)
                    elapsed_ns = time.perf_counter_ns() - start_time

                    metrics = result.get("metrics", {})
                    self.results[name].append({
                        "trial": trial + 1,
                        "elapsed_ms": elapsed_ns / 1_000_000,
                        "nodes_expanded": metrics.get("nodesExpanded", 0),
                        "path_cost": metrics.get("pathCost", 0),
                        "path_length": len(result.get("path", [])),
                        "path_found": len(result.get("path", [])) > 0,
                        "error": None,
                    })
                except Exception as e:
                    elapsed_ns = time.perf_counter_ns() - start_time
                    self.results[name].append({
                        "trial": trial + 1,
                        "elapsed_ms": elapsed_ns / 1_000_000,
                        "nodes_expanded": 0,
                        "path_cost": 0,
                        "path_length": 0,
                        "path_found": False,
                        "error": str(e),
                    })

        self._completed = True

    def statistical_summary(self) -> Dict[str, Dict[str, Any]]:
        """Compute statistical summary for each algorithm.

        Returns mean, median, standard deviation, min, and max for
        timing and node expansion across all trials.

        Returns:
            Dictionary mapping algorithm names to their statistical summaries.

        Raises:
            RuntimeError: If benchmark has not been run yet.
        """
        if not self._completed:
            raise RuntimeError("Run benchmark first with run_benchmark()")

        summary: Dict[str, Dict[str, Any]] = {}

        for name, trials in self.results.items():
            timings = [t["elapsed_ms"] for t in trials if t["error"] is None]
            nodes = [t["nodes_expanded"] for t in trials if t["error"] is None]
            costs = [t["path_cost"] for t in trials if t["error"] is None]
            success_count = sum(1 for t in trials if t["path_found"])

            if not timings:
                summary[name] = {"error": "All trials failed"}
                continue

            summary[name] = {
                "timing": {
                    "mean_ms": statistics.mean(timings),
                    "median_ms": statistics.median(timings),
                    "stdev_ms": statistics.stdev(timings) if len(timings) > 1 else 0.0,
                    "min_ms": min(timings),
                    "max_ms": max(timings),
                },
                "nodes_expanded": {
                    "mean": statistics.mean(nodes),
                    "median": statistics.median(nodes),
                    "min": min(nodes),
                    "max": max(nodes),
                },
                "path_cost": {
                    "mean": statistics.mean(costs) if costs else 0,
                    "min": min(costs) if costs else 0,
                    "max": max(costs) if costs else 0,
                },
                "success_rate": success_count / len(trials),
                "total_trials": len(trials),
            }

        return summary

    def generate_report(self) -> str:
        """Generate a formatted comparison report.

        Produces a human-readable table comparing all algorithms
        across key performance dimensions.

        Returns:
            Formatted string report with aligned columns.
        """
        summary = self.statistical_summary()

        # Header
        header = f"{'Algorithm':<15} {'Avg Time (ms)':<15} {'Med Time':<12} {'Avg Nodes':<12} {'Success %':<12}"
        separator = "-" * len(header)
        lines = [separator, header, separator]

        for name, stats in summary.items():
            if "error" in stats:
                lines.append(f"{name:<15} {'ERROR':<15}")
                continue

            t = stats["timing"]
            n = stats["nodes_expanded"]
            sr = stats["success_rate"]
            lines.append(
                f"{name:<15} {t['mean_ms']:<15.3f} {t['median_ms']:<12.3f} "
                f"{n['mean']:<12.1f} {sr * 100:<12.1f}"
            )

        lines.append(separator)
        return "\n".join(lines)


def benchmark_search_algorithms(graph_size: int = 10) -> Dict[str, Any]:
    """Preset benchmark for all 8 search algorithms on random graphs.

    Generates a random connected graph and benchmarks BFS, DFS, UCS,
    GBFS, A*, Dijkstra, IDDFS, and IDA* on it.

    Args:
        graph_size: Number of nodes in the test graph.

    Returns:
        Benchmark results with timing and metrics for each algorithm.
    """
    # Import algorithms lazily to avoid circular dependencies
    from algorithms.search import bfs, dfs, ucs, gbfs, astar, dijkstra, iddfs, ida_star

    # Generate a simple connected graph
    nodes = [chr(65 + i) for i in range(min(graph_size, 26))]
    adjacency: Dict[str, Dict[str, float]] = {n: {} for n in nodes}

    # Create a connected backbone
    for i in range(len(nodes) - 1):
        w = random.randint(1, 10)
        adjacency[nodes[i]][nodes[i + 1]] = w
        adjacency[nodes[i + 1]][nodes[i]] = w

    # Add random extra edges
    for _ in range(graph_size):
        a, b = random.sample(nodes, 2)
        if b not in adjacency[a]:
            w = random.randint(1, 10)
            adjacency[a][b] = w
            adjacency[b][a] = w

    start, goal = nodes[0], nodes[-1]

    # Simple heuristic: position-based (index distance)
    heuristic = {n: abs(nodes.index(n) - nodes.index(goal)) for n in nodes}

    results: Dict[str, Any] = {}

    # Uninformed algorithms
    for name, func in [("BFS", bfs), ("DFS", dfs), ("UCS", ucs), ("Dijkstra", dijkstra), ("IDDFS", iddfs)]:
        start_time = time.perf_counter_ns()
        result = func(adjacency, start, goal)
        elapsed = (time.perf_counter_ns() - start_time) / 1_000_000
        results[name] = {"elapsed_ms": elapsed, "metrics": result.get("metrics", {})}

    # Informed algorithms
    for name, func in [("GBFS", gbfs), ("A*", astar), ("IDA*", ida_star)]:
        start_time = time.perf_counter_ns()
        result = func(adjacency, start, goal, heuristic)
        elapsed = (time.perf_counter_ns() - start_time) / 1_000_000
        results[name] = {"elapsed_ms": elapsed, "metrics": result.get("metrics", {})}

    return results


def benchmark_csp_techniques(problem_size: int = 8) -> Dict[str, Any]:
    """Benchmark CSP solving with different technique combinations.

    Tests the N-Queens problem with various combinations of forward
    checking, MRV, LCV, and AC-3 to measure their impact.

    Args:
        problem_size: Size of the N-Queens board.

    Returns:
        Results for each technique combination.
    """
    from csp.solvers import solve_csp_backtracking, create_n_queens

    variables, domains, constraints = create_n_queens(problem_size)

    techniques = [
        ("Backtracking", {}),
        ("FC", {"useForwardChecking": True}),
        ("MRV", {"useMRV": True}),
        ("FC+MRV", {"useForwardChecking": True, "useMRV": True}),
        ("FC+MRV+LCV", {"useForwardChecking": True, "useMRV": True, "useLCV": True}),
    ]

    results: Dict[str, Any] = {}

    for name, options in techniques:
        start_time = time.perf_counter_ns()
        result = solve_csp_backtracking(variables, dict(domains), constraints, options)
        elapsed = (time.perf_counter_ns() - start_time) / 1_000_000

        results[name] = {
            "elapsed_ms": elapsed,
            "metrics": result.get("metrics", {}),
            "solved": result.get("solution") is not None,
        }

    return results
