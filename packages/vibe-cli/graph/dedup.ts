import type { EdgeType, NodeType } from './types.js';
import { GraphBuildError, VibeGraph } from './graph.js';

export type GraphState =
  | 'idle'
  | 'collecting'
  | 'building'
  | 'dedup_error'
  | 'retrying'
  | 'force_dedup'
  | 'writing'
  | 'done'
  | 'warn';

export const MaxRetries = 2;
export const MaxGraphOps = 10;

export interface DedupStateMachineOptions {
  maxRetries?: number;
  maxGraphOps?: number;
  onWarn?: (msg: string) => void;
  onForceDedup?: (path: string) => void;
  onBuilding?: (kind: 'node' | 'edge') => void;
}

/**
 * Agent-lifecycle state machine over a {@link VibeGraph}.
 *
 * Deduplication itself lives in `DirectedGraph` (via VibeGraph's
 * `hasNode`/`hasEdge`). This class only tracks the retry/force-dedup
 * behaviour, pending-op bookkeeping, agent completion counters, and
 * markdown lifecycle around those queries — no parallel Set state.
 */
export class DedupStateMachine {
  readonly graph: VibeGraph;
  graphState: GraphState = 'collecting';
  pendingKind: 'none' | 'node' | 'edge' = 'none';
  pendingNode: string | null = null;
  pendingEdge: [string, string] | null = null;
  retryCount: number = 0;
  graphOpsCount: number = 0;
  agentsCompleted: number = 0;
  markdownState: 'none' | 'current' | 'stale' = 'none';

  private readonly maxRetries: number;
  private readonly maxGraphOps: number;
  private readonly onWarn?: (msg: string) => void;
  private readonly onForceDedup?: (path: string) => void;
  private readonly onBuilding?: (kind: 'node' | 'edge') => void;

  // Internal retry budget (distinct from the per-cycle observable retryCount)
  private _retryBudget: number = 0;

  // Tracks the pending op's type so retries know what to call on the graph
  private _pendingNodeType: NodeType | null = null;
  private _pendingEdgeType: EdgeType | null = null;

  constructor(options?: DedupStateMachineOptions) {
    this.graph = new VibeGraph();
    this.maxRetries = options?.maxRetries ?? MaxRetries;
    this.maxGraphOps = options?.maxGraphOps ?? MaxGraphOps;
    this.onWarn = options?.onWarn;
    this.onForceDedup = options?.onForceDedup;
    this.onBuilding = options?.onBuilding;
  }

  // Backward-compat views — derived on access, not maintained as parallel state.
  get graphNodes(): Set<string> {
    const s = new Set<string>();
    for (const n of this.graph.getNodes()) s.add(n.path);
    return s;
  }

  get graphEdges(): Set<string> {
    const s = new Set<string>();
    for (const e of this.graph.getEdges()) s.add(`${e.from}→${e.to}`);
    return s;
  }

  addNode(
    path: string,
    nodeType: NodeType,
  ): { state: GraphState; duplicate?: boolean; pendingPath?: string } {
    if (this.graphOpsCount >= this.maxGraphOps) {
      process.stderr.write(`[WARN: graphOpsCount=${this.maxGraphOps} epoch-boundary enforced]\n`);
      return { state: this.graphState };
    }

    this.pendingKind = 'node';
    this.pendingNode = path;
    this._pendingNodeType = nodeType;
    this.graphState = 'building';
    this.graphOpsCount++;

    this.onBuilding?.('node');

    if (this.graph.hasNode(path)) {
      this.retryCount = 0;
      this._retryBudget = 0;
      this.graphState = 'dedup_error';
      return { state: 'dedup_error', duplicate: true, pendingPath: path };
    }

    this.graph.addNode(path, nodeType);
    this.graphState = 'collecting';
    this.retryCount = 0;
    return { state: 'collecting' };
  }

