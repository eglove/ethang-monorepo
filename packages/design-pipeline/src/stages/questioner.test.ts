import times from "lodash/times.js";
import { describe, expect, it } from "vitest";

import type { ClaudeResult } from "../ports/claude-adapter.ts";

import { defaultPipelineConfig } from "../constants.ts";
import { TestPipelineStore } from "../engine/test-store.ts";
import { executeQuestioner, executeStreaming } from "./questioner.ts";

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

describe("Questioner Streaming", () => {
  it("streaming input increments turn counter", async () => {
    const adapter = makeAdapter([
      { data: {}, ok: true },
      { data: {}, ok: true },
    ]);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 1;
      draft.stages.Questioner.status = "streaming_input";
    });
    const result = await executeStreaming(adapter, store, 20, ["msg1", "msg2"]);
    expect(result.turns).toBe(2);
    expect(store.state.stages.Questioner.turns).toBe(2);
  });

  it("completing streaming with 0 turns produces 0 turns", async () => {
    const adapter = makeAdapter([]);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 1;
      draft.stages.Questioner.status = "streaming_input";
    });
    const result = await executeStreaming(adapter, store, 20, []);
    expect(result.turns).toBe(0);
  });

  it("reaching MaxStreamTurns triggers stream_limit_exceeded (Gap 3)", async () => {
    const messages = times(3, (index) => `msg${String(index)}`);
    const adapter = makeAdapter(
      times(messages.length, () => ({ data: {}, ok: true as const })),
    );
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 1;
      draft.stages.Questioner.status = "streaming_input";
    });
    const result = await executeStreaming(adapter, store, 2, messages);
    expect(result.turns).toBe(2);
    expect(store.state.stages.Questioner.status).toBe("failed");
    expect(store.state.stages.Questioner.error).toBe("stream_limit_exceeded");
  });
});

describe("Questioner Execution", () => {
  it("execution produces a BriefingResult that passes Zod validation", async () => {
    const adapter = makeAdapter([
      {
        data: {
          constraints: ["con1"],
          requirements: ["req1"],
          summary: "Test summary",
        },
        ok: true,
      },
    ]);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 1;
      draft.stages.Questioner.status = "executing";
    });
    const result = await executeQuestioner(
      adapter,
      defaultPipelineConfig,
      store,
      "context",
    );
    expect(result.success).toBe(true);
    expect(result.artifact).toHaveProperty("summary");
  });

  it("invalid Claude output triggers validation_failed and retry", async () => {
    const adapter = makeAdapter([
      { data: { invalid: true }, ok: true },
      {
        data: {
          constraints: ["con"],
          requirements: ["req"],
          summary: "Valid",
        },
        ok: true,
      },
    ]);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 1;
      draft.stages.Questioner.status = "executing";
    });
    const result = await executeQuestioner(
      adapter,
      defaultPipelineConfig,
      store,
      "context",
    );
    expect(result.success).toBe(true);
  });

  it("retry exhaustion transitions to failed", async () => {
    const config = { ...defaultPipelineConfig, maxRetries: 1 };
    const adapter = makeAdapter([
      { data: { invalid: true }, ok: true },
      { data: { invalid: true }, ok: true },
    ]);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 1;
      draft.stages.Questioner.status = "executing";
    });
    const result = await executeQuestioner(adapter, config, store, "context");
    expect(result.success).toBe(false);
    expect(store.state.stages.Questioner.status).toBe("failed");
  });
});
