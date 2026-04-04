import { describe, expect, it } from "vitest";

import type { ClaudeResult } from "../ports/claude-adapter.ts";

import { defaultPipelineConfig } from "../constants.ts";
import { TestPipelineStore } from "../engine/test-store.ts";
import { executeExpertReview } from "./expert-review.ts";

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

describe("Expert Review", () => {
  const validTlaResult = {
    cfgContent: "CFG",
    tlaContent: "MODULE",
    tlcOutput: "OK",
  };

  it("valid TlaReviewSynthesis passes validation", async () => {
    const adapter = makeAdapter([
      {
        data: {
          amendments: ["amend1"],
          consensus: "Sound spec",
          gaps: ["gap1"],
        },
        ok: true,
      },
    ]);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 4;
      draft.stages.ExpertReview.status = "executing";
    });
    const result = await executeExpertReview(
      adapter,
      defaultPipelineConfig,
      store,
      validTlaResult,
    );
    expect(result.success).toBe(true);
    expect(result.artifact).toHaveProperty("consensus");
  });

  it("invalid output triggers retry", async () => {
    const adapter = makeAdapter([
      { data: { bad: true }, ok: true },
      {
        data: {
          amendments: [],
          consensus: "OK",
          gaps: [],
        },
        ok: true,
      },
    ]);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 4;
      draft.stages.ExpertReview.status = "executing";
    });
    const result = await executeExpertReview(
      adapter,
      defaultPipelineConfig,
      store,
      validTlaResult,
    );
    expect(result.success).toBe(true);
  });

  it("API failures trigger retry", async () => {
    const adapter = makeAdapter([
      { errorKind: "claude_api_timeout", message: "Timeout", ok: false },
      {
        data: {
          amendments: [],
          consensus: "OK",
          gaps: [],
        },
        ok: true,
      },
    ]);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 4;
      draft.stages.ExpertReview.status = "executing";
    });
    const result = await executeExpertReview(
      adapter,
      defaultPipelineConfig,
      store,
      validTlaResult,
    );
    expect(result.success).toBe(true);
  });
});
