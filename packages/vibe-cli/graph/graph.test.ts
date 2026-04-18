import isError from "lodash/isError.js";
import { describe, expect, it } from "vitest";

import { GraphBuildError, VibeGraph } from "./graph.js";

const PACKAGES_A_X = "packages/a/x.ts";
const PACKAGES_B_Y = "packages/b/y.ts";

describe("VibeGraph", () => {
  it("valid addNode does not throw", () => {
    const g = new VibeGraph();
    expect(() => {
      g.addNode("packages/vibe-cli/vibe.ps1", "file");
    }).not.toThrow();
  });

  it("bare filename (no directory separator) throws GraphBuildError with invalid node identity", () => {
    const g = new VibeGraph();
    expect(() => {
      g.addNode("vibe.ps1", "file");
    }).toThrow(GraphBuildError);
    expect(() => {
      g.addNode("vibe.ps1", "file");
    }).toThrow("invalid node identity");
  });

  it("rg output token (path with colon) throws GraphBuildError with invalid node identity", () => {
    const g = new VibeGraph();
    expect(() => {
      g.addNode("src/foo.ts:42:keyword", "file");
    }).toThrow(GraphBuildError);
    expect(() => {
      g.addNode("src/foo.ts:42:keyword", "file");
    }).toThrow("invalid node identity");
  });

  it("ghost-edge throws GraphBuildError instance with first missing endpoint named (R5)", () => {
    const g = new VibeGraph();
    let caught: Error | undefined;
    try {
      g.addEdge(PACKAGES_A_X, PACKAGES_B_Y, "imports");
    } catch (error) {
      if (isError(error)) caught = error;
    }
    expect(caught).toBeInstanceOf(GraphBuildError);
    expect(caught?.message).toBe(
      `NoGhostEdges: endpoint '${PACKAGES_A_X}' not in graph`,
    );
  });

  it("valid edge after adding both endpoints does not throw", () => {
    const g = new VibeGraph();
    g.addNode(PACKAGES_A_X, "file");
    g.addNode(PACKAGES_B_Y, "file");
    expect(() => {
      g.addEdge(PACKAGES_A_X, PACKAGES_B_Y, "imports");
    }).not.toThrow();
  });

  it("node and edge counts are correct after a sequence of adds", () => {
    const g = new VibeGraph();
    g.addNode(PACKAGES_A_X, "file");
    g.addNode(PACKAGES_B_Y, "file");
    g.addNode("packages/c/z.ts", "function");
    g.addEdge(PACKAGES_A_X, PACKAGES_B_Y, "imports");
    g.addEdge(PACKAGES_B_Y, "packages/c/z.ts", "calls");

    expect(g.nodeCount()).toBe(3);
    expect(g.edgeCount()).toBe(2);
  });
});
