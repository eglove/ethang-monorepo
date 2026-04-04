import { describe, expect, it } from "vitest";

import type { ClaudeResult } from "../ports/claude-adapter.ts";

import { defaultPipelineConfig } from "../constants.ts";
import { TestPipelineStore } from "../engine/test-store.ts";
import { executeTlaWriter } from "./tla-writer.ts";

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

describe("TLA+ Writer", () => {
  const validSynthesis = {
    consensus: "Agreed",
    dissent: [],
    recommendations: ["rec1"],
  };

  it("valid TlaResult passes validation", async () => {
    const adapter = makeAdapter([
      {
        data: {
          cfgContent: "SPECIFICATION Spec",
          tlaContent: "---- MODULE Test ----",
          tlcOutput: "No error",
        },
        ok: true,
      },
    ]);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 3;
      draft.stages.TlaWriter.status = "executing";
    });
    const result = await executeTlaWriter(
      adapter,
      defaultPipelineConfig,
      store,
      validSynthesis,
    );
    expect(result.success).toBe(true);
    expect(result.artifact).toHaveProperty("tlaContent");
  });

  it("invalid output triggers retry path", async () => {
    const adapter = makeAdapter([
      { data: { bad: true }, ok: true },
      {
        data: {
          cfgContent: "SPEC",
          tlaContent: "---- MODULE ----",
          tlcOutput: "OK",
        },
        ok: true,
      },
    ]);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 3;
      draft.stages.TlaWriter.status = "executing";
    });
    const result = await executeTlaWriter(
      adapter,
      defaultPipelineConfig,
      store,
      validSynthesis,
    );
    expect(result.success).toBe(true);
  });

  it("API failures trigger retry", async () => {
    const adapter = makeAdapter([
      {
        errorKind: "claude_api_rate_limit",
        message: "Rate limited",
        ok: false,
      },
      {
        data: {
          cfgContent: "CFG",
          tlaContent: "MODULE",
          tlcOutput: "OK",
        },
        ok: true,
      },
    ]);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 3;
      draft.stages.TlaWriter.status = "executing";
    });
    const result = await executeTlaWriter(
      adapter,
      defaultPipelineConfig,
      store,
      validSynthesis,
    );
    expect(result.success).toBe(true);
  });
});
