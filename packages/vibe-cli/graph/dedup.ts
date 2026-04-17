import type { EdgeType, NodeType } from './types.js';
import { GraphBuildError } from './graph.js';

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

function isValidNodePath(path: string): boolean {
  const hasSeparator = path.includes('/') || path.includes('\\');
  if (!hasSeparator) return false;
  if (path.includes(':')) return false;
  return true;
}

export interface DedupStateMachineOptions {
  maxRetries?: number;
  maxGraphOps?: number;
  onWarn?: (msg: string) => void;
  onForceDedup?: (path: string) => void;
  onBuilding?: (kind: 'node' | 'edge') => void;
}

export class DedupStateMachine {
  graphState: GraphState = 'collecting';
  graphNodes: Set<string> = new Set();
  graphEdges: Set<string> = new Set(); // stored as "from→to"
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

  // Internal retry budget (separate from per-cycle observable retryCount)
  private _retryBudget: number = 0;

  constructor(options?: DedupStateMachineOptions) {
    this.maxRetries = options?.maxRetries ?? MaxRetries;
    this.maxGraphOps = options?.maxGraphOps ?? MaxGraphOps;
    this.onWarn = options?.onWarn;
    this.onForceDedup = options?.onForceDedup;
    this.onBuilding = options?.onBuilding;
  }

  addNode(path: string, nodeType: NodeType): { state: GraphState; duplicate?: boolean; pendingPath?: string } {
    // Guard: epoch boundary
    if (this.graphOpsCount >= this.maxGraphOps) {
      process.stderr.write(`[WARN: graphOpsCount=${this.maxGraphOps} epoch-boundary enforced]\n`);
      return { state: this.graphState };
    }

    // Validate path (delegate to VibeGraph logic)
    if (!isValidNodePath(path)) {
      throw new GraphBuildError('invalid node identity');
    }

    // Transition to building, set pending
    this.pendingKind = 'node';
    this.pendingNode = path;
    this.graphState = 'building';
    this.graphOpsCount++;

    // Notify building hook (for test 10)
    this.onBuilding?.('node');

    // Check for duplicate
    if (this.graphNodes.has(path)) {
      // Duplicate detected: transition to dedup_error, reset per-cycle observable
      this.retryCount = 0;
      this._retryBudget = 0;
      this.graphState = 'dedup_error';
      return { state: 'dedup_error', duplicate: true, pendingPath: path };
    }

    // Accept node
    this.graphNodes.add(path);
    this.graphState = 'collecting';
    this.retryCount = 0;
    return { state: 'collecting' };
  }

  addEdge(from: string, to: string, edgeType: EdgeType): { state: GraphState; duplicate?: boolean } {
    // Guard: epoch boundary
    if (this.graphOpsCount >= this.maxGraphOps) {
      process.stderr.write(`[WARN: graphOpsCount=${this.maxGraphOps} epoch-boundary enforced]\n`);
      return { state: this.graphState };
    }

    // Ghost-edge check: both endpoints must be in graphNodes
    if (!this.graphNodes.has(from)) {
      throw new GraphBuildError(`NoGhostEdges: endpoint '${from}' not in graph`);
    }
    if (!this.graphNodes.has(to)) {
      throw new GraphBuildError(`NoGhostEdges: endpoint '${to}' not in graph`);
    }

    const edgeKey = `${from}→${to}`;

    // Transition to building
    this.pendingKind = 'edge';
    this.pendingEdge = [from, to];
    this.graphState = 'building';
    this.graphOpsCount++;

    // Notify building hook (for test 10)
    this.onBuilding?.('edge');

    // Check for duplicate edge
    if (this.graphEdges.has(edgeKey)) {
      this.retryCount = 0;
      this._retryBudget = 0;
      this.graphState = 'dedup_error';
      return { state: 'dedup_error', duplicate: true };
    }

    // Accept edge
    this.graphEdges.add(edgeKey);
    this.graphState = 'collecting';
    this.retryCount = 0;
    return { state: 'collecting' };
  }

  submitRetry(newPath: string, _nodeType?: NodeType): { state: GraphState; accepted?: boolean } {
    // Transition to retrying, increment internal budget
    this.graphState = 'retrying';
    this._retryBudget++;

    // Determine if this is a node or edge retry based on pendingKind
    if (this.pendingKind === 'edge') {
      // For edge retry, newPath is in the form "from→to"
      const edgeKey = newPath;
      if (this.graphEdges.has(edgeKey)) {
        // Still duplicate
        // Reset per-cycle observable retryCount to 0 at dedup_error re-entry (D19)
        this.retryCount = 0;
        this.graphState = 'dedup_error';

        if (this._retryBudget >= this.maxRetries) {
          this._fireForceDedup(newPath);
        }
        return { state: this.graphState };
      }
      // Accept edge
      this.graphEdges.add(edgeKey);
      this.graphState = 'collecting';
      this.retryCount = 0;
      this._retryBudget = 0;
      return { state: 'collecting', accepted: true };
    }

    // Node retry (default)
    // Determine the path to check: use pendingNode if newPath matches it, else newPath
    const checkPath = newPath;

    if (this.graphNodes.has(checkPath)) {
      // Still duplicate: reset per-cycle observable retryCount to 0 (D19)
      this.retryCount = 0;
      this.graphState = 'dedup_error';

      if (this._retryBudget >= this.maxRetries) {
        this._fireForceDedup(checkPath);
      }
      return { state: this.graphState };
    }

    // Accept the substitute node
    this.graphNodes.add(checkPath);
    this.graphState = 'collecting';
    this.retryCount = 0;
    this._retryBudget = 0;
    return { state: 'collecting', accepted: true };
  }

  private _fireForceDedup(droppedPath: string): void {
    // Enter force_dedup (TRANSIENT)
    this.graphState = 'force_dedup';

    // Emit warn
    const warnMsg = `[WARN: force_dedup path=${droppedPath}]`;
    process.stderr.write(warnMsg + '\n');
    this.onWarn?.(warnMsg);

    // Call the onForceDedup hook while state is force_dedup (synchronously visible)
    this.onForceDedup?.(droppedPath);

    // Immediately transition to collecting (force_dedup is transient)
    this.graphState = 'collecting';
    this.retryCount = 0;
    this._retryBudget = 0;
    this.pendingNode = null;
    this.pendingEdge = null;
    this.pendingKind = 'none';
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

    // S16: clear pending
    this.pendingNode = null;
    this.pendingEdge = null;
    this.pendingKind = 'none';
  }

  haltCleanup(): void {
    this.graphState = 'warn';
    // S16: clear pending
    this.pendingNode = null;
    this.pendingEdge = null;
    this.pendingKind = 'none';
    // S33: markdownState UNCHANGED
    // S: agentsCompleted UNCHANGED
  }
}
