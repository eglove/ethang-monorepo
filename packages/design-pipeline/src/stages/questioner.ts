import type { PipelineConfig } from "../constants.ts";
import type { PipelineStore } from "../engine/pipeline-store.ts";
import type { ClaudeAdapter } from "../ports/claude-adapter.ts";

import { buildQuestionerPrompt } from "../prompts/questioner.ts";
import { BriefingResultSchema } from "../schemas/index.ts";
import { executeWithValidation, type StageResult } from "./base-coordinator.ts";

export async function executeQuestioner(
  claudeAdapter: ClaudeAdapter,
  config: PipelineConfig,
  store: PipelineStore,
  context: string,
): Promise<StageResult> {
  const stage = store.getStage("Questioner");
  if ("executing" !== stage.status) {
    return { error: "Stage not in executing state", success: false };
  }

  const prompt = buildQuestionerPrompt(context);

  return executeWithValidation(
    claudeAdapter,
    prompt,
    (data) => {
      const parsed = BriefingResultSchema.safeParse(data);
      if (parsed.success) {
        return { data: parsed.data, success: true };
      }
      return { error: parsed.error.message, success: false };
    },
    config,
    store,
  );
}

export async function executeStreaming(
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
