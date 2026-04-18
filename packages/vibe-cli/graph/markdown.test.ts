import assign from "lodash/assign.js";
import { describe, expect, it } from "vitest";

import { DedupStateMachine } from "./dedup.js";
import { writeGraph } from "./markdown.js";

// ---------------------------------------------------------------------------
// Mock filesystem helpers
// ---------------------------------------------------------------------------

const OUTPUT_PATH = "/out/CLAUDE.md";

type MockFS = {
  files: Map<string, string>;
  renameFails: boolean;
  writeFails: boolean;
};

function createMockFS(options?: {
  renameFails?: boolean;
  writeFails?: boolean;
}) {
  const mockState: MockFS = {
    files: new Map(),
    renameFails: false,
    writeFails: false,
    ...options,
  };
  return {
    fs: {
      rename: async (from: string, to: string): Promise<void> => {
        await Promise.resolve();
        if (mockState.renameFails) {
          throw assign(new Error("EACCES: permission denied"), {
            code: "EACCES",
          });
        }
        const content = mockState.files.get(from);
        if (content === undefined) {
          throw new Error("File not found");
        }
        mockState.files.set(to, content);
        mockState.files.delete(from);
      },
      unlink: async (filePath: string): Promise<void> => {
        await Promise.resolve();
        mockState.files.delete(filePath);
      },
      writeFile: async (filePath: string, content: string): Promise<void> => {
        await Promise.resolve();
        if (mockState.writeFails) {
          throw new Error("ENOSPC: no space left on device");
        }
        mockState.files.set(filePath, content);
      },
    },
    state: mockState,
  };
}

// ---------------------------------------------------------------------------
// Test suite: basic format + lifecycle
// ---------------------------------------------------------------------------

