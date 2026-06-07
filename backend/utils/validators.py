"""Input validation utilities for CORTEX AI API endpoints.

Provides validation functions for all API inputs to ensure
data integrity and provide meaningful error messages.

Author: CORTEX AI Engine
"""

from typing import Any, Dict, List, Optional, Set, Tuple


class ValidationError(Exception):
    """Custom exception for input validation failures.

    Attributes:
        field: Name of the field that failed validation
        message: Human-readable error description
        value: The invalid value that was provided
    """

    def __init__(self, field: str, message: str, value: Any = None):
        self.field = field
        self.message = message
        self.value = value
        super().__init__(f"Validation error on '{field}': {message}")


def validate_adjacency(adjacency: Any) -> Dict[str, Dict[str, float]]:
    """Validate and normalize an adjacency list.

    Checks that the input is a proper adjacency list format and
    all edge weights are non-negative numbers.

    Args:
        adjacency: Raw adjacency list input from API

    Returns:
        Validated and type-normalized adjacency list

    Raises:
        ValidationError: If the input is malformed
    """
    if not isinstance(adjacency, dict):
        raise ValidationError(
            'adjacency',
            f'Expected a dictionary, got {type(adjacency).__name__}',
            adjacency,
        )

    if len(adjacency) == 0:
        raise ValidationError(
            'adjacency',
            'Graph must have at least one node',
        )

    validated: Dict[str, Dict[str, float]] = {}

    for node, neighbors in adjacency.items():
        node_str = str(node)

        if not isinstance(neighbors, dict):
            raise ValidationError(
                f'adjacency[{node}]',
                f'Expected a dictionary of neighbors, got {type(neighbors).__name__}',
            )

        validated[node_str] = {}
        for neighbor, weight in neighbors.items():
            neighbor_str = str(neighbor)
            try:
                weight_float = float(weight)
            except (TypeError, ValueError):
                raise ValidationError(
                    f'adjacency[{node}][{neighbor}]',
                    f'Edge weight must be a number, got {type(weight).__name__}',
                    weight,
                )
            validated[node_str][neighbor_str] = weight_float

    return validated


def validate_nodes(
    adjacency: Dict[str, Dict[str, float]],
    start: str,
    goal: str,
) -> Tuple[str, str]:
    """Validate that start and goal nodes exist in the graph.

    Args:
        adjacency: Validated adjacency list
        start: Starting node identifier
        goal: Target node identifier

    Returns:
        Tuple of (start, goal) as validated strings

    Raises:
        ValidationError: If nodes don't exist or are the same
    """
    nodes: Set[str] = set(adjacency.keys())

    # Also add nodes that appear only as neighbors
    for neighbors in adjacency.values():
        nodes.update(neighbors.keys())

    start = str(start)
    goal = str(goal)

    if start not in nodes:
        raise ValidationError(
            'start',
            f'Node "{start}" does not exist in the graph. '
            f'Available nodes: {sorted(nodes)}',
            start,
        )

    if goal not in nodes:
        raise ValidationError(
            'goal',
            f'Node "{goal}" does not exist in the graph. '
            f'Available nodes: {sorted(nodes)}',
            goal,
        )

    return start, goal


def validate_heuristic(
    heuristic: Any,
    nodes: Set[str],
) -> Dict[str, float]:
    """Validate heuristic values for completeness and type.

    Args:
        heuristic: Raw heuristic input from API
        nodes: Set of valid node identifiers

    Returns:
        Validated heuristic dictionary

    Raises:
        ValidationError: If heuristic is malformed or incomplete
    """
    if not isinstance(heuristic, dict):
        raise ValidationError(
            'heuristic',
            f'Expected a dictionary, got {type(heuristic).__name__}',
        )

    validated: Dict[str, float] = {}
    for node, value in heuristic.items():
        node_str = str(node)
        try:
            validated[node_str] = float(value)
        except (TypeError, ValueError):
            raise ValidationError(
                f'heuristic[{node}]',
                f'Heuristic value must be a number, got {type(value).__name__}',
                value,
            )

    # Check for missing nodes (use 0 as default for missing values)
    for node in nodes:
        if node not in validated:
            validated[node] = 0

    return validated


def validate_board(board: Any) -> List[Optional[str]]:
    """Validate a Tic-Tac-Toe board state.

    Args:
        board: Raw board input (list of 9 cells)

    Returns:
        Validated board as list of 'X', 'O', or None

    Raises:
        ValidationError: If board format is invalid
    """
    if not isinstance(board, list):
        raise ValidationError(
            'board',
            f'Expected a list, got {type(board).__name__}',
        )

    if len(board) != 9:
        raise ValidationError(
            'board',
            f'Board must have exactly 9 cells, got {len(board)}',
        )

    validated: List[Optional[str]] = []
    for i, cell in enumerate(board):
        if cell is None or cell == '' or cell == 'null':
            validated.append(None)
        elif cell in ('X', 'O'):
            validated.append(cell)
        else:
            raise ValidationError(
                f'board[{i}]',
                f'Cell must be "X", "O", or null, got "{cell}"',
                cell,
            )

    return validated


def validate_csp_input(
    problem: str,
    **kwargs: Any,
) -> Dict[str, Any]:
    """Validate CSP problem input parameters.

    Args:
        problem: Problem type ('n_queens', 'graph_coloring', 'timetabling')
        **kwargs: Problem-specific parameters

    Returns:
        Validated parameters dictionary

    Raises:
        ValidationError: If parameters are invalid
    """
    valid_problems = {'n_queens', 'graph_coloring', 'timetabling', 'cryptarithmetic'}

    if problem not in valid_problems:
        raise ValidationError(
            'problem',
            f'Unknown problem type. Must be one of: {sorted(valid_problems)}',
            problem,
        )

    validated: Dict[str, Any] = {'problem': problem}

    if problem == 'n_queens':
        n = kwargs.get('n', 8)
        try:
            n = int(n)
        except (TypeError, ValueError):
            raise ValidationError('n', 'N must be an integer', n)
        if n < 4 or n > 20:
            raise ValidationError('n', 'N must be between 4 and 20', n)
        validated['n'] = n

    elif problem == 'graph_coloring':
        n_colors = kwargs.get('nColors', 3)
        try:
            n_colors = int(n_colors)
        except (TypeError, ValueError):
            raise ValidationError('nColors', 'Must be an integer', n_colors)
        if n_colors < 2 or n_colors > 10:
            raise ValidationError('nColors', 'Must be between 2 and 10', n_colors)
        validated['nColors'] = n_colors

    return validated
