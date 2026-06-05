import time
import copy

def build_csp_step(step_idx, variable, value, action, reason, domains, assignments):
    return {
        "step": step_idx,
        "variable": variable,
        "value": value,
        "action": action,
        "reason": reason,
        "domains": {k: list(v) for k, v in domains.items()},
        "assignments": dict(assignments)
    }

class CSP:
    def __init__(self, variables, domains, constraints):
        self.variables = variables
        self.domains = domains
        self.constraints = constraints

    def is_consistent(self, var, value, assignment):
        test_assignment = dict(assignment)
        test_assignment[var] = value
        for check in self.constraints:
            res = check(test_assignment)
            if not res.get("satisfied", True):
                return False, res.get("violated", "Constraint violated")
        return True, ""

def solve_csp_backtracking(variables, domains, constraints, options=None):
    start_time = time.time()
    options = options or {}
    use_fc = options.get("useForwardChecking", False)
    use_mrv = options.get("useMRV", False)
    use_lcv = options.get("useLCV", False)
    use_ac3 = options.get("useAC3", False)
    
    csp = CSP(variables, domains, constraints)
    assignments = {}
    steps = []
    step_idx = [1]
    metrics = {"backtracks": 0, "nodesExplored": 0, "constraintChecks": 0, "executionMs": 0}
    
    steps.append(build_csp_step(step_idx[0], "Init", "None", "consistent", "Started CSP solver", domains, assignments))
    step_idx[0] += 1

    def select_unassigned_variable(assignment, current_domains):
        unassigned = [v for v in csp.variables if v not in assignment]
        if use_mrv:
            unassigned.sort(key=lambda v: len(current_domains[v]))
        return unassigned[0]

    def order_domain_values(var, assignment, current_domains):
        values = current_domains[var]
        if use_lcv:
            # Sort by least constraining value (simplified: fewer conflicts in remaining variables)
            def count_conflicts(val):
                conflicts = 0
                test_assign = dict(assignment)
                test_assign[var] = val
                for unassigned_var in [v for v in csp.variables if v not in test_assign]:
                    for unassigned_val in current_domains[unassigned_var]:
                        test2 = dict(test_assign)
                        test2[unassigned_var] = unassigned_val
                        # Check all constraints
                        valid = True
                        for check in csp.constraints:
                            metrics["constraintChecks"] += 1
                            if not check(test2).get("satisfied", True):
                                valid = False
                                break
                        if not valid:
                            conflicts += 1
                return conflicts
            return sorted(values, key=count_conflicts)
        return values

    def forward_check(var, value, assignment, current_domains):
        new_domains = copy.deepcopy(current_domains)
        new_domains[var] = [value]
        for unassigned_var in [v for v in csp.variables if v not in assignment and v != var]:
            valid_vals = []
            for unassigned_val in new_domains[unassigned_var]:
                test_assign = dict(assignment)
                test_assign[var] = value
                test_assign[unassigned_var] = unassigned_val
                valid = True
                for check in csp.constraints:
                    metrics["constraintChecks"] += 1
                    if not check(test_assign).get("satisfied", True):
                        valid = False
                        break
                if valid:
                    valid_vals.append(unassigned_val)
                else:
                    steps.append(build_csp_step(step_idx[0], unassigned_var, unassigned_val, "prune", f"Forward checking conflict with {var}={value}", new_domains, assignment))
                    step_idx[0] += 1
            new_domains[unassigned_var] = valid_vals
            if not valid_vals:
                return False, new_domains
        return True, new_domains

    def backtrack(assignment, current_domains):
        if len(assignment) == len(csp.variables):
            return assignment

        var = select_unassigned_variable(assignment, current_domains)
        for value in order_domain_values(var, assignment, current_domains):
            metrics["nodesExplored"] += 1
            is_valid, reason = csp.is_consistent(var, value, assignment)
            metrics["constraintChecks"] += len(csp.constraints)
            
            if is_valid:
                assignment[var] = value
                steps.append(build_csp_step(step_idx[0], var, value, "assign", f"Assigned {value} to {var}", current_domains, assignment))
                step_idx[0] += 1
                
                next_domains = current_domains
                fc_success = True
                if use_fc:
                    fc_success, next_domains = forward_check(var, value, assignment, current_domains)
                
                if fc_success:
                    result = backtrack(assignment, next_domains)
                    if result is not None:
                        return result
                        
                del assignment[var]
                metrics["backtracks"] += 1
                steps.append(build_csp_step(step_idx[0], var, value, "backtrack", f"Backtracked from {var}={value}", current_domains, assignment))
                step_idx[0] += 1
                
        return None

    solution = backtrack(assignments, copy.deepcopy(csp.domains))
    metrics["executionMs"] = (time.time() - start_time) * 1000
    return {
        "algorithm": "CSP Solving",
        "solution": solution,
        "steps": steps,
        "metrics": metrics
    }

