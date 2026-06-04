import time
import heapq
from collections import deque

def build_metrics(start_time, nodes_expanded, peak_frontier, path_cost, total_ops, non_leaf_nodes, time_complexity, space_complexity):
    end_time = time.time()
    execution_ms = (end_time - start_time) * 1000
    branching_factor = (total_ops / non_leaf_nodes) if non_leaf_nodes > 0 else 0
    return {
        "executionMs": execution_ms,
        "nodesExpanded": nodes_expanded,
        "peakFrontier": peak_frontier,
        "pathCost": path_cost,
        "branchingFactor": branching_factor,
        "totalOps": total_ops,
        "timeComplexity": time_complexity,
        "spaceComplexity": space_complexity
    }

def build_step(step_idx, node, action, reason, frontier, visited, path):
    return {
        "step": step_idx,
        "node": node,
        "action": action,
        "reason": reason,
        "frontier": frontier,
        "visited": visited,
        "path": path
    }

def reconstruct_path(came_from, current):
    path = [current]
    while current in came_from:
        current = came_from[current]
        path.append(current)
    path.reverse()
    return path

def bfs(adjacency, start, goal):
    start_time = time.time()
    queue = deque([(start, [start], 0)])
    visited = set()
    visited_order = []
    steps = []
    step_idx = 1
    
    nodes_expanded = 0
    peak_frontier = 1
    total_ops = 0
    non_leaf_nodes = 0
    
    steps.append(build_step(step_idx, start, "Initialized BFS", "Added start node to queue", [{"id": start}], [], []))
    step_idx += 1

    while queue:
        peak_frontier = max(peak_frontier, len(queue))
        current, path, cost = queue.popleft()
        total_ops += 1
        
        if current in visited:
            continue
            
        visited.add(current)
        visited_order.append(current)
        nodes_expanded += 1
        
        steps.append(build_step(step_idx, current, f"Expanded {current}", "First in queue (FIFO)", [{"id": n[0]} for n in queue], list(visited), path))
        step_idx += 1

        if current == goal:
            metrics = build_metrics(start_time, nodes_expanded, peak_frontier, cost, total_ops, non_leaf_nodes, "O(V + E)", "O(V)")
            return {"algorithm": "BFS", "path": path, "visitedOrder": visited_order, "steps": steps, "metrics": metrics}

        neighbors = adjacency.get(current, {})
        if neighbors:
            non_leaf_nodes += 1
            
        for neighbor, weight in neighbors.items():
            total_ops += 1
            if neighbor not in visited:
                queue.append((neighbor, path + [neighbor], cost + weight))
                steps.append(build_step(step_idx, neighbor, f"Generated {neighbor}", f"Neighbor of {current}", [{"id": n[0]} for n in queue], list(visited), path))
                step_idx += 1

    metrics = build_metrics(start_time, nodes_expanded, peak_frontier, 0, total_ops, non_leaf_nodes, "O(V + E)", "O(V)")
    return {"algorithm": "BFS", "path": [], "visitedOrder": visited_order, "steps": steps, "metrics": metrics}

def dfs(adjacency, start, goal):
    start_time = time.time()
    stack = [(start, [start], 0)]
    visited = set()
    visited_order = []
    steps = []
    step_idx = 1
    
    nodes_expanded = 0
    peak_frontier = 1
    total_ops = 0
    non_leaf_nodes = 0
    
    steps.append(build_step(step_idx, start, "Initialized DFS", "Added start node to stack", [{"id": start}], [], []))
    step_idx += 1

    while stack:
        peak_frontier = max(peak_frontier, len(stack))
        current, path, cost = stack.pop()
        total_ops += 1
        
        if current in visited:
            continue
            
        visited.add(current)
        visited_order.append(current)
        nodes_expanded += 1
        
        steps.append(build_step(step_idx, current, f"Expanded {current}", "Deepest node in stack (LIFO)", [{"id": n[0]} for n in stack], list(visited), path))
        step_idx += 1

        if current == goal:
            metrics = build_metrics(start_time, nodes_expanded, peak_frontier, cost, total_ops, non_leaf_nodes, "O(V + E)", "O(V)")
            return {"algorithm": "DFS", "path": path, "visitedOrder": visited_order, "steps": steps, "metrics": metrics}

        neighbors = adjacency.get(current, {})
        if neighbors:
            non_leaf_nodes += 1
            
        # Reverse to visit in alphabetical order for typical stack behavior matching left-to-right trees
        for neighbor, weight in sorted(neighbors.items(), reverse=True):
            total_ops += 1
            if neighbor not in visited:
                stack.append((neighbor, path + [neighbor], cost + weight))
                steps.append(build_step(step_idx, neighbor, f"Generated {neighbor}", f"Neighbor of {current}", [{"id": n[0]} for n in stack], list(visited), path))
                step_idx += 1

    metrics = build_metrics(start_time, nodes_expanded, peak_frontier, 0, total_ops, non_leaf_nodes, "O(V + E)", "O(V)")
    return {"algorithm": "DFS", "path": [], "visitedOrder": visited_order, "steps": steps, "metrics": metrics}

