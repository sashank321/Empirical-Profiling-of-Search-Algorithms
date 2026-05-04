import type { Graph, GraphNode, GraphEdge } from '@/lib/types'

const nodes: GraphNode[] = [
  { id: 'A', x: 10, y: 30, label: 'A' },
  { id: 'B', x: 30, y: 10, label: 'B' },
  { id: 'C', x: 30, y: 50, label: 'C' },
  { id: 'D', x: 50, y: 20, label: 'D' },
  { id: 'E', x: 50, y: 45, label: 'E' },
  { id: 'F', x: 50, y: 70, label: 'F' },
  { id: 'G', x: 70, y: 10, label: 'G' },
  { id: 'H', x: 70, y: 40, label: 'H' },
  { id: 'I', x: 85, y: 25, label: 'I' },
  { id: 'J', x: 90, y: 55, label: 'J' },
]

const edges: GraphEdge[] = [
  { from: 'A', to: 'B', weight: 4 },
  { from: 'A', to: 'C', weight: 3 },
  { from: 'B', to: 'D', weight: 5 },
  { from: 'B', to: 'C', weight: 2 },
  { from: 'C', to: 'E', weight: 6 },
  { from: 'C', to: 'F', weight: 8 },
  { from: 'D', to: 'G', weight: 3 },
  { from: 'D', to: 'E', weight: 2 },
  { from: 'E', to: 'H', weight: 4 },
  { from: 'E', to: 'F', weight: 3 },
  { from: 'F', to: 'J', weight: 7 },
  { from: 'G', to: 'I', weight: 2 },
  { from: 'G', to: 'H', weight: 4 },
  { from: 'H', to: 'I', weight: 3 },
  { from: 'H', to: 'J', weight: 5 },
  { from: 'I', to: 'J', weight: 6 },
  { from: 'A', to: 'E', weight: 10 },
  { from: 'D', to: 'H', weight: 7 },
]

function buildAdjacency(
  nodeList: GraphNode[],
  edgeList: GraphEdge[]
): Record<string, Record<string, number>> {
  const adj: Record<string, Record<string, number>> = {}

  for (const node of nodeList) {
    adj[node.id] = {}
  }

  for (const edge of edgeList) {
    adj[edge.from][edge.to] = edge.weight
    adj[edge.to][edge.from] = edge.weight
  }

  return adj
}

export const DEFAULT_GRAPH: Graph = {
  nodes,
  edges,
  adjacency: buildAdjacency(nodes, edges),
}