def create_n_queens(n):
    variables = [f"Q{i}" for i in range(n)]
    domains = {v: list(range(n)) for v in variables}
    
    def check_queens(assignment):
        # assignment is dict: "Q0" -> row_idx (col is implicit by 0)
        for i, vi in enumerate(variables):
            if vi not in assignment: continue
            for j, vj in enumerate(variables):
                if i >= j or vj not in assignment: continue
                r1, c1 = assignment[vi], i
                r2, c2 = assignment[vj], j
                if r1 == r2 or abs(r1 - r2) == abs(c1 - c2):
                    return {"satisfied": False, "violated": f"{vi} and {vj} attack each other"}
        return {"satisfied": True}
        
        
    return variables, domains, [check_queens]

def create_graph_coloring(nodes, edges, n_colors):
    variables = nodes
    domains = {v: list(range(n_colors)) for v in variables}
    
    def check_edges(assignment):
        for u, v in edges:
            if u in assignment and v in assignment:
                if assignment[u] == assignment[v]:
                    return {"satisfied": False, "violated": f"{u} and {v} have the same color"}
        return {"satisfied": True}
        
    return variables, domains, [check_edges]

def create_timetabling():
    courses = ["CS101", "CS102", "MA101", "PH101", "EE101"]
    timeslots = ["T1", "T2", "T3"]
    rooms = ["R1", "R2"]
    
    variables = courses
    # Domain is (timeslot, room) index or combination.
    domain_values = [f"{t}-{r}" for t in timeslots for r in rooms]
    domains = {c: list(domain_values) for c in courses}
    
    # Conflict: No two courses in the same room at the same time.
    def check_conflicts(assignment):
        seen = {}
        for c, val in assignment.items():
            if val in seen:
                return {"satisfied": False, "violated": f"{c} and {seen[val]} in same room/time"}
            seen[val] = c
        return {"satisfied": True}
        
    return variables, domains, [check_conflicts]

def create_cryptarithmetic():
    # SEND + MORE = MONEY
    variables = ['S', 'E', 'N', 'D', 'M', 'O', 'R', 'Y']
    domains = {v: list(range(10)) for v in variables}
    # S and M cannot be 0
    domains['S'] = list(range(1, 10))
    domains['M'] = list(range(1, 10))
    
    def check_crypto(assignment):
        # All-diff constraint
        vals = list(assignment.values())
        if len(vals) != len(set(vals)):
            return {"satisfied": False, "violated": "Alldiff violated"}
            
        # Equation constraint if all assigned
        if len(assignment) == len(variables):
            send = assignment['S']*1000 + assignment['E']*100 + assignment['N']*10 + assignment['D']
            more = assignment['M']*1000 + assignment['O']*100 + assignment['R']*10 + assignment['E']
            money = assignment['M']*10000 + assignment['O']*1000 + assignment['N']*100 + assignment['E']*10 + assignment['Y']
            if send + more != money:
                return {"satisfied": False, "violated": "SEND + MORE != MONEY"}
                
        return {"satisfied": True}
        
    return variables, domains, [check_crypto]
