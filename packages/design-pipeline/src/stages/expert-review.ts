import type { PipelineConfig } from "../constants.ts";
import type { PipelineStore } from "../engine/pipeline-store.ts";
import type { ClaudeAdapter } from "../ports/claude-adapter.ts";

import { buildExpertReviewPrompt } from "../prompts/expert-review.ts";
import { type TlaResult, TlaReviewSynthesisSchema } from "../schemas/index.ts";
import { executeWithValidation, type StageResult } from "./base-coordinator.ts";

export async function executeExpertReview(
  claudeAdapter: ClaudeAdapter,
  config: PipelineConfig,
  store: PipelineStore,
  tlaResult: TlaResult,
): Promise<StageResult> {
  const stage = store.getStage("ExpertReview");
  if ("executing" !== stage.status) {
    return { error: "Stage not in executing state", success: false };
  }

  const prompt = buildExpertReviewPrompt(tlaResult);

  return executeWithValidation(
    claudeAdapter,
    prompt,
    (data) => {
      const parsed = TlaReviewSynthesisSchema.safeParse(data);
      if (parsed.success) {
        return { data: parsed.data, success: true };
      }
      return { error: parsed.error.message, success: false };
    },
    config,
    store,
  );
}
