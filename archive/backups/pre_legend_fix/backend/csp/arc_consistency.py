"""Arc Consistency 3 (AC-3) Algorithm for Constraint Satisfaction Problems.

AC-3 enforces arc consistency across the entire CSP network.
An arc (X, Y) is consistent if for every value x in Domain(X),
there exists some value y in Domain(Y) that satisfies the constraints.

This is a powerful propagation technique that can drastically reduce
the search space or even solve the CSP entirely without search.

Author: CORTEX AI Engine
"""

from typing import Any, Callable, Dict, List, Set, Tuple
from collections import deque


def revise(
    xi: str,
    xj: str,
    domains: Dict[str, List[Any]],
    assignment: Dict[str, Any],
    is_consistent: Callable[[Dict[str, Any]], bool],
) -> Tuple[bool, List[Any]]:
    """Revise domain of Xi to be arc-consistent with Xj.

    Removes values from Domain(Xi) that do not have any compatible
    value in Domain(Xj).

    Args:
        xi: Source variable
        xj: Target variable
        domains: Current domains
        assignment: Current partial assignment
        is_consistent: Constraint checking function

    Returns:
        Tuple of (domain_changed_boolean, list_of_pruned_values)
    """
    revised = False
    pruned_values = []
    
    domain_xi = list(domains[xi]) # copy to iterate safely
    domain_xj = domains[xj]
    
    for x_val in domain_xi:
        assignment[xi] = x_val
        
        # Check if there exists AT LEAST ONE y_val that works
        found_support = False
        for y_val in domain_xj:
            assignment[xj] = y_val
            if is_consistent(assignment):
                found_support = True
                del assignment[xj]
                break
            del assignment[xj]
            
        del assignment[xi]
        
        if not found_support:
            domains[xi].remove(x_val)
            pruned_values.append(x_val)
            revised = True
            
    return revised, pruned_values


def ac3(
    variables: List[str],
    domains: Dict[str, List[Any]],
    assignment: Dict[str, Any],
    is_consistent: Callable[[Dict[str, Any]], bool],
    arcs: Optional[List[Tuple[str, str]]] = None,
) -> Tuple[bool, Dict[str, List[Any]]]:
    """Execute the AC-3 arc consistency algorithm.

    Maintains a queue of arcs to check. If an arc (Xi, Xj) causes
    Xi's domain to shrink, all arcs pointing to Xi must be re-checked.

    Args:
        variables: All variables in the CSP
        domains: Current domains
        assignment: Current partial assignment
        is_consistent: Constraint checking function
        arcs: Initial queue of arcs (defaults to all pairs)

    Returns:
        Tuple of (success_boolean, dict_of_all_pruned_values).
        Success is False if any domain becomes empty (unsolvable).
    """
    pruned_total: Dict[str, List[Any]] = {v: [] for v in variables}
    
    # If no arcs provided, initialize with all possible pairs (complete graph)
    if arcs is None:
        arcs = []
        for i, vi in enumerate(variables):
            for vj in variables:
                if vi != vj:
                    arcs.append((vi, vj))
                    
    queue = deque(arcs)
    
    while queue:
        xi, xj = queue.popleft()
        
        revised, pruned = revise(xi, xj, domains, assignment, is_consistent)
        
        if revised:
            pruned_total[xi].extend(pruned)
            
            # Domain wipeout
            if not domains[xi]:
                return False, pruned_total
                
            # Domain changed, so add all neighbors of xi (except xj) back to queue
            for xk in variables:
                if xk != xi and xk != xj:
                    if (xk, xi) not in queue:
                        queue.append((xk, xi))
                        
    return True, pruned_total


def maintain_arc_consistency(
    var: str,
    variables: List[str],
    domains: Dict[str, List[Any]],
    assignment: Dict[str, Any],
    is_consistent: Callable[[Dict[str, Any]], bool],
) -> Tuple[bool, Dict[str, List[Any]]]:
    """MAC (Maintaining Arc Consistency) during search.
    
    Called after assigning a value to `var`. Runs AC-3 initialized
    with only the arcs pointing to `var`.
    
    Args:
        var: The newly assigned variable
        variables: All variables
        domains: Current domains
        assignment: Current assignment
        is_consistent: Constraint checking function
        
    Returns:
        Same as ac3()
    """
    # Only need to check neighbors of the newly assigned variable
    initial_arcs = [(xk, var) for xk in variables if xk != var and xk not in assignment]
    return ac3(variables, domains, assignment, is_consistent, initial_arcs)
