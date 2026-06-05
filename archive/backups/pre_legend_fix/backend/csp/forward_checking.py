"""Forward Checking for Constraint Satisfaction Problems.

Forward checking is a look-ahead technique that prunes the search space
by removing values from the domains of unassigned variables that conflict
with the current assignment.

It detects failures earlier than simple backtracking.

Author: CORTEX AI Engine
"""

from typing import Any, Callable, Dict, List, Set, Tuple


def forward_check(
    var: str,
    value: Any,
    assignment: Dict[str, Any],
    domains: Dict[str, List[Any]],
    unassigned: List[str],
    is_consistent: Callable[[Dict[str, Any]], bool],
) -> Tuple[bool, Dict[str, List[Any]]]:
    """Perform forward checking after assigning a value to a variable.

    Temporarily assigns values to unassigned variables to check if
    the new assignment violates any constraints. If it does, the
    conflicting value is removed from the unassigned variable's domain.

    Args:
        var: The variable just assigned
        value: The value assigned to var
        assignment: Current partial assignment (including var=value)
        domains: Current domains of all variables
        unassigned: List of variables not yet assigned
        is_consistent: Constraint checking function

    Returns:
        Tuple of (success_boolean, pruned_values_dict).
        If success is False, the assignment led to a domain wipeout (empty domain).
        pruned_values maps variable name to a list of values removed from its domain.
    """
    pruned: Dict[str, List[Any]] = {u: [] for u in unassigned}

    for u_var in unassigned:
        domain = domains[u_var]
        valid_values = []

        for u_val in domain:
            # Temporarily add to assignment to test consistency
            assignment[u_var] = u_val
            
            if is_consistent(assignment):
                valid_values.append(u_val)
            else:
                pruned[u_var].append(u_val)
                
            # Remove temporary assignment
            del assignment[u_var]

        # Update the domain to only contain valid values
        domains[u_var] = valid_values

        # Domain wipeout check (DWO)
        # If any unassigned variable has no legal values left,
        # the current partial assignment is doomed to fail.
        if not valid_values:
            return False, pruned

    return True, pruned


def restore_domains(
    domains: Dict[str, List[Any]],
    pruned: Dict[str, List[Any]],
) -> None:
    """Restore pruned values back to domains during backtracking.

    Args:
        domains: Current variable domains to restore
        pruned: Dictionary of values that were pruned {var: [values]}
    """
    for var, values in pruned.items():
        if values:
            domains[var].extend(values)
            # Sorting might be needed depending on domain semantics,
            # but usually appending is sufficient for backtracking
