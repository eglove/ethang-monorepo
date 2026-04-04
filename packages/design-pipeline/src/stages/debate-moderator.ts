import type { PipelineConfig } from "../constants.ts";
import type { PipelineStore } from "../engine/pipeline-store.ts";
import type { ClaudeAdapter } from "../ports/claude-adapter.ts";

import { buildDebateModeratorPrompt } from "../prompts/debate-moderator.ts";
import {
  type BriefingResult,
  DebateSynthesisSchema,
} from "../schemas/index.ts";
import { executeWithValidation, type StageResult } from "./base-coordinator.ts";

export async function executeDebateModerator(
  claudeAdapter: ClaudeAdapter,
  config: PipelineConfig,
  store: PipelineStore,
  briefing: BriefingResult,
): Promise<StageResult> {
  const stage = store.getStage("DebateModerator");
  if ("executing" !== stage.status) {
    return { error: "Stage not in executing state", success: false };
  }

  const prompt = buildDebateModeratorPrompt(briefing);

  return executeWithValidation(
    claudeAdapter,
    prompt,
    (data) => {
      const parsed = DebateSynthesisSchema.safeParse(data);
      if (parsed.success) {
        return { data: parsed.data, success: true };
      }
      return { error: parsed.error.message, success: false };
    },
    config,
    store,
  );
}
