"""Algorithm performance profiling and metrics collection.

Provides instrumentation tools for measuring algorithm execution
characteristics including time complexity, memory usage, and
operation counting.

Author: CORTEX AI Engine
"""

import time
import tracemalloc
from typing import Any, Callable, Dict, List, Optional, Tuple
import statistics


class AlgorithmProfiler:
    """Profiler for measuring algorithm execution characteristics.

    Provides methods for timing, memory profiling, and comparative
    analysis across multiple algorithms on the same input.

    Example:
        profiler = AlgorithmProfiler()
        result, metrics = profiler.profile(bfs, graph, 'A', 'J')
        print(f"Time: {metrics['time_ms']}ms, Memory: {metrics['peak_memory_kb']}KB")
    """

    def __init__(self):
        """Initialize the profiler."""
        self._results: List[Dict] = []

    def measure_time(
        self,
        func: Callable,
        *args: Any,
        **kwargs: Any,
    ) -> Tuple[Any, float]:
        """Measure execution time of a function with high precision.

        Uses time.perf_counter() for nanosecond-level accuracy.

        Args:
            func: Function to profile
            *args: Positional arguments to pass to func
            **kwargs: Keyword arguments to pass to func

        Returns:
            Tuple of (function result, execution time in milliseconds)
        """
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed_ms = (time.perf_counter() - start) * 1000
        return result, round(elapsed_ms, 4)

    def measure_memory(
        self,
        func: Callable,
        *args: Any,
        **kwargs: Any,
    ) -> Tuple[Any, Dict[str, float]]:
        """Track memory usage during function execution.

        Uses tracemalloc to measure peak and current memory allocation.

        Args:
            func: Function to profile
            *args: Positional arguments to pass to func
            **kwargs: Keyword arguments to pass to func

        Returns:
            Tuple of (function result, memory metrics dict)
                Memory metrics include:
                    - peak_memory_kb: Peak memory usage in kilobytes
                    - current_memory_kb: Memory at end of execution
                    - allocated_blocks: Number of memory blocks allocated
        """
        tracemalloc.start()

        result = func(*args, **kwargs)

        current, peak = tracemalloc.get_traced_memory()
        snapshot = tracemalloc.take_snapshot()
        tracemalloc.stop()

        return result, {
            'peak_memory_kb': round(peak / 1024, 2),
            'current_memory_kb': round(current / 1024, 2),
            'allocated_blocks': len(snapshot.statistics('lineno')),
        }

    def profile(
        self,
        func: Callable,
        *args: Any,
        num_runs: int = 1,
        **kwargs: Any,
    ) -> Tuple[Any, Dict]:
        """Full profiling of a function including time and memory.

        Args:
            func: Function to profile
            *args: Positional arguments
            num_runs: Number of timing runs for statistical accuracy
            **kwargs: Keyword arguments

        Returns:
            Tuple of (function result, comprehensive metrics dict)
        """
        # Memory measurement (single run)
        result, memory_metrics = self.measure_memory(func, *args, **kwargs)

        # Time measurement (multiple runs for statistics)
        times: List[float] = []
        for _ in range(num_runs):
            _, elapsed = self.measure_time(func, *args, **kwargs)
            times.append(elapsed)

        time_metrics = {
            'mean_time_ms': round(statistics.mean(times), 4),
            'median_time_ms': round(statistics.median(times), 4),
            'min_time_ms': round(min(times), 4),
            'max_time_ms': round(max(times), 4),
        }
        if num_runs > 1:
            time_metrics['stddev_time_ms'] = round(statistics.stdev(times), 4)

        metrics = {**time_metrics, **memory_metrics, 'num_runs': num_runs}
        self._results.append({
            'function': func.__name__,
            'metrics': metrics,
        })

        return result, metrics

    def compare_algorithms(
        self,
        algorithms: List[Callable],
        *args: Any,
        num_runs: int = 5,
        **kwargs: Any,
    ) -> List[Dict]:
        """Run comparative profiling across multiple algorithms.

        Args:
            algorithms: List of algorithm functions to compare
            *args: Common arguments to pass to all algorithms
            num_runs: Number of timing runs per algorithm
            **kwargs: Common keyword arguments

        Returns:
            List of result dictionaries sorted by mean execution time
        """
        results = []
        for algo in algorithms:
            _, metrics = self.profile(algo, *args, num_runs=num_runs, **kwargs)
            results.append({
                'algorithm': algo.__name__,
                'metrics': metrics,
            })

        return sorted(results, key=lambda r: r['metrics']['mean_time_ms'])

    def count_operations(self, trace: List[Dict]) -> Dict[str, int]:
        """Count different types of operations from an execution trace.

        Args:
            trace: List of step dictionaries from algorithm execution

        Returns:
            Dictionary with operation counts by type
        """
        counts: Dict[str, int] = {
            'total_steps': len(trace),
            'expansions': 0,
            'frontier_additions': 0,
            'backtrack_operations': 0,
        }

        for step in trace:
            action = step.get('action', '').lower()
            if 'expand' in action or 'dequeue' in action or 'pop' in action:
                counts['expansions'] += 1
            if 'add' in action or 'push' in action or 'enqueue' in action:
                counts['frontier_additions'] += 1
            if 'backtrack' in action:
                counts['backtrack_operations'] += 1

        return counts

    def calculate_branching_factor(
        self,
        adjacency: Dict[str, Dict],
        visited_order: List[str],
    ) -> float:
        """Calculate the effective branching factor.

        The effective branching factor is the average number of successors
        generated per non-leaf node during the search.

        Args:
            adjacency: Graph adjacency list
            visited_order: Order of node visitation

        Returns:
            Effective branching factor as a float
        """
        if not visited_order:
            return 0.0

        non_leaf_count = sum(
            1 for n in visited_order
            if len(adjacency.get(n, {})) > 0
        )
        total_children = sum(
            len(adjacency.get(n, {}))
            for n in visited_order
        )

        return round(total_children / max(1, non_leaf_count), 2)


def format_metrics(metrics: Dict) -> str:
    """Format metrics dictionary into a human-readable string.

    Args:
        metrics: Dictionary of metric name-value pairs

    Returns:
        Formatted multi-line string for display
    """
    lines = []
    for key, value in metrics.items():
        label = key.replace('_', ' ').title()
        if isinstance(value, float):
            lines.append(f"  {label}: {value:.4f}")
        else:
            lines.append(f"  {label}: {value}")
    return '\n'.join(lines)
