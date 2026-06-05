"""Graph generation utilities for CORTEX AI.

Provides various graph topologies for algorithm testing and benchmarking:
- Random graphs (Erdős–Rényi model)
- Connected random graphs
- Grid, tree, and complete graphs
- Predefined benchmark graphs

Author: CORTEX AI Engine
"""

import random
from typing import Dict, List, Optional, Tuple


def random_graph(
    n_nodes: int,
    edge_probability: float = 0.3,
    weight_range: Tuple[int, int] = (1, 10),
    seed: Optional[int] = None,
) -> Dict[str, Dict[str, float]]:
    """Generate a random graph using the Erdős–Rényi model.

    Each possible edge is included independently with given probability.
    Edge weights are randomly assigned from the specified range.

    Args:
        n_nodes: Number of nodes (labeled A, B, C, ...)
        edge_probability: Probability of each edge existing (0 to 1)
        weight_range: Tuple (min_weight, max_weight) for random weights
        seed: Optional random seed for reproducibility

    Returns:
        Adjacency list as {node: {neighbor: weight, ...}, ...}
    """
    if seed is not None:
        random.seed(seed)

    nodes = [chr(65 + i) for i in range(min(n_nodes, 26))]
    adjacency: Dict[str, Dict[str, float]] = {n: {} for n in nodes}

    for i, u in enumerate(nodes):
        for j, v in enumerate(nodes):
            if i < j and random.random() < edge_probability:
                w = random.randint(weight_range[0], weight_range[1])
                adjacency[u][v] = w
                adjacency[v][u] = w

    return adjacency


def random_connected_graph(
    n_nodes: int,
    extra_edges: int = 0,
    weight_range: Tuple[int, int] = (1, 10),
    seed: Optional[int] = None,
) -> Dict[str, Dict[str, float]]:
    """Generate a random connected graph.

    First creates a spanning tree to ensure connectivity, then adds
    additional random edges to increase density.

    Args:
        n_nodes: Number of nodes
        extra_edges: Number of additional edges beyond the spanning tree
        weight_range: Tuple (min_weight, max_weight) for random weights
        seed: Optional random seed for reproducibility

    Returns:
        Adjacency list guaranteed to be connected
    """
    if seed is not None:
        random.seed(seed)

    nodes = [chr(65 + i) for i in range(min(n_nodes, 26))]
    adjacency: Dict[str, Dict[str, float]] = {n: {} for n in nodes}

    # Create spanning tree (random permutation, connect consecutive)
    shuffled = list(nodes)
    random.shuffle(shuffled)

    for i in range(len(shuffled) - 1):
        u, v = shuffled[i], shuffled[i + 1]
        w = random.randint(weight_range[0], weight_range[1])
        adjacency[u][v] = w
        adjacency[v][u] = w

    # Add extra random edges
    added = 0
    attempts = 0
    max_attempts = extra_edges * 10

    while added < extra_edges and attempts < max_attempts:
        u = random.choice(nodes)
        v = random.choice(nodes)
        if u != v and v not in adjacency[u]:
            w = random.randint(weight_range[0], weight_range[1])
            adjacency[u][v] = w
            adjacency[v][u] = w
            added += 1
        attempts += 1

    return adjacency


def grid_graph(
    rows: int,
    cols: int,
    weight_range: Tuple[int, int] = (1, 5),
) -> Dict[str, Dict[str, float]]:
    """Generate a grid graph with 4-connectivity.

    Nodes are labeled as "R{row}C{col}" and connected to their
    horizontal and vertical neighbors.

    Args:
        rows: Number of rows
        cols: Number of columns
        weight_range: Tuple (min_weight, max_weight)

    Returns:
        Adjacency list for grid graph
    """
    adjacency: Dict[str, Dict[str, float]] = {}

    for r in range(rows):
        for c in range(cols):
            node = f"R{r}C{c}"
            adjacency[node] = {}

            # Right neighbor
            if c < cols - 1:
                neighbor = f"R{r}C{c+1}"
                w = random.randint(weight_range[0], weight_range[1])
                adjacency[node][neighbor] = w

            # Down neighbor
            if r < rows - 1:
                neighbor = f"R{r+1}C{c}"
                w = random.randint(weight_range[0], weight_range[1])
                adjacency[node][neighbor] = w

    # Make undirected
    for u in list(adjacency.keys()):
        for v, w in list(adjacency.get(u, {}).items()):
            if v not in adjacency:
                adjacency[v] = {}
            adjacency[v][u] = w

    return adjacency


