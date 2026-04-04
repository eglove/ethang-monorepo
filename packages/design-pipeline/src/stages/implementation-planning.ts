import type { PipelineConfig } from "../constants.ts";
import type { PipelineStore } from "../engine/pipeline-store.ts";
import type { ClaudeAdapter } from "../ports/claude-adapter.ts";

import {
  buildImplementationPlanningPrompt,
  type PlanningContext,
} from "../prompts/implementation-planning.ts";
import { ImplementationPlanSchema } from "../schemas/index.ts";
import { executeWithValidation, type StageResult } from "./base-coordinator.ts";

export async function executeImplementationPlanning(
  claudeAdapter: ClaudeAdapter,
  config: PipelineConfig,
  store: PipelineStore,
  context: PlanningContext,
): Promise<StageResult> {
  const stage = store.getStage("ImplementationPlanning");
  if ("executing" !== stage.status) {
    return { error: "Stage not in executing state", success: false };
  }

  const prompt = buildImplementationPlanningPrompt(context);

  return executeWithValidation(
    claudeAdapter,
    prompt,
    (data) => {
      const parsed = ImplementationPlanSchema.safeParse(data);
      if (parsed.success) {
        return { data: parsed.data, success: true };
      }
      return { error: parsed.error.message, success: false };
    },
    config,
    store,
  );
}

export async function executeStreamingConfirmation(
  claudeAdapter: ClaudeAdapter,
  store: PipelineStore,
  maxStreamTurns: number,
  userMessages: string[],
): Promise<{ turns: number }> {
  let turns = 0;

  for (const message of userMessages) {
    if (turns >= maxStreamTurns) {
      store.streamLimitReached(maxStreamTurns);
      return { turns };
    }

    // eslint-disable-next-line no-await-in-loop
    await claudeAdapter.streamPrompt(message);
    turns += 1;
    store.streamInput(maxStreamTurns);
  }

  return { turns };
}
