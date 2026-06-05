"""Adversarial search algorithms for game-playing AI.

Implements:
- Minimax algorithm (full tree exploration)
- Alpha-Beta pruning (optimized branch elimination)
- Tic-Tac-Toe game engine with AI opponent
"""
from .minimax import solve_minimax, solve_tic_tac_toe

__all__ = ['solve_minimax', 'solve_tic_tac_toe']
