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
  if (path.includes(':')) return false;
  return true;
}

export class VibeGraph {
  private readonly graph: DirectedGraph<GraphNode, GraphEdge>;

  constructor() {
    this.graph = new DirectedGraph<GraphNode, GraphEdge>();
  }

  addNode(path: string, type: NodeType): { added: boolean } {
    if (!isValidNodePath(path)) {
      throw new GraphBuildError('invalid node identity');
    }
    const added = this.graph.addVertex(path, { path, type });
    return { added };
  }

  addEdge(from: string, to: string, type: EdgeType): { added: boolean } {
    if (!this.graph.hasVertex(from)) {
      throw new GraphBuildError(`NoGhostEdges: endpoint '${from}' not in graph`);
    }
    if (!this.graph.hasVertex(to)) {
      throw new GraphBuildError(`NoGhostEdges: endpoint '${to}' not in graph`);
    }
    const added = this.graph.addEdge(from, to, 1, { from, to, type });
    return { added };
  }

  hasNode(path: string): boolean {
    return this.graph.hasVertex(path);
  }

  hasEdge(from: string, to: string): boolean {
    return this.graph.hasEdge(from, to);
  }

  getNode(path: string): GraphNode | undefined {
    return this.graph.getVertex(path)?.value;
  }

  getNodes(): GraphNode[] {
    const out: GraphNode[] = [];
    for (const vertex of this.graph.vertexMap.values()) {
      if (vertex.value) out.push(vertex.value);
    }
    return out;
  }

  getEdges(): GraphEdge[] {
    const out: GraphEdge[] = [];
    for (const e of this.graph.edgeSet()) {
      if (e.value) out.push(e.value);
    }
    return out;
  }

  nodeCount(): number {
    return this.graph.vertexMap.size;
  }

  edgeCount(): number {
    return this.graph.edgeSet().length;
  }

  clear(): void {
    this.graph.clear();
  }
}
