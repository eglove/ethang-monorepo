/**
 * T12 — Graph subsystem integration tests.
 *
 * Covers multi-subsystem interactions not captured by unit tests:
 *   D20/R9  — MaxGraphOps epoch boundary (silent disable after limit)
 *   D20/Z   — MaxGraphOps=0 zero-budget epoch
 *   D21     — MaxRetries=0 immediate force-dedup
 *   D26     — concurrent write race (rename failure path)
 *   D19/R10 — retryCount cross-epoch freshness (per-cycle observable reset)
 */

import assign from "lodash/assign.js";
import filter from "lodash/filter.js";
import find from "lodash/find.js";
import includes from "lodash/includes.js";
import isString from "lodash/isString.js";
import some from "lodash/some.js";
import split from "lodash/split.js";
import { describe, expect, it } from "vitest";

import { DedupStateMachine } from "./dedup.js";
import { type InjectableFS, writeGraph } from "./markdown.js";

// ---------------------------------------------------------------------------
// Mock filesystem helpers
// ---------------------------------------------------------------------------

type MockFSState = {
  files: Map<string, string>;
  renameCallCount: number;
  renameFails: boolean;
  writeCallCount: number;
  writeFails: boolean;
};

// ---------------------------------------------------------------------------
// Helper: capture stderr during a callback
// ---------------------------------------------------------------------------
async function captureStderr(callback: () => Promise<void>): Promise<string[]> {
  const lines: string[] = [];
  const orig = process.stderr.write.bind(process.stderr);
  process.stderr.write = ((chunk: string | Uint8Array): boolean => {
    if (isString(chunk)) {
      lines.push(...filter(split(chunk, "\n"), Boolean));
    }
    return orig(chunk);
  }) as typeof process.stderr.write;
  try {
    await callback();
  } finally {
    process.stderr.write = orig;
  }
  return lines;
}

function createMockFS(options?: {
  renameFails?: boolean;
  writeFails?: boolean;
}): {
  fs: InjectableFS;
  state: MockFSState;
} {
  const fsState: MockFSState = {
    files: new Map(),
    renameCallCount: 0,
    renameFails: options?.renameFails ?? false,
    writeCallCount: 0,
    writeFails: options?.writeFails ?? false,
  };
  return {
    fs: {
      rename: async (from: string, to: string): Promise<void> => {
        await Promise.resolve();
        fsState.renameCallCount += 1;
        if (fsState.renameFails) {
          throw assign(new Error("EACCES: permission denied"), {
            code: "EACCES",
          });
        }
        const content = fsState.files.get(from);
        if (content === undefined) {
          throw new Error(`File not found: ${from}`);
        }
        fsState.files.set(to, content);
        fsState.files.delete(from);
      },
      unlink: async (filePath: string): Promise<void> => {
        await Promise.resolve();
        fsState.files.delete(filePath);
      },
      writeFile: async (filePath: string, content: string): Promise<void> => {
        await Promise.resolve();
        fsState.writeCallCount += 1;
        if (fsState.writeFails) {
          throw new Error("ENOSPC: no space left on device");
        }
        fsState.files.set(filePath, content);
      },
    },
    state: fsState,
  };
}

// ===========================================================================
// Test 1: MaxGraphOps boundary — D20, R9
// ===========================================================================

describe("T1: MaxGraphOps boundary (D20, R9)", () => {
  it("3rd addNode succeeds; 4th is silently disabled with epoch-boundary warn", async () => {
    const sm = new DedupStateMachine({ maxGraphOps: 3 });

    // Add 3 nodes — all must succeed
    const r1 = sm.addNode("pkg/a.ts", "file");
    const r2 = sm.addNode("pkg/b.ts", "file");
    const r3 = sm.addNode("pkg/c.ts", "file");

    expect(r1.state).toBe("collecting");
    expect(r2.state).toBe("collecting");
    expect(r3.state).toBe("collecting");
    expect(sm.graphOpsCount).toBe(3);
    expect(sm.graphNodes.has("pkg/a.ts")).toBe(true);
    expect(sm.graphNodes.has("pkg/b.ts")).toBe(true);
    expect(sm.graphNodes.has("pkg/c.ts")).toBe(true);

    // 4th add-operation: silently disabled (epoch boundary)
    const stderrLines = await captureStderr(async () => {
      await Promise.resolve();
      const r4 = sm.addNode("pkg/d.ts", "file");
      // State unchanged; graphOpsCount does NOT increment past max
      expect(sm.graphOpsCount).toBe(3);
      // 4th node is NOT accepted (silently dropped)
      expect(sm.graphNodes.has("pkg/d.ts")).toBe(false);
      // State returned is unchanged (collecting)
      expect(r4.state).toBe("collecting");
    });

    // Epoch-boundary warning emitted to stderr
    const warnLine = find(
      stderrLines,
      (l) => includes(l, "graphOpsCount=") && includes(l, "epoch-boundary"),
    );
    expect(warnLine).toBeDefined();
    expect(warnLine).toMatch(
      /\[WARN: graphOpsCount=3 epoch-boundary enforced\]/u,
    );

    // Epoch produces writeGraph with only the 3 accepted nodes
    const { fs, state: fsState } = createMockFS();
    await writeGraph(sm, { maxAgents: 1, outputPath: "CLAUDE.md" }, fs);

    const content = fsState.files.get("CLAUDE.md");
    expect(content).toContain("pkg/a.ts");
    expect(content).toContain("pkg/b.ts");
    expect(content).toContain("pkg/c.ts");
    expect(content).not.toContain("pkg/d.ts");

    // Lifecycle: writeMarkdown called, machine state advances
    expect(sm.graphState).toBe("done");
    expect(sm.agentsCompleted).toBe(1);
  });

  it("4th operation produces no dedup_error and no retry cycle", () => {
    const forceDedupFired: string[] = [];
    const sm = new DedupStateMachine({
      maxGraphOps: 3,
      onForceDedup: (path) => {
        forceDedupFired.push(path);
      },
    });

    sm.addNode("pkg/a.ts", "file");
    sm.addNode("pkg/b.ts", "file");
    sm.addNode("pkg/c.ts", "file");

    // 4th: silently disabled — no dedup, no force-dedup, no agent notification
    const r4 = sm.addNode("pkg/d.ts", "file");
    expect(r4.state).not.toBe("dedup_error");
    expect(r4.state).not.toBe("force_dedup");
    expect(forceDedupFired).toHaveLength(0);
  });
});

