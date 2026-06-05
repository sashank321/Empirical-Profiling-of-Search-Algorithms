"""Heuristics for variable and value ordering in CSPs.

Variable Ordering:
- Minimum Remaining Values (MRV): Choose variable with fewest legal values
- Degree Heuristic: Choose variable involved in most constraints

Value Ordering:
- Least Constraining Value (LCV): Choose value that rules out the fewest
  choices for neighboring variables

These heuristics significantly improve backtracking search efficiency.

Author: CORTEX AI Engine
"""

from typing import Any, Callable, Dict, List, Optional


def minimum_remaining_values(
    unassigned: List[str],
    domains: Dict[str, List[Any]],
) -> str:
    """MRV Heuristic (Fail-First).

    Chooses the variable with the smallest domain size. This promotes
    failing early if a path is doomed, saving search time.

    Args:
        unassigned: List of unassigned variables
        domains: Current domains of all variables

    Returns:
        The selected variable name
    """
    # min() with key function finds the variable with smallest len(domain)
    return min(unassigned, key=lambda var: len(domains[var]))


def degree_heuristic(
    unassigned: List[str],
    constraints_map: Dict[str, int],
) -> str:
    """Degree Heuristic.

    Chooses the variable involved in the largest number of constraints
    on other unassigned variables. Often used as a tie-breaker for MRV.

    Args:
        unassigned: List of unassigned variables
        constraints_map: Pre-computed map of variable -> constraint count

    Returns:
        The selected variable name
    """
    return max(unassigned, key=lambda var: constraints_map.get(var, 0))


def mrv_with_degree_tiebreaker(
    unassigned: List[str],
    domains: Dict[str, List[Any]],
    constraints_map: Dict[str, int],
) -> str:
    """Combined MRV and Degree Heuristic.

    Uses MRV primary, and Degree Heuristic to break ties.

    Args:
        unassigned: List of unassigned variables
        domains: Current domains
        constraints_map: Map of variable constraint degrees

    Returns:
        The selected variable name
    """
    # Sort by domain size (ascending), then by degree (descending)
    sorted_vars = sorted(
        unassigned,
        key=lambda var: (len(domains[var]), -constraints_map.get(var, 0))
    )
    return sorted_vars[0]


def least_constraining_value(
    var: str,
    domains: Dict[str, List[Any]],
    assignment: Dict[str, Any],
    unassigned: List[str],
    is_consistent: Callable[[Dict[str, Any]], bool],
) -> List[Any]:
    """LCV Heuristic.

    Orders the values in the domain of `var` such that the values
    that rule out the fewest choices for neighboring unassigned
    variables come first.

    Args:
        var: The variable being assigned
        domains: Current domains
        assignment: Current partial assignment
        unassigned: List of unassigned variables
        is_consistent: Constraint checking function

    Returns:
        List of values ordered by how few constraints they impose
    """
    def count_conflicts(val: Any) -> int:
        conflicts = 0
        assignment[var] = val
        
        # Count how many values in unassigned variables' domains
        # would become invalid if we choose this value
        for u_var in unassigned:
            if u_var == var:
                continue
            for u_val in domains[u_var]:
                assignment[u_var] = u_val
                if not is_consistent(assignment):
                    conflicts += 1
                del assignment[u_var]
                
        del assignment[var]
        return conflicts

    # Sort domain values by the number of conflicts they cause (ascending)
    return sorted(domains[var], key=count_conflicts)
