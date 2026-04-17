import { DirectedGraph } from 'data-structure-typed';

import type { EdgeType, GraphEdge, GraphNode, NodeType } from './types.js';

export class GraphBuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GraphBuildError';
  }
}

function isValidNodePath(path: string): boolean {
  const hasSeparator = path.includes('/') || path.includes('\\');
  if (!hasSeparator) return false;
  // Reject rg output tokens: path with colon (e.g. "src/foo.ts:42:keyword")
  if (path.includes(':')) return false;
  return true;
}

export class VibeGraph {
  private readonly graph: DirectedGraph<GraphNode, GraphEdge>;
  private readonly nodes: Map<string, GraphNode>;

  constructor() {
    this.graph = new DirectedGraph<GraphNode, GraphEdge>();
    this.nodes = new Map<string, GraphNode>();
  }

  addNode(path: string, type: NodeType): void {
    if (!isValidNodePath(path)) {
      throw new GraphBuildError('invalid node identity');
    }

    const node: GraphNode = { path, type };
    this.nodes.set(path, node);
    this.graph.addVertex(path, node);
  }

  addEdge(from: string, to: string, type: EdgeType): void {
    if (!this.nodes.has(from)) {
      throw new GraphBuildError(`NoGhostEdges: endpoint '${from}' not in graph`);
    }
    if (!this.nodes.has(to)) {
      throw new GraphBuildError(`NoGhostEdges: endpoint '${to}' not in graph`);
    }

    const edge: GraphEdge = { from, to, type };
    this.graph.addEdge(from, to, edge);
  }

  nodeCount(): number {
    return this.nodes.size;
  }

  edgeCount(): number {
    return this.graph.edgeSet().length;
  }
}
