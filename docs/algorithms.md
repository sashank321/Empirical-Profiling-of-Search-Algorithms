# Algorithm Reference

This document outlines the core algorithms implemented in Cortex AI.

## Execution Environments
All algorithms have **two implementations**:
1. **Python Backend (Primary)**: Executed via Flask API for robust performance and decoupled architecture.
2. **TypeScript Frontend (Fallback)**: Executed locally in the browser if the backend is unreachable.

## 1. Search Intelligence Lab
These algorithms navigate graph structures to find paths from a start node to a goal node.
- **BFS (Breadth-First Search)**: Explores level-by-level. Optimal for unweighted graphs.
- **DFS (Depth-First Search)**: Explores as far as possible along each branch before backtracking.
- **UCS (Uniform Cost Search)**: Explores the lowest-cost paths first. Optimal for weighted graphs.
- **GBFS (Greedy Best-First Search)**: Uses a heuristic to aggressively move toward the goal. Not guaranteed optimal.
- **A* Search**: Combines UCS and GBFS (`f(n) = g(n) + h(n)`). Optimal if heuristic is admissible.
- **Dijkstra's Algorithm**: Finds the shortest path from a source to all other nodes.
- **IDDFS (Iterative Deepening DFS)**: Combines the space-efficiency of DFS with the completeness of BFS.
- **IDA* (Iterative Deepening A*)**: A* variant that uses depth limits based on the `f`-cost.

## 2. Constraint Intelligence Lab
Algorithms to solve Constraint Satisfaction Problems (CSPs).
- **Backtracking**: Brute-force search through the domain space.
- **Forward Checking**: Proactively removes invalid domain values from unassigned variables after an assignment.
- **MRV (Minimum Remaining Values)**: Variable ordering heuristic selecting the variable with the fewest legal values.
- **LCV (Least Constraining Value)**: Value ordering heuristic selecting the value that rules out the fewest choices for neighboring variables.
- **Arc Consistency (AC-3)**: Pre-processing step to eliminate domain values that can never be part of a consistent solution.

## 3. Decision Intelligence Lab
Adversarial search algorithms for two-player zero-sum games (e.g., Tic-Tac-Toe).
- **Minimax**: Exhaustively explores the game tree to minimize the possible loss for a worst-case scenario.
- **Alpha-Beta Pruning**: An optimization technique for Minimax that prunes branches that cannot influence the final decision.

## 4. Uncertainty Intelligence Lab
Algorithms dealing with probabilities and uncertain states.
- **Bayes Rule**: Fundamental theorem for updating probabilities based on new evidence.
- **Sensor Fusion**: Combining multiple sensor readings to infer the true state of the environment.
- **Bayesian Networks**: (Implementation specific to specific demo modes like Medical Diagnosis and Weather prediction).