def ucs(adjacency, start, goal):
    start_time = time.time()
    # pq stores (cost, current_node, path)
    pq = [(0, start, [start])]
    visited = set()
    visited_order = []
    steps = []
    step_idx = 1
    
    nodes_expanded = 0
    peak_frontier = 1
    total_ops = 0
    non_leaf_nodes = 0
    
    steps.append(build_step(step_idx, start, "Initialized UCS", "Added start node", [{"id": start, "g": 0}], [], []))
    step_idx += 1

    while pq:
        peak_frontier = max(peak_frontier, len(pq))
        cost, current, path = heapq.heappop(pq)
        total_ops += 1
        
        if current in visited:
            continue
            
        visited.add(current)
        visited_order.append(current)
        nodes_expanded += 1
        
        steps.append(build_step(step_idx, current, f"Expanded {current}", f"Lowest path cost g={cost}", [{"id": n[1], "g": n[0]} for n in pq], list(visited), path))
        step_idx += 1

        if current == goal:
            metrics = build_metrics(start_time, nodes_expanded, peak_frontier, cost, total_ops, non_leaf_nodes, "O(V^2)", "O(V)")
            return {"algorithm": "UCS", "path": path, "visitedOrder": visited_order, "steps": steps, "metrics": metrics}

        neighbors = adjacency.get(current, {})
        if neighbors:
            non_leaf_nodes += 1
            
        for neighbor, weight in neighbors.items():
            total_ops += 1
            if neighbor not in visited:
                heapq.heappush(pq, (cost + weight, neighbor, path + [neighbor]))
                steps.append(build_step(step_idx, neighbor, f"Generated {neighbor}", f"Cost g={cost+weight}", [{"id": n[1], "g": n[0]} for n in pq], list(visited), path))
                step_idx += 1

    metrics = build_metrics(start_time, nodes_expanded, peak_frontier, 0, total_ops, non_leaf_nodes, "O(V^2)", "O(V)")
    return {"algorithm": "UCS", "path": [], "visitedOrder": visited_order, "steps": steps, "metrics": metrics}

def gbfs(adjacency, start, goal, heuristic):
    start_time = time.time()
    # pq stores (h_cost, current_node, path, g_cost)
    h_start = heuristic.get(start, 0)
    pq = [(h_start, start, [start], 0)]
    visited = set()
    visited_order = []
    steps = []
    step_idx = 1
    
    nodes_expanded = 0
    peak_frontier = 1
    total_ops = 0
    non_leaf_nodes = 0
    
    steps.append(build_step(step_idx, start, "Initialized GBFS", f"h({start})={h_start}", [{"id": start, "h": h_start}], [], []))
    step_idx += 1

    while pq:
        peak_frontier = max(peak_frontier, len(pq))
        h_cost, current, path, g_cost = heapq.heappop(pq)
        total_ops += 1
        
        if current in visited:
            continue
            
        visited.add(current)
        visited_order.append(current)
        nodes_expanded += 1
        
        steps.append(build_step(step_idx, current, f"Expanded {current}", f"Lowest h(n)={h_cost}", [{"id": n[1], "h": n[0]} for n in pq], list(visited), path))
        step_idx += 1

        if current == goal:
            metrics = build_metrics(start_time, nodes_expanded, peak_frontier, g_cost, total_ops, non_leaf_nodes, "O(V^2)", "O(V)")
            return {"algorithm": "GBFS", "path": path, "visitedOrder": visited_order, "steps": steps, "metrics": metrics}

        neighbors = adjacency.get(current, {})
        if neighbors:
            non_leaf_nodes += 1
            
        for neighbor, weight in neighbors.items():
            total_ops += 1
            if neighbor not in visited:
                h_n = heuristic.get(neighbor, 0)
                heapq.heappush(pq, (h_n, neighbor, path + [neighbor], g_cost + weight))
                steps.append(build_step(step_idx, neighbor, f"Generated {neighbor}", f"h(n)={h_n}", [{"id": n[1], "h": n[0]} for n in pq], list(visited), path))
                step_idx += 1

    metrics = build_metrics(start_time, nodes_expanded, peak_frontier, 0, total_ops, non_leaf_nodes, "O(V^2)", "O(V)")
    return {"algorithm": "GBFS", "path": [], "visitedOrder": visited_order, "steps": steps, "metrics": metrics}

