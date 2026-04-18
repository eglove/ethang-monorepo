import { DirectedGraph } from "data-structure-typed";
import includes from "lodash/includes.js";

import type { EdgeType, GraphEdge, GraphNode, NodeType } from "./types.js";

import { GraphBuildError } from "./errors.js";

export class VibeGraph {
  private readonly graph: DirectedGraph<GraphNode, GraphEdge>;

  public constructor() {
    this.graph = new DirectedGraph<GraphNode, GraphEdge>();
  }

  public addEdge(from: string, to: string, type: EdgeType): { added: boolean } {
    if (!this.graph.hasVertex(from)) {
      throw new GraphBuildError(
        `NoGhostEdges: endpoint '${from}' not in graph`,
      );
    }
    if (!this.graph.hasVertex(to)) {
      throw new GraphBuildError(`NoGhostEdges: endpoint '${to}' not in graph`);
    }
    const added = this.graph.addEdge(from, to, 1, { from, to, type });
    return { added };
  }

  public addNode(path: string, type: NodeType): { added: boolean } {
    if (!isValidNodePath(path)) {
      throw new GraphBuildError("invalid node identity");
    }
    const added = this.graph.addVertex(path, { path, type });
    return { added };
  }

  public clear(): void {
    this.graph.clear();
  }

  public edgeCount(): number {
    return this.graph.edgeSet().length;
  }

  public getEdges(): GraphEdge[] {
    const out: GraphEdge[] = [];
    for (const edge of this.graph.edgeSet()) {
      if (edge.value) out.push(edge.value);
    }
    return out;
  }

  public getNode(path: string): GraphNode | undefined {
    return this.graph.getVertex(path)?.value;
  }

  public getNodes(): GraphNode[] {
    const out: GraphNode[] = [];
    for (const vertex of this.graph.vertexMap.values()) {
      if (vertex.value) out.push(vertex.value);
    }
    return out;
  }

  public hasEdge(from: string, to: string): boolean {
    return this.graph.hasEdge(from, to);
  }

  public hasNode(path: string): boolean {
    return this.graph.hasVertex(path);
  }

  public nodeCount(): number {
    return this.graph.vertexMap.size;
  }
}

function isValidNodePath(path: string): boolean {
  const hasSeparator = includes(path, "/") || includes(path, "\\");
  if (!hasSeparator) return false;
  if (includes(path, ":")) return false;
  return true;
}

export { GraphBuildError } from "./errors.js";
