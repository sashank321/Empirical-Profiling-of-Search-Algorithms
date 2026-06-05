"""Constraint Satisfaction Problem solvers and problem generators.

Implements backtracking with optional enhancements:
- Forward Checking
- Minimum Remaining Values (MRV)
- Least Constraining Value (LCV)
- Arc Consistency (AC-3)

Problem generators: N-Queens, Graph Coloring, Timetabling, Cryptarithmetic.
"""
from .solvers import (
    solve_csp_backtracking,
    create_n_queens,
    create_graph_coloring,
    create_timetabling,
    create_cryptarithmetic,
)

__all__ = [
    'solve_csp_backtracking',
    'create_n_queens',
    'create_graph_coloring',
    'create_timetabling',
    'create_cryptarithmetic',
]