// ===========================================================================
// Test 2: MaxGraphOps=0 zero-budget
// ===========================================================================

describe("T2: MaxGraphOps=0 zero-budget (D20 edge)", () => {
  it("every addNode is immediately disabled; epoch produces empty write", async () => {
    const sm = new DedupStateMachine({ maxGraphOps: 0 });

    const { fs, state: fsState } = createMockFS();

    const warnings = await captureStderr(async () => {
      const r1 = sm.addNode("pkg/a.ts", "file");
      expect(sm.graphNodes.size).toBe(0);
      expect(r1.state).not.toBe("dedup_error");

      await writeGraph(sm, { maxAgents: 1, outputPath: "CLAUDE.md" }, fs);
    });

    // At least one epoch-boundary warn was emitted (from the first add attempt)
    const hasEpochWarn = some(warnings, (l) => includes(l, "epoch-boundary"));
    expect(hasEpochWarn).toBe(true);

    // writeGraph ran (CLAUDE.md exists but has no nodes)
    const content = fsState.files.get("CLAUDE.md") ?? "";
    // Either empty or contains only newline — no node lines
    expect(content).not.toContain("pkg/a.ts");
    expect(sm.agentsCompleted).toBe(1);
  });
});

// ===========================================================================
// Test 3: MaxRetries=0 zero-retries — first duplicate immediately force-dedups
// ===========================================================================

describe("T3: MaxRetries=0 zero-retries (D21)", () => {
  it("first duplicate immediately triggers force-dedup (no retry cycle)", () => {
    const forceDedupPaths: string[] = [];
    const warnMessages: string[] = [];
    const sm = new DedupStateMachine({
      maxRetries: 0,
      onForceDedup: (path) => {
        forceDedupPaths.push(path);
      },
      onWarn: (message) => {
        warnMessages.push(message);
      },
    });

    sm.addNode("pkg/a.ts", "file");
    sm.addNode("pkg/a.ts", "file"); // dedup_error

    // submitRetry immediately fires force_dedup (budget=1 >= maxRetries=0)
    // fireForceDedup transitions graphState back to 'collecting' synchronously,
    // so both the return value and sm.graphState end up as 'collecting'.
    const r = sm.submitRetry("pkg/a.ts", "file");

    // After force_dedup the machine is back in collecting (force_dedup is transient)
    expect(sm.graphState).toBe("collecting");
    // Return value is also 'collecting' because fireForceDedup clears synchronously
    expect(r.state).toBe("collecting");
    expect(forceDedupPaths).toContain("pkg/a.ts");
    expect(some(warnMessages, (m) => includes(m, "force_dedup"))).toBe(true);

    // No retry cycle: retryCount back to 0
    expect(sm.retryCount).toBe(0);
  });
});

// ===========================================================================
// Test 4: D26 concurrent write race — rename failure path
// ===========================================================================

