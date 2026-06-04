'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { runMinimax, runAlphaBeta, checkWinner, getAvailableMoves } from '@/lib/algorithms/minimax'
import type { MinimaxResult } from '@/lib/types'

type Cell = 'X' | 'O' | null
type Algo = 'minimax' | 'alphabeta'

export default function DecisionsPage() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null))
  const [algo, setAlgo] = useState<Algo>('alphabeta')
  const [result, setResult] = useState<MinimaxResult | null>(null)
  const [gameStatus, setGameStatus] = useState<string>('Your turn (O)')
  const [history, setHistory] = useState<{ board: Cell[]; move: string }[]>([])
  const [isThinking, setIsThinking] = useState(false)

  const reset = () => {
    setBoard(Array(9).fill(null))
    setResult(null)
    setGameStatus('Your turn (O)')
    setHistory([])
  }

  const aiMove = useCallback(async (b: Cell[]) => {
    try {
      const resp = await fetch('http://localhost:5000/api/decision/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: 'tic_tac_toe',
          board: b,
          useAlphaBeta: algo === 'alphabeta'
        })
      });
      const r = await resp.json();
      if (r.error) {
        console.error(r.error);
        return b;
      }
      setResult(r);
      if (!r.bestMove || r.bestMove === "Move→-1") return b;
      const idx = parseInt(r.bestMove.split('→')[1])
      const nb = [...b]; nb[idx] = 'X'
      setHistory(h => [...h, { board: nb, move: `AI plays X at ${idx}` }])
      return nb
    } catch (err) {
      console.error(err);
      return b;
    }
  }, [algo])

  const handleClick = async (i: number) => {
    if (board[i] || checkWinner(board) || isThinking) return
    const nb = [...board]; nb[i] = 'O'
    setHistory(h => [...h, { board: nb, move: `You play O at ${i}` }])

    const w1 = checkWinner(nb)
    if (w1) { setBoard(nb); setGameStatus(w1 === 'draw' ? 'Draw!' : `${w1} wins!`); return }
    if (getAvailableMoves(nb).length === 0) { setBoard(nb); setGameStatus('Draw!'); return }

    setBoard(nb)
    setGameStatus('AI is thinking...')
    setIsThinking(true)
    
    const afterAI = await aiMove(nb)
    
    const w2 = checkWinner(afterAI)
    if (w2) { setBoard(afterAI); setGameStatus(w2 === 'draw' ? 'Draw!' : `${w2} wins!`); setIsThinking(false); return }
    setBoard(afterAI)
    setGameStatus('Your turn (O)')
    setIsThinking(false)
  }

  const posLabel = (i: number) => ['TL','TC','TR','ML','MC','MR','BL','BC','BR'][i]

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      {/* Command Bar */}
      <header className="sticky top-0 z-50 h-14 bg-surface-0/80 backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)] flex items-center px-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-[0.2em]">CORTEX</span>
          <span className="text-sm text-text-secondary">AI</span>
        </div>
        <span className="absolute left-1/2 -translate-x-1/2 text-xs text-text-tertiary tracking-wider uppercase">Decision Intelligence Lab</span>
        <Link href="/" className="ml-auto flex items-center gap-1.5 text-text-secondary hover:text-white transition-colors text-xs"><ArrowLeft className="w-3.5 h-3.5" />Home</Link>
      </header>

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Left Panel */}
        <aside className="w-64 bg-surface-1 border-r border-[rgba(255,255,255,0.06)] p-5 flex flex-col gap-6 overflow-y-auto">
          <div>
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-3">Algorithm</p>
            {(['minimax','alphabeta'] as Algo[]).map(a => (
              <button key={a} onClick={() => { setAlgo(a); reset() }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm mb-1.5 transition-all duration-200 ${algo === a ? 'bg-surface-3 border border-[rgba(255,255,255,0.2)] text-white' : 'bg-surface-1 border border-transparent text-text-secondary hover:bg-surface-2'}`}>
                {a === 'minimax' ? 'Minimax' : 'Alpha-Beta Pruning'}
              </button>
            ))}
          </div>

          <button onClick={reset} className="flex items-center justify-center gap-2 bg-white text-black font-medium text-sm py-2.5 rounded-xl hover:bg-neutral-200 transition-all w-full">
            <RotateCcw className="w-3.5 h-3.5" /> Reset Game
          </button>

          <div className="mt-auto border-t border-[rgba(255,255,255,0.06)] pt-4 space-y-3">
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Game Stats</p>
            <div className="flex justify-between text-xs"><span className="text-text-secondary">Status</span><span className="text-white font-mono">{gameStatus}</span></div>
            {result && <>
              <div className="flex justify-between text-xs"><span className="text-text-secondary">Nodes Visited</span><span className="text-white font-mono">{result.nodesVisited}</span></div>
              <div className="flex justify-between text-xs"><span className="text-text-secondary">Nodes Pruned</span><span className="text-white font-mono">{result.nodesPruned}</span></div>
              <div className="flex justify-between text-xs"><span className="text-text-secondary">Eval Value</span><span className="text-white font-mono">{result.value}</span></div>
              <div className="flex justify-between text-xs"><span className="text-text-secondary">Time</span><span className="text-white font-mono">{result.executionMs.toFixed(2)}ms</span></div>
            </>}
          </div>
        </aside>

        {/* Center */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center gap-16 p-8">
            {/* Board */}
            <div className="flex flex-col items-center gap-4">
              <p className="text-xs text-text-tertiary uppercase tracking-wider">Interactive Board</p>
              <div className="grid grid-cols-3 gap-1 bg-surface-2 p-1 rounded-2xl">
                {board.map((cell, i) => (
                  <button key={i} onClick={() => handleClick(i)}
                    className={`w-24 h-24 flex items-center justify-center rounded-xl text-3xl font-light transition-all duration-200 ${
                      cell ? 'bg-surface-1' : 'bg-surface-1 hover:bg-surface-3 cursor-pointer'
                    } ${cell === 'X' ? 'text-white' : 'text-text-secondary'}`}>
                    {cell}
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-muted">You = O · AI = X ({algo === 'alphabeta' ? 'α-β' : 'Minimax'})</p>
            </div>

            {/* Decision Tree (simplified last 5 steps) */}
            <div className="flex flex-col items-center gap-4 min-w-[300px]">
              <p className="text-xs text-text-tertiary uppercase tracking-wider">Decision Trace</p>
              <div className="bg-surface-1 border border-[rgba(255,255,255,0.06)] rounded-2xl p-4 w-full max-h-[400px] overflow-y-auto space-y-2">
                {result ? result.steps.slice(-12).map((s, i) => (
                  <div key={i} className={`flex items-start gap-3 px-3 py-2 rounded-xl text-xs ${s.action === 'prune' ? 'bg-accent-red/5 border border-accent-red/10' : 'bg-surface-2'}`}>
                    <span className="bg-surface-3 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">{s.step}</span>
                    <div>
                      <span className={`font-medium ${s.action === 'prune' ? 'text-accent-red' : s.action === 'evaluate' ? 'text-accent-amber' : 'text-white'}`}>
                        {s.action === 'prune' ? '✂ Prune' : s.action === 'evaluate' ? '◆ Eval' : s.action === 'maximize' ? '▲ Max' : '▼ Min'}
                      </span>
                      <span className="text-text-tertiary ml-2">{s.reason}</span>
                    </div>
                  </div>
                )) : <p className="text-text-muted text-xs text-center py-8">Play a move to see the AI decision trace</p>}
              </div>
            </div>
          </div>

          {/* Bottom: Context */}
          <div className="h-32 border-t border-[rgba(255,255,255,0.06)] bg-surface-1 p-5 flex items-center gap-6">
            <div className="flex-1">
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2">Contextual Analysis</p>
              <p className="text-sm text-text-secondary leading-relaxed">
                {algo === 'minimax'
                  ? 'Minimax explores the entire game tree to determine the optimal move assuming both players play perfectly. Used in chess engines, Go AI, and adversarial planning.'
                  : 'Alpha-Beta pruning eliminates branches that cannot influence the final decision, dramatically reducing the search space while guaranteeing the same optimal result as full Minimax.'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">Real-World Use</p>
              <p className="text-sm text-white font-medium">Chess AI, Game Theory, Adversarial Planning</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
