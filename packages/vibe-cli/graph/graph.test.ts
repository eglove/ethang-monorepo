import { describe, expect, it } from 'vitest';

import { GraphBuildError, VibeGraph } from './graph.js';

describe('VibeGraph', () => {
  it('valid addNode does not throw', () => {
    const g = new VibeGraph();
    expect(() => {
      g.addNode('packages/vibe-cli/vibe.ps1', 'file');
    }).not.toThrow();
  });

  it('bare filename (no directory separator) throws GraphBuildError with invalid node identity', () => {
    const g = new VibeGraph();
    expect(() => {
      g.addNode('vibe.ps1', 'file');
    }).toThrow(GraphBuildError);
    expect(() => {
      g.addNode('vibe.ps1', 'file');
    }).toThrow('invalid node identity');
  });

  it('rg output token (path with colon) throws GraphBuildError with invalid node identity', () => {
    const g = new VibeGraph();
    expect(() => {
      g.addNode('src/foo.ts:42:keyword', 'file');
    }).toThrow(GraphBuildError);
    expect(() => {
      g.addNode('src/foo.ts:42:keyword', 'file');
    }).toThrow('invalid node identity');
  });

  it('ghost-edge throws GraphBuildError instance with first missing endpoint named (R5)', () => {
    const g = new VibeGraph();
    let caught: unknown;
    try {
      g.addEdge('packages/a/x.ts', 'packages/b/y.ts', 'imports');
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(GraphBuildError);
    expect((caught as GraphBuildError).message).toBe(
      "NoGhostEdges: endpoint 'packages/a/x.ts' not in graph",
    );
  });

  it('valid edge after adding both endpoints does not throw', () => {
    const g = new VibeGraph();
    g.addNode('packages/a/x.ts', 'file');
    g.addNode('packages/b/y.ts', 'file');
    expect(() => {
      g.addEdge('packages/a/x.ts', 'packages/b/y.ts', 'imports');
    }).not.toThrow();
  });

  it('node and edge counts are correct after a sequence of adds', () => {
    const g = new VibeGraph();
    g.addNode('packages/a/x.ts', 'file');
    g.addNode('packages/b/y.ts', 'file');
    g.addNode('packages/c/z.ts', 'function');
    g.addEdge('packages/a/x.ts', 'packages/b/y.ts', 'imports');
    g.addEdge('packages/b/y.ts', 'packages/c/z.ts', 'calls');

    expect(g.nodeCount()).toBe(3);
    expect(g.edgeCount()).toBe(2);
  });
});