def astar(adjacency, start, goal, heuristic):
    start_time = time.time()
    # pq stores (f_cost, current_node, path, g_cost)
    g_start = 0
    h_start = heuristic.get(start, 0)
    f_start = g_start + h_start
    pq = [(f_start, start, [start], g_start)]
    
    # Track lowest g_score for each node to prune correctly
    g_scores = {start: 0}
    
    visited = set()
    visited_order = []
    steps = []
    step_idx = 1
    
    nodes_expanded = 0
    peak_frontier = 1
    total_ops = 0
    non_leaf_nodes = 0
    
    steps.append(build_step(step_idx, start, "Initialized A*", f"f={f_start} (g=0, h={h_start})", [{"id": start, "f": f_start, "g": 0, "h": h_start}], [], []))
    step_idx += 1

    while pq:
        peak_frontier = max(peak_frontier, len(pq))
        f_cost, current, path, g_cost = heapq.heappop(pq)
        total_ops += 1
        
        if current in visited:
            continue
            
        visited.add(current)
        visited_order.append(current)
        nodes_expanded += 1
        
        steps.append(build_step(step_idx, current, f"Expanded {current}", f"Lowest f(n)={f_cost}", [{"id": n[1], "f": n[0]} for n in pq], list(visited), path))
        step_idx += 1

        if current == goal:
            metrics = build_metrics(start_time, nodes_expanded, peak_frontier, g_cost, total_ops, non_leaf_nodes, "O(V^2)", "O(V)")
            return {"algorithm": "A*", "path": path, "visitedOrder": visited_order, "steps": steps, "metrics": metrics}

        neighbors = adjacency.get(current, {})
        if neighbors:
            non_leaf_nodes += 1
            
        for neighbor, weight in neighbors.items():
            total_ops += 1
            tentative_g = g_cost + weight
            if neighbor not in g_scores or tentative_g < g_scores[neighbor]:
                g_scores[neighbor] = tentative_g
                h_n = heuristic.get(neighbor, 0)
                f_n = tentative_g + h_n
                heapq.heappush(pq, (f_n, neighbor, path + [neighbor], tentative_g))
                steps.append(build_step(step_idx, neighbor, f"Generated {neighbor}", f"f={f_n} (g={tentative_g}, h={h_n})", [{"id": n[1], "f": n[0]} for n in pq], list(visited), path))
                step_idx += 1

    metrics = build_metrics(start_time, nodes_expanded, peak_frontier, 0, total_ops, non_leaf_nodes, "O(V^2)", "O(V)")
    return {"algorithm": "A*", "path": [], "visitedOrder": visited_order, "steps": steps, "metrics": metrics}

def dijkstra(adjacency, start, goal):
    res = ucs(adjacency, start, goal)
    res["algorithm"] = "Dijkstra"
    return res

