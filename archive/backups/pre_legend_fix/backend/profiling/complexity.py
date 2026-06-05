"""Complexity analysis and classification for search algorithms.

Provides theoretical complexity data and empirical growth rate analysis
to classify algorithm behavior as polynomial, exponential, etc.

Author: CORTEX AI Engine
"""

from typing import Dict, List, Optional, Tuple
import math


# ─── Theoretical Complexity Database ───────────────────────────────────────

COMPLEXITY_TABLE: Dict[str, Dict[str, str]] = {
    'bfs': {
        'time': 'O(V + E)',
        'space': 'O(V)',
        'optimal': 'Yes (unweighted)',
        'complete': 'Yes',
        'strategy': 'FIFO Queue',
    },
    'dfs': {
        'time': 'O(V + E)',
        'space': 'O(bm)',
        'optimal': 'No',
        'complete': 'No (infinite graphs)',
        'strategy': 'LIFO Stack',
    },
    'ucs': {
        'time': 'O(V²)',
        'space': 'O(V)',
        'optimal': 'Yes',
        'complete': 'Yes (positive costs)',
        'strategy': 'Priority Queue (g)',
    },
    'gbfs': {
        'time': 'O(V²)',
        'space': 'O(V)',
        'optimal': 'No',
        'complete': 'No',
        'strategy': 'Priority Queue (h)',
    },
    'astar': {
        'time': 'O(V²)',
        'space': 'O(V)',
        'optimal': 'Yes (admissible h)',
        'complete': 'Yes',
        'strategy': 'Priority Queue (g + h)',
    },
    'dijkstra': {
        'time': 'O(V²)',
        'space': 'O(V)',
        'optimal': 'Yes',
        'complete': 'Yes (positive costs)',
        'strategy': 'Priority Queue (distance)',
    },
    'iddfs': {
        'time': 'O(b^d)',
        'space': 'O(d)',
        'optimal': 'Yes (unweighted)',
        'complete': 'Yes',
        'strategy': 'Iterative DFS',
    },
    'idastar': {
        'time': 'O(b^d)',
        'space': 'O(d)',
        'optimal': 'Yes (admissible h)',
        'complete': 'Yes',
        'strategy': 'Iterative Deepening f-cost',
    },
    'backtracking': {
        'time': 'O(d^n)',
        'space': 'O(n)',
        'optimal': 'N/A',
        'complete': 'Yes',
        'strategy': 'Recursive Assignment',
    },
    'minimax': {
        'time': 'O(b^m)',
        'space': 'O(bm)',
        'optimal': 'Yes (perfect play)',
        'complete': 'Yes',
        'strategy': 'Full Tree Exploration',
    },
    'alphabeta': {
        'time': 'O(b^(m/2))',
        'space': 'O(bm)',
        'optimal': 'Yes',
        'complete': 'Yes',
        'strategy': 'Pruned Tree Exploration',
    },
}


def theoretical_complexity(algorithm_name: str) -> Optional[Dict[str, str]]:
    """Get known theoretical complexity for an algorithm.

    Args:
        algorithm_name: Algorithm identifier (e.g., 'bfs', 'astar')

    Returns:
        Dictionary with time/space complexity, optimality, completeness,
        or None if algorithm is not in the database
    """
    return COMPLEXITY_TABLE.get(algorithm_name.lower())


def complexity_comparison_table(
    algorithms: Optional[List[str]] = None,
) -> List[Dict[str, str]]:
    """Generate a comparison table of algorithm complexities.

    Args:
        algorithms: Optional list of algorithm names to include.
                    Defaults to all known algorithms.

    Returns:
        List of dictionaries suitable for tabular display
    """
    if algorithms is None:
        algorithms = list(COMPLEXITY_TABLE.keys())

    table = []
    for algo in algorithms:
        data = COMPLEXITY_TABLE.get(algo.lower())
        if data:
            table.append({
                'algorithm': algo.upper(),
                **data,
            })
    return table


def empirical_growth_rate(
    sizes: List[int],
    timings: List[float],
) -> Dict[str, any]:
    """Estimate empirical growth rate from timing data.

    Fits the timing data to common complexity classes to determine
    the best-matching growth pattern.

    Args:
        sizes: List of input sizes (e.g., number of nodes)
        timings: Corresponding execution times in milliseconds

    Returns:
        Dictionary with:
            - best_fit: Name of best-matching complexity class
            - growth_ratio: Average ratio between consecutive timings
            - classification: 'polynomial' or 'exponential'
            - details: Per-class fit quality scores
    """
    if len(sizes) < 2 or len(timings) < 2:
        return {
            'best_fit': 'insufficient_data',
            'growth_ratio': 0,
            'classification': 'unknown',
            'details': {},
        }

    # Calculate growth ratios between consecutive measurements
    ratios = []
    for i in range(1, len(timings)):
        if timings[i - 1] > 0:
            ratios.append(timings[i] / timings[i - 1])

    avg_ratio = sum(ratios) / len(ratios) if ratios else 1

    # Calculate size ratios
    size_ratios = []
    for i in range(1, len(sizes)):
        if sizes[i - 1] > 0:
            size_ratios.append(sizes[i] / sizes[i - 1])

    avg_size_ratio = sum(size_ratios) / len(size_ratios) if size_ratios else 2

    # Classify growth pattern
    # Linear: ratio ≈ size_ratio
    # Quadratic: ratio ≈ size_ratio²
    # Exponential: ratio >> size_ratio²
    linear_expected = avg_size_ratio
    quadratic_expected = avg_size_ratio ** 2

    linear_error = abs(avg_ratio - linear_expected)
    quadratic_error = abs(avg_ratio - quadratic_expected)

    if avg_ratio > quadratic_expected * 2:
        best_fit = 'exponential'
        classification = 'exponential'
    elif quadratic_error < linear_error:
        best_fit = 'quadratic'
        classification = 'polynomial'
    else:
        best_fit = 'linear'
        classification = 'polynomial'

    return {
        'best_fit': best_fit,
        'growth_ratio': round(avg_ratio, 4),
        'classification': classification,
        'details': {
            'linear_error': round(linear_error, 4),
            'quadratic_error': round(quadratic_error, 4),
            'avg_size_ratio': round(avg_size_ratio, 4),
        },
    }


def is_polynomial(growth_data: Dict) -> bool:
    """Determine if growth pattern is polynomial.

    Args:
        growth_data: Output from empirical_growth_rate()

    Returns:
        True if the growth is classified as polynomial
    """
    return growth_data.get('classification') == 'polynomial'
