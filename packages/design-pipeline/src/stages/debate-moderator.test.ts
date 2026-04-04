import { describe, expect, it } from "vitest";

import type { ClaudeResult } from "../ports/claude-adapter.ts";

import { defaultPipelineConfig } from "../constants.ts";
import { TestPipelineStore } from "../engine/test-store.ts";
import { executeDebateModerator } from "./debate-moderator.ts";

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
      return { data: {}, ok: true as const };
    },
  };
}

describe("Debate Moderator", () => {
  const validBriefing = {
    constraints: ["con1"],
    requirements: ["req1"],
    summary: "Test",
  };

  it("stage begins from pending -> executing produces valid DebateSynthesis", async () => {
    const adapter = makeAdapter([
      {
        data: {
          consensus: "Agreed",
          dissent: ["minor"],
          recommendations: ["rec1"],
        },
        ok: true,
      },
    ]);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 2;
      draft.stages.DebateModerator.status = "executing";
    });
    const result = await executeDebateModerator(
      adapter,
      defaultPipelineConfig,
      store,
      validBriefing,
    );
    expect(result.success).toBe(true);
    expect(result.artifact).toHaveProperty("consensus");
  });

  it("invalid output triggers validation retry", async () => {
    const adapter = makeAdapter([
      { data: { invalid: true }, ok: true },
      {
        data: {
          consensus: "Valid",
          dissent: [],
          recommendations: [],
        },
        ok: true,
      },
    ]);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 2;
      draft.stages.DebateModerator.status = "executing";
    });
    const result = await executeDebateModerator(
      adapter,
      defaultPipelineConfig,
      store,
      validBriefing,
    );
    expect(result.success).toBe(true);
  });

  it("retry exhaustion transitions to failed", async () => {
    const config = { ...defaultPipelineConfig, maxRetries: 1 };
    const adapter = makeAdapter([
      { data: { bad: true }, ok: true },
      { data: { bad: true }, ok: true },
    ]);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 2;
      draft.stages.DebateModerator.status = "executing";
    });
    const result = await executeDebateModerator(
      adapter,
      config,
      store,
      validBriefing,
    );
    expect(result.success).toBe(false);
    expect(store.state.stages.DebateModerator.status).toBe("failed");
  });

  it("Claude API timeout during execution triggers retry", async () => {
    const adapter = makeAdapter([
      { errorKind: "claude_api_timeout", message: "Timeout", ok: false },
      {
        data: {
          consensus: "OK",
          dissent: [],
          recommendations: [],
        },
        ok: true,
      },
    ]);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 2;
      draft.stages.DebateModerator.status = "executing";
    });
    const result = await executeDebateModerator(
      adapter,
      defaultPipelineConfig,
      store,
      validBriefing,
    );
    expect(result.success).toBe(true);
  });
});