def tree_graph(
    n_nodes: int,
    branching_factor: int = 2,
    weight_range: Tuple[int, int] = (1, 8),
) -> Dict[str, Dict[str, float]]:
    """Generate a random tree graph.

    Creates a tree by assigning each new node a random parent
    from existing nodes, respecting the maximum branching factor.

    Args:
        n_nodes: Number of nodes
        branching_factor: Maximum children per node
        weight_range: Tuple (min_weight, max_weight)

    Returns:
        Adjacency list for tree graph
    """
    nodes = [chr(65 + i) for i in range(min(n_nodes, 26))]
    adjacency: Dict[str, Dict[str, float]] = {n: {} for n in nodes}
    child_count: Dict[str, int] = {n: 0 for n in nodes}

    for i in range(1, len(nodes)):
        # Find a valid parent (not at max children)
        candidates = [
            nodes[j] for j in range(i)
            if child_count[nodes[j]] < branching_factor
        ]
        if not candidates:
            candidates = nodes[:i]

        parent = random.choice(candidates)
        w = random.randint(weight_range[0], weight_range[1])
        adjacency[parent][nodes[i]] = w
        adjacency[nodes[i]][parent] = w
        child_count[parent] += 1

    return adjacency


def complete_graph(
    n_nodes: int,
    weight_range: Tuple[int, int] = (1, 10),
) -> Dict[str, Dict[str, float]]:
    """Generate a complete (fully connected) graph.

    Every pair of nodes is connected. Total edges = n*(n-1)/2.

    Args:
        n_nodes: Number of nodes
        weight_range: Tuple (min_weight, max_weight)

    Returns:
        Adjacency list for complete graph
    """
    nodes = [chr(65 + i) for i in range(min(n_nodes, 26))]
    adjacency: Dict[str, Dict[str, float]] = {n: {} for n in nodes}

    for i, u in enumerate(nodes):
        for j, v in enumerate(nodes):
            if i < j:
                w = random.randint(weight_range[0], weight_range[1])
                adjacency[u][v] = w
                adjacency[v][u] = w

    return adjacency


def predefined_graph(name: str = 'default_10') -> Dict:
    """Get a predefined benchmark graph by name.

    Args:
        name: Graph name ('default_10', 'maze_15', 'dense_20')

    Returns:
        Dictionary with adjacency list, positions, and metadata
    """
    graphs = {
        'default_10': {
            'adjacency': {
                'A': {'B': 4, 'C': 2},
                'B': {'A': 4, 'D': 5, 'E': 10},
                'C': {'A': 2, 'D': 8, 'F': 3},
                'D': {'B': 5, 'C': 8, 'G': 2},
                'E': {'B': 10, 'G': 6, 'H': 1},
                'F': {'C': 3, 'I': 7},
                'G': {'D': 2, 'E': 6, 'J': 4},
                'H': {'E': 1, 'J': 3},
                'I': {'F': 7, 'J': 8},
                'J': {'G': 4, 'H': 3, 'I': 8},
            },
            'positions': {
                'A': (10, 30), 'B': (30, 10), 'C': (30, 50),
                'D': (50, 30), 'E': (70, 10), 'F': (30, 70),
                'G': (70, 30), 'H': (90, 10), 'I': (50, 80),
                'J': (90, 50),
            },
            'description': 'Standard 10-node benchmark graph',
        },
    }

    return graphs.get(name, graphs['default_10'])


def generate_heuristic(
    positions: Dict[str, Tuple[float, float]],
    goal: str,
) -> Dict[str, float]:
    """Generate Euclidean distance heuristic from node positions.

    Args:
        positions: Node positions as {node: (x, y), ...}
        goal: Target node

    Returns:
        Heuristic values as {node: euclidean_distance_to_goal, ...}
    """
    goal_pos = positions.get(goal, (0, 0))
    heuristic: Dict[str, float] = {}

    for node, (x, y) in positions.items():
        dx = x - goal_pos[0]
        dy = y - goal_pos[1]
        heuristic[node] = round((dx * dx + dy * dy) ** 0.5, 2)

    return heuristic


def validate_graph(adjacency: Dict[str, Dict[str, float]]) -> Dict[str, any]:
    """Validate a graph and return structural properties.

    Args:
        adjacency: Adjacency list to validate

    Returns:
        Dictionary with validation results and graph properties
    """
    nodes = set(adjacency.keys())
    edges = 0
    is_undirected = True
    has_negative_weights = False
    max_weight = 0
    min_weight = float('inf')

    for u, neighbors in adjacency.items():
        for v, w in neighbors.items():
            edges += 1
            if w < 0:
                has_negative_weights = True
            max_weight = max(max_weight, w)
            min_weight = min(min_weight, w)

            # Check if reverse edge exists with same weight
            if u not in adjacency.get(v, {}):
                is_undirected = False
            elif adjacency[v].get(u) != w:
                is_undirected = False

    return {
        'valid': True,
        'num_nodes': len(nodes),
        'num_edges': edges // 2 if is_undirected else edges,
        'is_undirected': is_undirected,
        'has_negative_weights': has_negative_weights,
        'weight_range': (min_weight, max_weight) if edges > 0 else (0, 0),
        'density': round(edges / max(1, len(nodes) * (len(nodes) - 1)), 4),
    }
