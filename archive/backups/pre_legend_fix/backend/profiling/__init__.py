"""Algorithm profiling, benchmarking, and complexity analysis tools.

Provides instrumentation for measuring:
- Execution time (high-precision)
- Memory usage (via tracemalloc)
- Operation counting
- Empirical complexity classification
"""
from .metrics import AlgorithmProfiler, format_metrics
from .complexity import theoretical_complexity, complexity_comparison_table

__all__ = [
    'AlgorithmProfiler',
    'format_metrics',
    'theoretical_complexity',
    'complexity_comparison_table',
]
