'use client'

import React, { useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SearchStep } from '@/lib/types'

interface SearchTreeProps {
  steps: SearchStep[]
  currentStepIndex: number
  path: string[]
  isComplete: boolean
  algorithmName: string
}

interface TreeNode {
  id: string
  parentId: string | null
  depth: number
  children: TreeNode[]
  x: number
  y: number
  stepIndex: number
  cost?: number
  isInPath: boolean
  isPruned: boolean
}

const NODE_RADIUS = 16
const LEVEL_HEIGHT = 72
const MIN_SPACING = 44
const PADDING = 40

function buildTreeFromSteps(
  steps: SearchStep[],
  currentStepIndex: number,
  path: string[]
): TreeNode[] {
  const allNodes: TreeNode[] = []
  const nodeMap = new Map<string, TreeNode>()
  const parentStack: string[] = []

  for (let i = 0; i <= Math.min(currentStepIndex, steps.length - 1); i++) {
    const step = steps[i]
    if (!step?.node) continue

    const nodeId = step.node
    if (nodeMap.has(nodeId)) continue

    // Determine parent: last visited node that is a neighbor of current
    let parentId: string | null = null
    for (let j = parentStack.length - 1; j >= 0; j--) {
      const candidate = parentStack[j]
      // Check if candidate is in the visited set and could be the parent
      if (step.visited.includes(candidate)) {
        parentId = candidate
        break
      }
    }
    // First node has no parent
    if (allNodes.length === 0) parentId = null

    const parentNode = parentId ? nodeMap.get(parentId) : null
    const depth = parentNode ? parentNode.depth + 1 : 0

    const treeNode: TreeNode = {
      id: nodeId,
      parentId,
      depth,
      children: [],
      x: 0,
      y: PADDING + depth * LEVEL_HEIGHT,
      stepIndex: i,
      isInPath: path.includes(nodeId),
      isPruned: false,
    }

    if (parentNode) {
      parentNode.children.push(treeNode)
    }

    nodeMap.set(nodeId, treeNode)
    allNodes.push(treeNode)
    parentStack.push(nodeId)
  }

  // Layout: assign x positions using simple level-order spacing
  const levels = new Map<number, TreeNode[]>()
  for (const node of allNodes) {
    if (!levels.has(node.depth)) levels.set(node.depth, [])
    levels.get(node.depth)!.push(node)
  }

  const maxWidth = Math.max(...Array.from(levels.values()).map(l => l.length))
  const totalWidth = maxWidth * MIN_SPACING + PADDING * 2

  for (const [, nodes] of levels) {
    const levelWidth = nodes.length * MIN_SPACING
    const startX = (totalWidth - levelWidth) / 2 + MIN_SPACING / 2
    nodes.forEach((node, idx) => {
      node.x = startX + idx * MIN_SPACING
    })
  }

  // Center children under parents
  for (let depth = Math.max(...levels.keys()); depth >= 0; depth--) {
    const nodesAtDepth = levels.get(depth) || []
    for (const node of nodesAtDepth) {
      if (node.children.length > 0) {
        const childXs = node.children.map(c => c.x)
        const centerX = (Math.min(...childXs) + Math.max(...childXs)) / 2
        node.x = centerX
      }
    }
  }

  return allNodes
}

