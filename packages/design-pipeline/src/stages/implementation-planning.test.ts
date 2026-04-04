import { describe, expect, it } from "vitest";

import type { ClaudeResult } from "../ports/claude-adapter.ts";

import { defaultPipelineConfig } from "../constants.ts";
import { TestPipelineStore } from "../engine/test-store.ts";
import {
  executeImplementationPlanning,
  executeStreamingConfirmation,
} from "./implementation-planning.ts";

function makeAdapter(responses: ClaudeResult[]) {
  let index = 0;
  return {
    async executePrompt() {
      await Promise.resolve();
      const r = responses[index] ?? { data: {}, ok: true as const };
      index += 1;
      return r;
    },
    async routePairMessage() {
      await Promise.resolve();
      return { data: {}, ok: true as const };
    },
    async streamPrompt() {
      await Promise.resolve();
      const r = responses[index] ?? { data: {}, ok: true as const };
      index += 1;
      return r;
    },
  };
}

describe("Implementation Planning Streaming", () => {
  it("streaming confirmation works with >= 1 turn", async () => {
    const adapter = makeAdapter([{ data: {}, ok: true }]);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 5;
      draft.stages.ImplementationPlanning.status = "streaming_input";
    });
    const result = await executeStreamingConfirmation(adapter, store, 20, [
      "confirm",
    ]);
    expect(result.turns).toBe(1);
  });

  it("MaxStreamTurns triggers stream_limit_exceeded (Gap 3)", async () => {
    const adapter = makeAdapter([
      { data: {}, ok: true },
      { data: {}, ok: true },
      { data: {}, ok: true },
    ]);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 5;
      draft.stages.ImplementationPlanning.status = "streaming_input";
    });
    const result = await executeStreamingConfirmation(adapter, store, 2, [
      "a",
      "b",
      "c",
    ]);
    expect(result.turns).toBe(2);
    expect(store.state.stages.ImplementationPlanning.status).toBe("failed");
    expect(store.state.stages.ImplementationPlanning.error).toBe(
      "stream_limit_exceeded",
    );
  });
});

describe("Implementation Planning Execution", () => {
  const planningContext = {
    briefing: { constraints: ["c"], requirements: ["r"], summary: "S" },
    debateSynthesis: { consensus: "C", dissent: [], recommendations: [] },
    tlaResult: { cfgContent: "C", tlaContent: "T", tlcOutput: "O" },
    tlaReviewSynthesis: { amendments: [], consensus: "R", gaps: [] },
  };

  it("valid ImplementationPlan passes validation", async () => {
    const adapter = makeAdapter([
      {
        data: {
          steps: [{ files: ["f.ts"], id: "T1", title: "Step 1" }],
          tiers: [{ taskIds: ["T1"], tier: 1 }],
        },
        ok: true,
      },
    ]);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 5;
      draft.stages.ImplementationPlanning.status = "executing";
    });
    const result = await executeImplementationPlanning(
      adapter,
      defaultPipelineConfig,
      store,
      planningContext,
    );
    expect(result.success).toBe(true);
    expect(result.artifact).toHaveProperty("steps");
  });

  it("invalid output triggers retry", async () => {
    const adapter = makeAdapter([
      { data: { bad: true }, ok: true },
      {
        data: {
          steps: [{ files: ["f.ts"], id: "T1", title: "S1" }],
          tiers: [{ taskIds: ["T1"], tier: 1 }],
        },
        ok: true,
      },
    ]);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 5;
      draft.stages.ImplementationPlanning.status = "executing";
    });
    const result = await executeImplementationPlanning(
      adapter,
      defaultPipelineConfig,
      store,
      planningContext,
    );
    expect(result.success).toBe(true);
  });
});
