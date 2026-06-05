import type { GameNode, MinimaxStep, MinimaxResult } from '@/lib/types'

let stepCounter = 0
let nodeIdCounter = 0

function genId(): string { return `n${nodeIdCounter++}` }

export function checkWinner(board: (string | null)[]): 'X' | 'O' | 'draw' | null {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a] as 'X' | 'O'
  }
  if (board.every(c => c !== null)) return 'draw'
  return null
}

export function getAvailableMoves(board: (string | null)[]): number[] {
  return board.reduce<number[]>((acc, v, i) => { if (v === null) acc.push(i); return acc }, [])
}

function evaluate(board: (string | null)[]): number {
  const w = checkWinner(board)
  if (w === 'X') return 10
  if (w === 'O') return -10
  return 0
}

export function runMinimax(board: (string | null)[], isMaximizing: boolean, maxDepth: number = 9): MinimaxResult {
  stepCounter = 0; nodeIdCounter = 0
  const steps: MinimaxStep[] = []
  const t0 = performance.now()

  function build(b: (string | null)[], isMax: boolean, depth: number): GameNode {
    const id = genId()
    const winner = checkWinner(b)
    if (winner || depth >= maxDepth) {
      const val = evaluate(b)
      steps.push({ step: ++stepCounter, node: id, action: 'evaluate', reason: winner ? `${winner} wins → ${val}` : `Depth limit → ${val}`, value: val })
      return { id, value: val, children: [], isMax, pruned: false, depth, move: undefined }
    }
    const moves = getAvailableMoves(b)
    const children: GameNode[] = []
    let best = isMax ? -Infinity : Infinity
    for (const m of moves) {
      const nb = [...b]; nb[m] = isMax ? 'X' : 'O'
      const child = build(nb, !isMax, depth + 1)
      child.move = `${isMax ? 'X' : 'O'}→${m}`
      children.push(child)
      best = isMax ? Math.max(best, child.value!) : Math.min(best, child.value!)
    }
    steps.push({ step: ++stepCounter, node: id, action: isMax ? 'maximize' : 'minimize', reason: `Best value = ${best} from ${children.length} children`, value: best })
    return { id, value: best, children, isMax, pruned: false, depth }
  }

  const tree = build(board, isMaximizing, 0)
  const t1 = performance.now()
  const bestChild = tree.children.reduce((a, b) => isMaximizing ? (b.value! > a.value! ? b : a) : (b.value! < a.value! ? b : a), tree.children[0])

  return {
    bestMove: bestChild?.move || '', value: tree.value!, tree,
    nodesVisited: stepCounter, nodesPruned: 0, executionMs: t1 - t0, steps
  }
}

export function runAlphaBeta(board: (string | null)[], isMaximizing: boolean, maxDepth: number = 9): MinimaxResult {
  stepCounter = 0; nodeIdCounter = 0
  const steps: MinimaxStep[] = []
  let pruned = 0
  const t0 = performance.now()

  function build(b: (string | null)[], isMax: boolean, depth: number, alpha: number, beta: number): GameNode {
    const id = genId()
    const winner = checkWinner(b)
    if (winner || depth >= maxDepth) {
      const val = evaluate(b)
      steps.push({ step: ++stepCounter, node: id, action: 'evaluate', reason: winner ? `${winner} wins → ${val}` : `Depth limit → ${val}`, value: val })
      return { id, value: val, children: [], isMax, alpha, beta, pruned: false, depth }
    }
    const moves = getAvailableMoves(b)
    const children: GameNode[] = []
    let best = isMax ? -Infinity : Infinity

    for (let i = 0; i < moves.length; i++) {
      const m = moves[i]
      const nb = [...b]; nb[m] = isMax ? 'X' : 'O'
      const child = build(nb, !isMax, depth + 1, alpha, beta)
      child.move = `${isMax ? 'X' : 'O'}→${m}`
      children.push(child)
      best = isMax ? Math.max(best, child.value!) : Math.min(best, child.value!)
      if (isMax) { alpha = Math.max(alpha, best) } else { beta = Math.min(beta, best) }
      if (beta <= alpha) {
        for (let j = i + 1; j < moves.length; j++) {
          children.push({ id: genId(), value: undefined, children: [], isMax: !isMax, pruned: true, depth: depth + 1, move: `${isMax ? 'X' : 'O'}→${moves[j]}` })
          pruned++
        }
        steps.push({ step: ++stepCounter, node: id, action: 'prune', reason: `α=${alpha} ≥ β=${beta}, pruned ${moves.length - i - 1} branches`, value: best })
        break
      }
    }
    steps.push({ step: ++stepCounter, node: id, action: isMax ? 'maximize' : 'minimize', reason: `Best=${best}, α=${alpha}, β=${beta}`, value: best })
    return { id, value: best, children, isMax, alpha, beta, pruned: false, depth }
  }

  const tree = build(board, isMaximizing, 0, -Infinity, Infinity)
  const t1 = performance.now()
  const bestChild = tree.children.filter(c => !c.pruned).reduce((a, b) => isMaximizing ? (b.value! > a.value! ? b : a) : (b.value! < a.value! ? b : a), tree.children[0])

  return {
    bestMove: bestChild?.move || '', value: tree.value!, tree,
    nodesVisited: stepCounter, nodesPruned: pruned, executionMs: t1 - t0, steps
  }
}
