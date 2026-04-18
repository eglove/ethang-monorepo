import type { EdgeType, NodeType } from "./types.js";

import { GraphBuildError } from "./errors.js";
import { VibeGraph } from "./graph.js";

export type GraphState =
  | "building"
  | "collecting"
  | "dedup_error"
  | "done"
  | "force_dedup"
  | "idle"
  | "retrying"
  | "warn"
  | "writing";

export const MaxRetries = 2;
export const MaxGraphOps = 10;

export type DedupStateMachineOptions = {
  maxGraphOps?: number;
  maxRetries?: number;
  onBuilding?: (kind: "edge" | "node") => void;
  onForceDedup?: (path: string) => void;
  onWarn?: (message: string) => void;
};

/**
 * Agent-lifecycle state machine over a {@link VibeGraph}.
 *
 * Deduplication itself lives in `DirectedGraph` (via VibeGraph's
 * `hasNode`/`hasEdge`). This class only tracks the retry/force-dedup
 * behaviour, pending-op bookkeeping, agent completion counters, and
 * markdown lifecycle around those queries — no parallel Set state.
 */
export class DedupStateMachine {
  public agentsCompleted = 0;
  public readonly graph: VibeGraph;
  public graphOpsCount = 0;
  public graphState: GraphState = "collecting";
  public markdownState: "current" | "none" | "stale" = "none";
  public pendingEdge: [string, string] | null = null;
  public pendingKind: "edge" | "node" | "none" = "none";
  public pendingNode: null | string = null;
  public retryCount = 0;

  public get graphEdges(): Set<string> {
    const edgeSet = new Set<string>();
    for (const edge of this.graph.getEdges()) {
      edgeSet.add(`${edge.from}→${edge.to}`);
    }
    return edgeSet;
  }
  // Backward-compat views — derived on access, not maintained as parallel state.
  public get graphNodes(): Set<string> {
    const nodeSet = new Set<string>();
    for (const node of this.graph.getNodes()) nodeSet.add(node.path);
    return nodeSet;
  }
  private _pendingEdgeType: EdgeType | null = null;
  // Tracks the pending op's type so retries know what to call on the graph
  private _pendingNodeType: NodeType | null = null;
  // Internal retry budget (distinct from the per-cycle observable retryCount)
  private _retryBudget = 0;

  private readonly maxGraphOps: number;

  private readonly maxRetries: number;
  private readonly onBuilding?: ((kind: "edge" | "node") => void) | undefined;

  private readonly onForceDedup?: ((path: string) => void) | undefined;

  private readonly onWarn?: ((message: string) => void) | undefined;

  public constructor(options?: DedupStateMachineOptions) {
    this.graph = new VibeGraph();
    this.maxRetries = options?.maxRetries ?? MaxRetries;
    this.maxGraphOps = options?.maxGraphOps ?? MaxGraphOps;
    this.onWarn = options?.onWarn;
    this.onForceDedup = options?.onForceDedup;
    this.onBuilding = options?.onBuilding;
  }

  public addEdge(
    from: string,
    to: string,
    edgeType: EdgeType,
  ): { duplicate?: boolean; state: GraphState } {
    if (this.graphOpsCount >= this.maxGraphOps) {
      process.stderr.write(
        `[WARN: graphOpsCount=${this.maxGraphOps} epoch-boundary enforced]\n`,
      );
      return { state: this.graphState };
    }

    if (!this.graph.hasNode(from)) {
      throw new GraphBuildError(
        `NoGhostEdges: endpoint '${from}' not in graph`,
      );
    }
    if (!this.graph.hasNode(to)) {
      throw new GraphBuildError(`NoGhostEdges: endpoint '${to}' not in graph`);
    }

    this.pendingKind = "edge";
    this.pendingEdge = [from, to];
    this._pendingEdgeType = edgeType;
    this.graphState = "building";
    this.graphOpsCount += 1;

    this.onBuilding?.("edge");

    if (this.graph.hasEdge(from, to)) {
      this.retryCount = 0;
      this._retryBudget = 0;
      this.graphState = "dedup_error";
      return { duplicate: true, state: "dedup_error" };
    }

    this.graph.addEdge(from, to, edgeType);
    this.graphState = "collecting";
    this.retryCount = 0;
    return { state: "collecting" };
  }