def iddfs(adjacency, start, goal):
    start_time = time.time()
    visited_order = []
    steps = []
    step_idx = 1
    
    nodes_expanded = 0
    peak_frontier = 1
    total_ops = 0
    non_leaf_nodes = 0
    
    for depth_limit in range(100): # max depth safeguard
        stack = [(start, [start], 0, 0)] # node, path, cost, depth
        visited = set()
        
        steps.append(build_step(step_idx, start, f"IDDFS Depth {depth_limit}", f"Starting iteration limit={depth_limit}", [], list(visited), []))
        step_idx += 1
        
        while stack:
            peak_frontier = max(peak_frontier, len(stack))
            current, path, cost, depth = stack.pop()
            total_ops += 1
            
            # Simple visited check for same depth limit (not ideal for IDDFS correctness but matches simple logic)
            if current in visited:
                continue
            
            visited.add(current)
            if current not in visited_order:
                visited_order.append(current)
            nodes_expanded += 1
            
            steps.append(build_step(step_idx, current, f"Expanded {current}", f"Depth {depth} <= {depth_limit}", [{"id": n[0]} for n in stack], list(visited), path))
            step_idx += 1
            
            if current == goal:
                metrics = build_metrics(start_time, nodes_expanded, peak_frontier, cost, total_ops, non_leaf_nodes, "O(b^d)", "O(d)")
                return {"algorithm": "IDDFS", "path": path, "visitedOrder": visited_order, "steps": steps, "metrics": metrics}
                
            if depth < depth_limit:
                neighbors = adjacency.get(current, {})
                if neighbors:
                    non_leaf_nodes += 1
                for neighbor, weight in sorted(neighbors.items(), reverse=True):
                    total_ops += 1
                    if neighbor not in visited:
                        stack.append((neighbor, path + [neighbor], cost + weight, depth + 1))
                        steps.append(build_step(step_idx, neighbor, f"Generated {neighbor}", f"Neighbor of {current}", [{"id": n[0]} for n in stack], list(visited), path))
                        step_idx += 1

    metrics = build_metrics(start_time, nodes_expanded, peak_frontier, 0, total_ops, non_leaf_nodes, "O(b^d)", "O(d)")
    return {"algorithm": "IDDFS", "path": [], "visitedOrder": visited_order, "steps": steps, "metrics": metrics}

def ida_star(adjacency, start, goal, heuristic):
    start_time = time.time()
    h_start = heuristic.get(start, 0)
    threshold = h_start
    
    visited_order = []
    steps = []
    step_idx = 1
    
    nodes_expanded = 0
    peak_frontier = 1
    total_ops = 0
    non_leaf_nodes = 0
    
    while True:
        stack = [(start, [start], 0)] # node, path, g_cost
        visited = set()
        min_over_threshold = float('inf')
        found = False
        res_path = []
        res_cost = 0
        
        steps.append(build_step(step_idx, start, f"IDA* Threshold {threshold}", "Starting iteration", [], list(visited), []))
        step_idx += 1
        
        while stack:
            peak_frontier = max(peak_frontier, len(stack))
            current, path, g_cost = stack.pop()
            total_ops += 1
            
            if current in visited:
                continue
                
            f_cost = g_cost + heuristic.get(current, 0)
            
            if f_cost > threshold:
                min_over_threshold = min(min_over_threshold, f_cost)
                steps.append(build_step(step_idx, current, f"Pruned {current}", f"f({f_cost}) > threshold({threshold})", [{"id": n[0]} for n in stack], list(visited), path))
                step_idx += 1
                continue
                
            visited.add(current)
            if current not in visited_order:
                visited_order.append(current)
            nodes_expanded += 1
            
            steps.append(build_step(step_idx, current, f"Expanded {current}", f"f({f_cost}) <= threshold", [{"id": n[0]} for n in stack], list(visited), path))
            step_idx += 1
            
            if current == goal:
                found = True
                res_path = path
                res_cost = g_cost
                break
                
            neighbors = adjacency.get(current, {})
            if neighbors:
                non_leaf_nodes += 1
            for neighbor, weight in sorted(neighbors.items(), reverse=True):
                total_ops += 1
                if neighbor not in visited:
                    stack.append((neighbor, path + [neighbor], g_cost + weight))
                    
        if found:
            metrics = build_metrics(start_time, nodes_expanded, peak_frontier, res_cost, total_ops, non_leaf_nodes, "O(b^d)", "O(d)")
            return {"algorithm": "IDA*", "path": res_path, "visitedOrder": visited_order, "steps": steps, "metrics": metrics}
            
        if min_over_threshold == float('inf'):
            break
            
        threshold = min_over_threshold

    metrics = build_metrics(start_time, nodes_expanded, peak_frontier, 0, total_ops, non_leaf_nodes, "O(b^d)", "O(d)")
    return {"algorithm": "IDA*", "path": [], "visitedOrder": visited_order, "steps": steps, "metrics": metrics}