export default function SearchTree({
  steps,
  currentStepIndex,
  path,
  isComplete,
  algorithmName,
}: SearchTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const treeNodes = useMemo(
    () => buildTreeFromSteps(steps, currentStepIndex, path),
    [steps, currentStepIndex, path]
  )

  const maxDepth = treeNodes.length > 0 ? Math.max(...treeNodes.map(n => n.depth)) : 0
  const svgHeight = Math.max(200, (maxDepth + 1) * LEVEL_HEIGHT + PADDING * 2)
  const svgWidth = Math.max(300, treeNodes.length * MIN_SPACING + PADDING * 2)

  // Auto-scroll to latest node
  useEffect(() => {
    if (containerRef.current && treeNodes.length > 0) {
      const latest = treeNodes[treeNodes.length - 1]
      containerRef.current.scrollTo({
        left: Math.max(0, latest.x - containerRef.current.clientWidth / 2),
        top: Math.max(0, latest.y - containerRef.current.clientHeight / 2),
        behavior: 'smooth',
      })
    }
  }, [treeNodes])

  const getNodeColor = (node: TreeNode) => {
    const currentStep = steps[currentStepIndex]
    if (isComplete && node.isInPath) return { fill: '#ffffff', stroke: '#ffffff', text: '#000000' }
    if (currentStep?.node === node.id) return { fill: '#3b82f6', stroke: '#60a5fa', text: '#ffffff' }
    if (currentStep?.frontier.some(f => f.id === node.id)) return { fill: '#171717', stroke: '#f59e0b', text: '#f59e0b' }
    if (currentStep?.visited.includes(node.id)) return { fill: '#111111', stroke: '#3b82f680', text: '#a1a1aa' }
    return { fill: '#111111', stroke: 'rgba(255,255,255,0.1)', text: '#71717a' }
  }

  if (steps.length === 0 || currentStepIndex < 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-text-tertiary px-4">
        <svg className="w-8 h-8 mb-3 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3v6m0 0l-3-3m3 3l3-3M5 12h14M12 15v6m0 0l3-3m-3 3l-3-3" />
        </svg>
        <p className="text-xs font-medium text-text-secondary">Search Tree</p>
        <p className="text-[10px] text-text-tertiary mt-1 text-center">
          Execute an algorithm to see the search tree grow in real-time
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[rgba(255,255,255,0.06)]">
        <div className="w-1.5 h-1.5 rounded-full bg-accent-green" />
        <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
          Search Tree — {algorithmName}
        </span>
        <span className="text-[10px] font-mono text-text-muted ml-auto">
          {treeNodes.length} nodes
        </span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
        style={{ scrollBehavior: 'smooth' }}
      >
        <svg
          width={svgWidth}
          height={svgHeight}
          className="min-w-full"
        >
          {/* Edges */}
          {treeNodes
            .filter(n => n.parentId)
            .map(node => {
              const parent = treeNodes.find(p => p.id === node.parentId)
              if (!parent) return null
              const isPathEdge = isComplete && node.isInPath && parent.isInPath
              return (
                <motion.line
                  key={`edge-${parent.id}-${node.id}`}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  x1={parent.x}
                  y1={parent.y + NODE_RADIUS}
                  x2={node.x}
                  y2={node.y - NODE_RADIUS}
                  stroke={isPathEdge ? '#ffffff' : 'rgba(255,255,255,0.08)'}
                  strokeWidth={isPathEdge ? 2 : 1}
                  strokeDasharray={node.isPruned ? '4 4' : undefined}
                />
              )
            })}

          {/* Nodes */}
          <AnimatePresence>
            {treeNodes.map(node => {
              const colors = getNodeColor(node)
              return (
                <motion.g
                  key={`node-${node.id}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {/* Glow for current */}
                  {steps[currentStepIndex]?.node === node.id && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={NODE_RADIUS + 6}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="1"
                      opacity="0.3"
                    />
                  )}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={NODE_RADIUS}
                    fill={colors.fill}
                    stroke={colors.stroke}
                    strokeWidth="1.5"
                  />
                  <text
                    x={node.x}
                    y={node.y + 1}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={colors.text}
                    fontSize="11"
                    fontFamily="Inter, sans-serif"
                    fontWeight="500"
                  >
                    {node.id}
                  </text>
                  {/* Depth label */}
                  <text
                    x={node.x}
                    y={node.y + NODE_RADIUS + 12}
                    textAnchor="middle"
                    fill="#52525b"
                    fontSize="8"
                    fontFamily="Inter, sans-serif"
                  >
                    d={node.depth}
                  </text>
                </motion.g>
              )
            })}
          </AnimatePresence>
        </svg>
      </div>
    </div>
  )
}