  public addNode(
    path: string,
    nodeType: NodeType,
  ): { duplicate?: boolean; pendingPath?: string; state: GraphState } {
    if (this.graphOpsCount >= this.maxGraphOps) {
      process.stderr.write(
        `[WARN: graphOpsCount=${this.maxGraphOps} epoch-boundary enforced]\n`,
      );
      return { state: this.graphState };
    }

    this.pendingKind = "node";
    this.pendingNode = path;
    this._pendingNodeType = nodeType;
    this.graphState = "building";
    this.graphOpsCount += 1;

    this.onBuilding?.("node");

    if (this.graph.hasNode(path)) {
      this.retryCount = 0;
      this._retryBudget = 0;
      this.graphState = "dedup_error";
      return { duplicate: true, pendingPath: path, state: "dedup_error" };
    }

    this.graph.addNode(path, nodeType);
    this.graphState = "collecting";
    this.retryCount = 0;
    return { state: "collecting" };
  }

  public haltCleanup(): void {
    this.graphState = "warn";
    this.pendingNode = null;
    this.pendingEdge = null;
    this.pendingKind = "none";
    // S33: markdownState UNCHANGED
    // agentsCompleted UNCHANGED
  }

  public submitRetry(
    newPath: string,
    _nodeType?: NodeType,
  ): { accepted?: boolean; state: GraphState } {
    this.graphState = "retrying";
    this._retryBudget += 1;

    if ("edge" === this.pendingKind) {
      return this.retryEdge(newPath);
    }

    return this.retryNode(newPath, _nodeType);
  }

  public writeFail(maxAgents: number): void {
    this.graphState = "writing";
    this.agentsCompleted += 1;
    this.graphOpsCount = 0;
    this.retryCount = 0;

    // markdownState: none→stale, current→stale, stale→stale (never →none: S34)
    this.markdownState = "stale";

    this.graphState = this.agentsCompleted >= maxAgents ? "done" : "collecting";

    this.pendingNode = null;
    this.pendingEdge = null;
    this.pendingKind = "none";
  }

  public writeMarkdown(maxAgents: number): void {
    this.graphState = "writing";
    this.agentsCompleted += 1;
    this.graphOpsCount = 0;
    this.retryCount = 0;

    if (this.agentsCompleted >= maxAgents) {
      this.graphState = "done";
      this.pendingNode = null;
      this.pendingEdge = null;
      this.pendingKind = "none";
    } else {
      this.graphState = "collecting";
    }

    this.markdownState = "current";
  }

  private acceptRetry(): { accepted: true; state: GraphState } {
    this.graphState = "collecting";
    this.retryCount = 0;
    this._retryBudget = 0;
    return { accepted: true, state: "collecting" };
  }

  private failRetry(newPath: string): { state: GraphState } {
    this.retryCount = 0;
    this.graphState = "dedup_error";
    if (this._retryBudget >= this.maxRetries) this.fireForceDedup(newPath);
    return { state: this.graphState };
  }

  private fireForceDedup(droppedPath: string): void {
    this.graphState = "force_dedup";

    const warnMessage = `[WARN: force_dedup path=${droppedPath}]`;
    process.stderr.write(`${warnMessage}\n`);
    this.onWarn?.(warnMessage);
    this.onForceDedup?.(droppedPath);

    this.graphState = "collecting";
    this.retryCount = 0;
    this._retryBudget = 0;
    this.pendingNode = null;
    this.pendingEdge = null;
    this.pendingKind = "none";
    this._pendingNodeType = null;
    this._pendingEdgeType = null;
  }

  private retryEdge(newPath: string): {
    accepted?: boolean;
    state: GraphState;
  } {
    // newPath is "from→to"
    const arrow = newPath.indexOf("→");
    const from = 0 <= arrow ? newPath.slice(0, arrow) : newPath;
    const to = 0 <= arrow ? newPath.slice(arrow + 1) : newPath;

    if (!this.graph.hasNode(from) || !this.graph.hasNode(to)) {
      return this.failRetry(newPath);
    }

    if (this.graph.hasEdge(from, to)) {
      return this.failRetry(newPath);
    }

    this.graph.addEdge(from, to, this._pendingEdgeType ?? "imports");
    return this.acceptRetry();
  }

  private retryNode(
    newPath: string,
    nodeType: NodeType | undefined,
  ): { accepted?: boolean; state: GraphState } {
    if (this.graph.hasNode(newPath)) {
      return this.failRetry(newPath);
    }

    this.graph.addNode(newPath, nodeType ?? this._pendingNodeType ?? "file");
    return this.acceptRetry();
  }
}
