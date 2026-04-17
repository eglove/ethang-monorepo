import { describe, expect, it } from 'vitest';

import { DedupStateMachine } from './dedup.js';

describe('DedupStateMachine', () => {
  // Test 1: Add node, then add same node again → dedup_error with duplicate path (S10, S27)
  it('T1: duplicate node triggers dedup_error with pendingPath notification', () => {
    const sm = new DedupStateMachine();
    sm.addNode('pkg/a.ts', 'file');
    const result = sm.addNode('pkg/a.ts', 'file');
    expect(sm.graphState).toBe('dedup_error');
    expect(result.state).toBe('dedup_error');
    expect(result.duplicate).toBe(true);
    expect(result.pendingPath).toBe('pkg/a.ts');
  });

  // Test 2: After dedup_error, submit non-duplicate → collecting, node accepted, retryCount=0 (S20)
  it('T2: submitRetry with non-duplicate path resolves to collecting with retryCount=0', () => {
    const sm = new DedupStateMachine();
    sm.addNode('pkg/a.ts', 'file');
    sm.addNode('pkg/a.ts', 'file'); // triggers dedup_error
    const result = sm.submitRetry('pkg/b.ts', 'file');
    expect(result.state).toBe('collecting');
    expect(result.accepted).toBe(true);
    expect(sm.graphState).toBe('collecting');
    expect(sm.retryCount).toBe(0);
    expect(sm.graphNodes.has('pkg/b.ts')).toBe(true);
  });

  // Test 3: After dedup_error for 'pkg/a.ts', submit 'pkg/a.ts' again (still duplicate)
  // → graphState=dedup_error, retryCount=0 per BDD per-cycle observable (R10)
  it('T3: submitRetry with still-duplicate path returns to dedup_error; per-cycle retryCount observable resets to 0 (R10)', () => {
    const sm = new DedupStateMachine();
    sm.addNode('pkg/a.ts', 'file');
    sm.addNode('pkg/a.ts', 'file'); // dedup_error
    sm.submitRetry('pkg/a.ts', 'file'); // still duplicate, retries not yet exhausted
    expect(sm.graphState).toBe('dedup_error');
    // per-cycle observable retryCount resets to 0 at each dedup_error entry (D19)
    expect(sm.retryCount).toBe(0);
  });

  // Test 4: With maxRetries=1, duplicate → force_dedup fires, warn logged, then collecting (S4, S5, L4)
  it('T4: maxRetries=1 exhaustion fires force_dedup with WARN, returns to collecting with retryCount=0', () => {
    const warnMessages: string[] = [];
    const sm = new DedupStateMachine({
      maxRetries: 1,
      onWarn: (msg) => { warnMessages.push(msg); },
    });
    sm.addNode('pkg/a.ts', 'file');
    sm.addNode('pkg/a.ts', 'file'); // dedup_error
    sm.submitRetry('pkg/a.ts', 'file'); // still duplicate, budget=1 >= maxRetries=1 → force_dedup
    expect(sm.graphState).toBe('collecting');
    expect(sm.retryCount).toBe(0);
    expect(sm.pendingNode).toBeNull();
    expect(sm.pendingKind).toBe('none');
    expect(warnMessages.some(m => m.includes('force_dedup') && m.includes('pkg/a.ts'))).toBe(true);
  });

  // Test 5: Add duplicate edge → dedup fires (S11, S27)
  it('T5: duplicate edge triggers dedup_error', () => {
    const sm = new DedupStateMachine();
    sm.addNode('pkg/a.ts', 'file');
    sm.addNode('pkg/b.ts', 'file');
    sm.addEdge('pkg/a.ts', 'pkg/b.ts', 'imports');
    const result = sm.addEdge('pkg/a.ts', 'pkg/b.ts', 'imports');
    expect(sm.graphState).toBe('dedup_error');
    expect(result.state).toBe('dedup_error');
    expect(result.duplicate).toBe(true);
  });

  // Test 6: GraphRetryEdgeSuccess with non-duplicate substitute → accepted (L12, L13)
  it('T6: submitRetry after edge dedup_error with non-duplicate edge substitute is accepted', () => {
    const sm = new DedupStateMachine();
    sm.addNode('pkg/a.ts', 'file');
    sm.addNode('pkg/b.ts', 'file');
    sm.addNode('pkg/c.ts', 'file');
    sm.addEdge('pkg/a.ts', 'pkg/b.ts', 'imports');
    sm.addEdge('pkg/a.ts', 'pkg/b.ts', 'imports'); // dedup_error
    // submitRetry for edge: newPath encodes "from→to" with a different pair
    // For edge retry, we treat submitRetry as providing a substitute edge
    // Here we simulate by calling addEdge after state reset
    // The retry for an edge substitute goes through submitRetry with edge notation
    const result = sm.submitRetry('pkg/a.ts→pkg/c.ts', 'file');
    // Since the edge key is not in graphEdges, it should be accepted
    expect(result.state).toBe('collecting');
    expect(result.accepted).toBe(true);
  });

  // Test 7 (fail-first R6): graphOpsCount does NOT increment during retry cycles (D17)
  it('T7: graphOpsCount does not increment during submitRetry calls (D17)', () => {
    const sm = new DedupStateMachine();
    sm.addNode('pkg/a.ts', 'file');      // graphOpsCount=1
    sm.addNode('pkg/b.ts', 'file');      // graphOpsCount=2
    sm.addNode('pkg/a.ts', 'file');      // duplicate → dedup_error; graphOpsCount=3
    const opsAfterDedup = sm.graphOpsCount;
    sm.submitRetry('pkg/c.ts', 'file');  // retry: should NOT increment graphOpsCount
    // After successful retry, still collecting
    expect(sm.graphOpsCount).toBe(opsAfterDedup);
  });

  // Test 8 (fail-first R6): maxRetries=1 boundary: first duplicate → dedup_error (no force yet);
  // second still-duplicate → force_dedup immediately. Verifies >= not > (R6)
  it('T8: maxRetries=1 boundary — first retry no force, second triggers force_dedup', () => {
    const forcedPaths: string[] = [];
    const sm = new DedupStateMachine({
      maxRetries: 1,
      onForceDedup: (path) => { forcedPaths.push(path); },
    });
    sm.addNode('pkg/a.ts', 'file');
    sm.addNode('pkg/a.ts', 'file'); // first duplicate → dedup_error, budget=0
    expect(sm.graphState).toBe('dedup_error');
    expect(forcedPaths).toHaveLength(0); // no force yet

    sm.submitRetry('pkg/a.ts', 'file'); // budget becomes 1 >= maxRetries=1 → force_dedup
    expect(forcedPaths).toHaveLength(1);
    expect(forcedPaths[0]).toBe('pkg/a.ts');
    expect(sm.graphState).toBe('collecting');
  });

  // Test 9 (fail-first R6): In collecting/done/warn states, retryCount=0 (S20)
  it('T9: retryCount=0 in collecting state after successful operations (S20)', () => {
    const sm = new DedupStateMachine();
    sm.addNode('pkg/a.ts', 'file');
    sm.addNode('pkg/b.ts', 'file');
    expect(sm.graphState).toBe('collecting');
    expect(sm.retryCount).toBe(0);

    // After haltCleanup → warn state, retryCount=0
    const sm2 = new DedupStateMachine();
    sm2.addNode('pkg/a.ts', 'file');
    sm2.haltCleanup();
    expect(sm2.graphState).toBe('warn');
    expect(sm2.retryCount).toBe(0);

    // After writeMarkdown → done state, retryCount=0
    const sm3 = new DedupStateMachine();
    sm3.addNode('pkg/a.ts', 'file');
    sm3.writeMarkdown(1);
    expect(sm3.graphState).toBe('done');
    expect(sm3.retryCount).toBe(0);
  });

  // Test 10 (fail-first R6): graphState='building' ⇒ pendingKind ∈ {'node','edge'} (S27 PendingCoherence)
  // We verify that pendingKind is set to 'node' or 'edge' when addNode/addEdge is called
  it('T10: pendingKind is set before building state transition (S27 PendingCoherence)', () => {
    const pendingKindsDuringBuilding: string[] = [];
    // We need to observe pendingKind at the moment graphState transitions to building.
    // Since building is transient (goes to collecting or dedup_error immediately),
    // we verify via side-effect that pendingKind is coherent.
    // After addNode completes: if accepted, graphState=collecting and pendingKind is reset... wait no.
    // Actually per spec: pendingNode/pendingEdge cleared only on force_dedup, haltCleanup, writeMarkdown/writeFail done.
    // Let's verify pendingKind='node' is set on a fresh add.
    const sm = new DedupStateMachine({
      onBuilding: (kind) => { pendingKindsDuringBuilding.push(kind); },
    });
    sm.addNode('pkg/a.ts', 'file');
    expect(pendingKindsDuringBuilding).toContain('node');

    sm.addNode('pkg/b.ts', 'file');
    sm.addEdge('pkg/a.ts', 'pkg/b.ts', 'imports');
    expect(pendingKindsDuringBuilding).toContain('edge');
  });

  // Test 11 (R1): graphState transiently equals 'force_dedup' — captured via onForceDedup hook
  it('T11: force_dedup is synchronously visible as a transient state via onForceDedup hook (R1)', () => {
    let capturedStateInHook: string | null = null;
    let stateAfterHook: string | null = null;

    const sm = new DedupStateMachine({
      maxRetries: 1,
      onForceDedup: (path) => {
        // At this point, graphState should be 'force_dedup'
        capturedStateInHook = sm.graphState;
        void path;
      },
    });

    sm.addNode('pkg/a.ts', 'file');
    sm.addNode('pkg/a.ts', 'file'); // dedup_error
    sm.submitRetry('pkg/a.ts', 'file'); // force_dedup fires
    stateAfterHook = sm.graphState;

    expect(capturedStateInHook).toBe('force_dedup');
    expect(stateAfterHook).toBe('collecting');
  });
});