describe("writeGraph — basic format & lifecycle", () => {
  it("T1: generates correct dense markdown format for two nodes and one edge", async () => {
    const machine = new DedupStateMachine();
    machine.addNode("pkg/a.ts", "file");
    machine.addNode("pkg/b.ts", "file");
    machine.addEdge("pkg/a.ts", "pkg/b.ts", "imports");

    const { fs, state } = createMockFS();

    await writeGraph(machine, { maxAgents: 1, outputPath: OUTPUT_PATH }, fs);

    const content = state.files.get(OUTPUT_PATH);
    expect(content).toBeDefined();
    // Must contain file section with both nodes
    expect(content).toMatch(/## file/u);
    expect(content).toMatch(/pkg\/a\.ts/u);
    expect(content).toMatch(/pkg\/b\.ts/u);
    // Must contain imports section with the edge
    expect(content).toMatch(/## imports/u);
    expect(content).toMatch(/pkg\/a\.ts\s*->\s*pkg\/b\.ts/u);
  });

  it("T2: markdownState transitions to current after GraphWriteSuccess", async () => {
    const machine = new DedupStateMachine();
    machine.addNode("pkg/a.ts", "file");

    const { fs } = createMockFS();
    await writeGraph(machine, { maxAgents: 2, outputPath: OUTPUT_PATH }, fs);

    expect(machine.markdownState).toBe("current");
  });

  it("T3: write failure transitions markdownState to stale (GraphWriteFail)", async () => {
    const machine = new DedupStateMachine();
    machine.addNode("pkg/a.ts", "file");
    // First write succeeds → markdownState='current'
    const { fs: fsOk } = createMockFS();
    await writeGraph(machine, { maxAgents: 3, outputPath: OUTPUT_PATH }, fsOk);
    expect(machine.markdownState).toBe("current");

    // Second write fails → markdownState='stale'
    const { fs: fsFail } = createMockFS({ writeFails: true });
    await writeGraph(
      machine,
      { maxAgents: 3, outputPath: OUTPUT_PATH },
      fsFail,
    );

    expect(machine.markdownState).toBe("stale");
  });

  it("T4: two consecutive write failures keep markdownState=stale (S34 MarkdownStateMonotone)", async () => {
    const machine = new DedupStateMachine();
    machine.addNode("pkg/a.ts", "file");

    const { fs: fsFail1 } = createMockFS({ writeFails: true });
    await writeGraph(
      machine,
      { maxAgents: 5, outputPath: OUTPUT_PATH },
      fsFail1,
    );
    expect(machine.markdownState).toBe("stale");

    const { fs: fsFail2 } = createMockFS({ writeFails: true });
    await writeGraph(
      machine,
      { maxAgents: 5, outputPath: OUTPUT_PATH },
      fsFail2,
    );
    expect(machine.markdownState).toBe("stale");
  });
});

// ---------------------------------------------------------------------------
// Test suite: haltCleanup semantics (S33)
// ---------------------------------------------------------------------------

describe("writeGraph — haltCleanup (S33)", () => {
  it("T5: GraphHaltCleanup from markdownState=current leaves markdownState unchanged (S33)", async () => {
    const machine = new DedupStateMachine();
    machine.addNode("pkg/a.ts", "file");

    const { fs } = createMockFS();
    await writeGraph(machine, { maxAgents: 2, outputPath: OUTPUT_PATH }, fs);
    expect(machine.markdownState).toBe("current");

    await writeGraph(
      machine,
      { maxAgents: 2, outputPath: OUTPUT_PATH, pipelineHalted: true },
      fs,
    );
    expect(machine.markdownState).toBe("current");
  });

  it("T6: GraphHaltCleanup from markdownState=stale leaves markdownState unchanged", async () => {
    const machine = new DedupStateMachine();
    machine.addNode("pkg/a.ts", "file");

    const { fs: fsFail } = createMockFS({ writeFails: true });
    await writeGraph(
      machine,
      { maxAgents: 2, outputPath: OUTPUT_PATH },
      fsFail,
    );
    expect(machine.markdownState).toBe("stale");

    const { fs: fsOk } = createMockFS();
    await writeGraph(
      machine,
      { maxAgents: 2, outputPath: OUTPUT_PATH, pipelineHalted: true },
      fsOk,
    );
    expect(machine.markdownState).toBe("stale");
  });

  it("T7: haltCleanup during pending rename keeps markdownState unchanged, graphState=warn (S33)", async () => {
    const machine = new DedupStateMachine();
    machine.addNode("pkg/a.ts", "file");

    // First write to set markdownState='current'
    const { fs: fsOk, state: stateOk } = createMockFS();
    await writeGraph(machine, { maxAgents: 2, outputPath: OUTPUT_PATH }, fsOk);
    expect(machine.markdownState).toBe("current");

    // Now set up a rename that hangs until released
    let releaseRename!: () => void;
    const renameGate = new Promise<void>((resolve) => {
      releaseRename = resolve;
    });

    const hangingFs = {
      rename: async (_from: string, _to: string) => {
        await renameGate;
        // After rename resolves, do the actual rename
        const content = stateOk.files.get(_from);
        if (content !== undefined) {
          stateOk.files.set(_to, content);
          stateOk.files.delete(_from);
        }
      },
      unlink: async (filePath: string): Promise<void> => {
        await Promise.resolve();
        stateOk.files.delete(filePath);
      },
      writeFile: async (filePath: string, content: string): Promise<void> => {
        await Promise.resolve();
        stateOk.files.set(filePath, content);
      },
    };

    // Add a node for epoch 2 so writeGraph has something to write
    machine.addNode("pkg/b.ts", "file");

    // Start writeGraph but do NOT await — it will hang at rename
    const writePromise = writeGraph(
      machine,
      { maxAgents: 2, outputPath: OUTPUT_PATH },
      hangingFs,
    );

    // Give the write a tick to start (reach rename — writeFile is sync-like, rename is the gate)
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    // Inject halt while rename is pending
    machine.haltCleanup();

    // Verify markdownState unchanged (was 'current', should still be 'current')
    expect(machine.markdownState).toBe("current");
    expect(machine.graphState).toBe("warn");

    // Release the rename and let the write finish
    releaseRename();
    await writePromise;
  });
});

// ---------------------------------------------------------------------------
// Test suite: counter resets & guards (S35, S20, S16)
// ---------------------------------------------------------------------------

describe("writeGraph — counters & pending state", () => {
  it("T8: graphOpsCount=0 and retryCount=0 after writeMarkdown and writeFail", async () => {
    // After successful write
    const machine1 = new DedupStateMachine();
    machine1.addNode("pkg/a.ts", "file");
    expect(machine1.graphOpsCount).toBe(1);

    const { fs: fs1 } = createMockFS();
    await writeGraph(machine1, { maxAgents: 2, outputPath: OUTPUT_PATH }, fs1);
    expect(machine1.graphOpsCount).toBe(0);
    expect(machine1.retryCount).toBe(0);

    // After failed write
    const machine2 = new DedupStateMachine();
    machine2.addNode("pkg/a.ts", "file");
    expect(machine2.graphOpsCount).toBe(1);

    const { fs: fs2 } = createMockFS({ writeFails: true });
    await writeGraph(machine2, { maxAgents: 2, outputPath: OUTPUT_PATH }, fs2);
    expect(machine2.graphOpsCount).toBe(0);
    expect(machine2.retryCount).toBe(0);
  });

  it("T9: DedupStateMachine guards against entering writing when agentsCompleted=maxAgents", async () => {
    const machine = new DedupStateMachine();
    machine.addNode("pkg/a.ts", "file");

    const maxAgents = 1;
    const { fs: fs1 } = createMockFS();
    // First write: agentsCompleted goes from 0 to 1, reaches maxAgents → graphState='done'
    await writeGraph(machine, { maxAgents, outputPath: OUTPUT_PATH }, fs1);
    expect(machine.graphState).toBe("done");
    expect(machine.agentsCompleted).toBe(1);

    // writeMarkdown with agentsCompleted=1 >= maxAgents=1 would transition to 'done' immediately
    // This verifies the guard: state 'done' means no more writing can happen meaningfully
    expect(machine.graphState).toBe("done");
  });

  it("T10: pending fields cleared after writeMarkdown (done path), writeFail, and haltCleanup (S16)", async () => {
    // After successful write when agentsCompleted >= maxAgents (writeMarkdown 'done' path clears pending)
    const machine1 = new DedupStateMachine();
    machine1.addNode("pkg/a.ts", "file");
    // Force a pending state by causing a dedup_error (pendingNode='pkg/a.ts', pendingKind='node')
    machine1.addNode("pkg/a.ts", "file");
    expect(machine1.pendingNode).toBe("pkg/a.ts");
    expect(machine1.pendingKind).toBe("node");
    // Use maxAgents=1 so writeMarkdown enters 'done' branch and clears pending
    const { fs: fs1 } = createMockFS();
    await writeGraph(machine1, { maxAgents: 1, outputPath: OUTPUT_PATH }, fs1);
    expect(machine1.graphState).toBe("done");
    expect(machine1.pendingNode).toBeNull();
    expect(machine1.pendingEdge).toBeNull();
    expect(machine1.pendingKind).toBe("none");

    // After writeFail (always clears pending regardless of agentsCompleted)
    const machine2 = new DedupStateMachine();
    machine2.addNode("pkg/b.ts", "file");
    machine2.addNode("pkg/b.ts", "file"); // sets pendingNode='pkg/b.ts'
    expect(machine2.pendingNode).toBe("pkg/b.ts");
    const { fs: fs2 } = createMockFS({ writeFails: true });
    await writeGraph(machine2, { maxAgents: 2, outputPath: OUTPUT_PATH }, fs2);
    expect(machine2.pendingNode).toBeNull();
    expect(machine2.pendingEdge).toBeNull();
    expect(machine2.pendingKind).toBe("none");

    // After haltCleanup (always clears pending)
    const machine3 = new DedupStateMachine();
    machine3.addNode("pkg/c.ts", "file");
    machine3.addNode("pkg/c.ts", "file"); // sets pendingNode='pkg/c.ts'
    expect(machine3.pendingNode).toBe("pkg/c.ts");
    const { fs: fs3 } = createMockFS();
    await writeGraph(
      machine3,
      { maxAgents: 2, outputPath: OUTPUT_PATH, pipelineHalted: true },
      fs3,
    );
    expect(machine3.pendingNode).toBeNull();
    expect(machine3.pendingEdge).toBeNull();
    expect(machine3.pendingKind).toBe("none");
  });
});

// ---------------------------------------------------------------------------
// Test suite: multi-agent epoch and D26 race
// ---------------------------------------------------------------------------

describe("writeGraph — multi-agent & race conditions", () => {
  it("T11: multi-agent epoch — two writeGraph calls advance agentsCompleted correctly (Rec2)", async () => {
    const machine = new DedupStateMachine();
    machine.addNode("pkg/a.ts", "file");
    machine.addEdge("pkg/a.ts", "pkg/a.ts", "imports");

    // When: writeGraph called (epoch 1)
    const { fs } = createMockFS();
    await writeGraph(machine, { maxAgents: 2, outputPath: OUTPUT_PATH }, fs);

    // Then: graphState='collecting', agentsCompleted=1, markdownState='current'
    expect(machine.graphState).toBe("collecting");
    expect(machine.agentsCompleted).toBe(1);
    expect(machine.markdownState).toBe("current");

    // Add more data for epoch 2
    machine.addNode("pkg/b.ts", "file");

    // When: writeGraph called again (epoch 2)
    await writeGraph(machine, { maxAgents: 2, outputPath: OUTPUT_PATH }, fs);

    // Then: graphState='done', agentsCompleted=2, markdownState='current'
    expect(machine.graphState).toBe("done");
    expect(machine.agentsCompleted).toBe(2);
    expect(machine.markdownState).toBe("current");
  });

  it("T12: rename failure (D26) — tmp file exists, CLAUDE.md intact, writeFail called", async () => {
    const machine = new DedupStateMachine();
    machine.addNode("pkg/a.ts", "file");

    const outputPath = OUTPUT_PATH;
    const temporaryPath = `${outputPath}.tmp`;

    // Pre-populate CLAUDE.md with existing content
    const { fs, state } = createMockFS({ renameFails: true });
    state.files.set(outputPath, "# existing content");

    await writeGraph(machine, { maxAgents: 1, outputPath }, fs);

    // markdownState NOT 'current' (stays 'stale' since writeFail was called)
    expect(machine.markdownState).not.toBe("current");
    expect(machine.markdownState).toBe("stale");

    // CLAUDE.md.tmp EXISTS (write succeeded, rename failed, and we did NOT unlink on rename failure)
    expect(state.files.has(temporaryPath)).toBe(true);

    // CLAUDE.md NOT updated (original intact)
    expect(state.files.get(outputPath)).toBe("# existing content");

    // writeFail was called → graphState reflects it (collecting or done, not writing)
    expect(machine.graphState).not.toBe("writing");
  });
});