  addEdge(
    from: string,
    to: string,
    edgeType: EdgeType,
  ): { state: GraphState; duplicate?: boolean } {
    if (this.graphOpsCount >= this.maxGraphOps) {
      process.stderr.write(`[WARN: graphOpsCount=${this.maxGraphOps} epoch-boundary enforced]\n`);
      return { state: this.graphState };
    }

    if (!this.graph.hasNode(from)) {
      throw new GraphBuildError(`NoGhostEdges: endpoint '${from}' not in graph`);
    }
    if (!this.graph.hasNode(to)) {
      throw new GraphBuildError(`NoGhostEdges: endpoint '${to}' not in graph`);
    }

    this.pendingKind = 'edge';
    this.pendingEdge = [from, to];
    this._pendingEdgeType = edgeType;
    this.graphState = 'building';
    this.graphOpsCount++;

    this.onBuilding?.('edge');

    if (this.graph.hasEdge(from, to)) {
      this.retryCount = 0;
      this._retryBudget = 0;
      this.graphState = 'dedup_error';
      return { state: 'dedup_error', duplicate: true };
    }

    this.graph.addEdge(from, to, edgeType);
    this.graphState = 'collecting';
    this.retryCount = 0;
    return { state: 'collecting' };
  }

  submitRetry(newPath: string, _nodeType?: NodeType): { state: GraphState; accepted?: boolean } {
    this.graphState = 'retrying';
    this._retryBudget++;

    if (this.pendingKind === 'edge') {
      // newPath is "from→to"
      const arrow = newPath.indexOf('→');
      const from = arrow >= 0 ? newPath.slice(0, arrow) : newPath;
      const to = arrow >= 0 ? newPath.slice(arrow + 1) : newPath;

      if (!this.graph.hasNode(from) || !this.graph.hasNode(to)) {
        this.retryCount = 0;
        this.graphState = 'dedup_error';
        if (this._retryBudget >= this.maxRetries) this._fireForceDedup(newPath);
        return { state: this.graphState };
      }

      if (this.graph.hasEdge(from, to)) {
        this.retryCount = 0;
        this.graphState = 'dedup_error';
        if (this._retryBudget >= this.maxRetries) this._fireForceDedup(newPath);
        return { state: this.graphState };
      }

      this.graph.addEdge(from, to, this._pendingEdgeType ?? 'imports');
      this.graphState = 'collecting';
      this.retryCount = 0;
      this._retryBudget = 0;
      return { state: 'collecting', accepted: true };
    }

    // Node retry
    if (this.graph.hasNode(newPath)) {
      this.retryCount = 0;
      this.graphState = 'dedup_error';
      if (this._retryBudget >= this.maxRetries) this._fireForceDedup(newPath);
      return { state: this.graphState };
    }

    this.graph.addNode(newPath, _nodeType ?? this._pendingNodeType ?? 'file');
    this.graphState = 'collecting';
    this.retryCount = 0;
    this._retryBudget = 0;
    return { state: 'collecting', accepted: true };
  }

  private _fireForceDedup(droppedPath: string): void {
    this.graphState = 'force_dedup';

    const warnMsg = `[WARN: force_dedup path=${droppedPath}]`;
    process.stderr.write(warnMsg + '\n');
    this.onWarn?.(warnMsg);
    this.onForceDedup?.(droppedPath);

    this.graphState = 'collecting';
    this.retryCount = 0;
    this._retryBudget = 0;
    this.pendingNode = null;
    this.pendingEdge = null;
    this.pendingKind = 'none';
    this._pendingNodeType = null;
    this._pendingEdgeType = null;
  }

  writeMarkdown(maxAgents: number): void {
    this.graphState = 'writing';
    this.agentsCompleted++;
    this.graphOpsCount = 0;
    this.retryCount = 0;

    if (this.agentsCompleted >= maxAgents) {
      this.graphState = 'done';
      this.pendingNode = null;
      this.pendingEdge = null;
      this.pendingKind = 'none';
    } else {
      this.graphState = 'collecting';
    }

    this.markdownState = 'current';
  }

  writeFail(maxAgents: number): void {
    this.graphState = 'writing';
    this.agentsCompleted++;
    this.graphOpsCount = 0;
    this.retryCount = 0;

    // markdownState: none→stale, current→stale, stale→stale (never →none: S34)
    this.markdownState = 'stale';

    if (this.agentsCompleted >= maxAgents) {
      this.graphState = 'done';
    } else {
      this.graphState = 'collecting';
    }

    this.pendingNode = null;
    this.pendingEdge = null;
    this.pendingKind = 'none';
  }

  haltCleanup(): void {
    this.graphState = 'warn';
    this.pendingNode = null;
    this.pendingEdge = null;
    this.pendingKind = 'none';
    // S33: markdownState UNCHANGED
    // agentsCompleted UNCHANGED
  }
}