describe("T4: D26 concurrent write race — rename failure", () => {
  it("losing agent rename failure sets markdownState=stale; CLAUDE.md from winning agent intact", async () => {
    // Agent 1 writes successfully: CLAUDE.md in place
    const sm1 = new DedupStateMachine({ maxGraphOps: 10 });
    sm1.addNode("pkg/a.ts", "file");

    const { fs: fs1, state: sharedFs } = createMockFS();
    await writeGraph(sm1, { maxAgents: 2, outputPath: "CLAUDE.md" }, fs1);

    // CLAUDE.md now contains agent 1's nodes
    expect(sharedFs.files.has("CLAUDE.md")).toBe(true);
    expect(sharedFs.files.get("CLAUDE.md")).toContain("pkg/a.ts");

    // Agent 2 rename fails (race: CLAUDE.md locked by another process — D26)
    const sm2 = new DedupStateMachine({ maxGraphOps: 10 });
    sm2.addNode("pkg/b.ts", "file");

    const renameFailing: InjectableFS = {
      rename: async (_from, _to): Promise<void> => {
        await Promise.resolve();
        // rename fails — D26 distinct failure path
        throw assign(new Error("EACCES: permission denied"), {
          code: "EACCES",
        });
      },
      unlink: async (filePath): Promise<void> => {
        await Promise.resolve();
        sharedFs.files.delete(filePath);
      },
      writeFile: async (filePath, content): Promise<void> => {
        await Promise.resolve();
        // tmp write succeeds
        sharedFs.files.set(filePath, content);
      },
    };

    await writeGraph(
      sm2,
      { maxAgents: 2, outputPath: "CLAUDE.md" },
      renameFailing,
    );

    // D26: winning agent's CLAUDE.md is intact (agent 1's content)
    expect(sharedFs.files.get("CLAUDE.md")).toContain("pkg/a.ts");

    // Losing agent: markdownState=stale, agentsCompleted incremented (S34 writeFail still counts)
    expect(sm2.markdownState).toBe("stale");
    expect(sm2.agentsCompleted).toBe(1);

    // Pipeline continues: graphState='collecting' (sm2 is only agent 2 of 2;
    // agentsCompleted=1 < maxAgents=2 — the counter reflects this sm2 instance only).
    // D26: the race does not halt the pipeline; state machine advances normally.
    expect(sm2.graphState).toBe("collecting");
  });
});

// ===========================================================================
// Test 5: D19 retryCount cross-epoch freshness (R10 per-cycle observable)
// ===========================================================================

describe("T5: D19 retryCount cross-epoch freshness", () => {
  it("stage 1: dedup cycle resolves; retryCount=0 entering stage 2", () => {
    const sm = new DedupStateMachine({ maxRetries: 2 });

    // Stage 1 dedup cycle: submit duplicate X → dedup_error → submitRetry(X) → still dup → retryCount=0 (D19)
    sm.addNode("pkg/x.ts", "file");
    sm.addNode("pkg/x.ts", "file"); // dedup_error, retryCount=0 (per-cycle observable)
    expect(sm.graphState).toBe("dedup_error");
    expect(sm.retryCount).toBe(0); // D19: per-cycle observable starts at 0

    // Still duplicate
    sm.submitRetry("pkg/x.ts", "file");
    expect(sm.graphState).toBe("dedup_error");
    expect(sm.retryCount).toBe(0); // D19: still 0

    // Resolve with valid substitute (X-prime)
    const r = sm.submitRetry("pkg/x_prime.ts", "file");
    expect(r.state).toBe("collecting");
    expect(sm.retryCount).toBe(0); // resolved: reset to 0
    expect(sm.graphState).toBe("collecting");

    // writeMarkdown advances epoch
    sm.writeMarkdown(2);
    expect(sm.agentsCompleted).toBe(1);
    expect(sm.graphState).toBe("collecting"); // maxAgents=2, still one left

    // Stage 2: fresh dedup cycle with NEW duplicate X
    sm.addNode("pkg/y.ts", "file");
    sm.addNode("pkg/y.ts", "file"); // new dedup_error in stage 2
    expect(sm.graphState).toBe("dedup_error");
    // D19: retryCount does NOT carry over from stage 1 — starts at 0
    expect(sm.retryCount).toBe(0);

    // GraphRetry fires → retryCount enters dedup_error at 0 (per-cycle observable)
    sm.submitRetry("pkg/y.ts", "file");
    // Still duplicate: retryCount=0 (D19: resets to 0 at each dedup_error re-entry)
    expect(sm.retryCount).toBe(0);
    expect(sm.graphState).toBe("dedup_error");
  });

  it("retryCount observable resets to 0 at each dedup_error entry (D19 boundary)", () => {
    const sm = new DedupStateMachine({ maxRetries: 5 });

    sm.addNode("pkg/a.ts", "file");

    // Trigger dedup_error
    sm.addNode("pkg/a.ts", "file");
    expect(sm.graphState).toBe("dedup_error");
    expect(sm.retryCount).toBe(0); // D19: per-cycle observable = 0 on entry

    // Multiple StillDuplicate retries: retryCount stays 0 (D19)
    sm.submitRetry("pkg/a.ts", "file");
    expect(sm.retryCount).toBe(0);

    sm.submitRetry("pkg/a.ts", "file");
    expect(sm.retryCount).toBe(0);

    // Resolve with a fresh path: retryCount = 0
    sm.submitRetry("pkg/b.ts", "file");
    expect(sm.retryCount).toBe(0);
    expect(sm.graphState).toBe("collecting");
  });
});
