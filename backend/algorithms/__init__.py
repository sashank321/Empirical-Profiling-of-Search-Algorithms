"""Search algorithm implementations for CORTEX AI.

Contains 8 graph search algorithms: BFS, DFS, UCS, GBFS, A*, Dijkstra, IDDFS, IDA*.
Each algorithm returns step-by-step execution traces for visualization.
"""
from .search import bfs, dfs, ucs, gbfs, astar, dijkstra, iddfs, ida_star

__all__ = ['bfs', 'dfs', 'ucs', 'gbfs', 'astar', 'dijkstra', 'iddfs', 'ida_star']
