import type { PipelineConfig } from "../constants.ts";
import type { PipelineStore } from "../engine/pipeline-store.ts";
import type { ClaudeAdapter } from "../ports/claude-adapter.ts";

import { buildTlaWriterPrompt } from "../prompts/tla-writer.ts";
import { type DebateSynthesis, TlaResultSchema } from "../schemas/index.ts";
import { executeWithValidation, type StageResult } from "./base-coordinator.ts";

export async function executeTlaWriter(
  claudeAdapter: ClaudeAdapter,
  config: PipelineConfig,
  store: PipelineStore,
  synthesis: DebateSynthesis,
): Promise<StageResult> {
  const stage = store.getStage("TlaWriter");
  if ("executing" !== stage.status) {
    return { error: "Stage not in executing state", success: false };
  }

  const prompt = buildTlaWriterPrompt(synthesis);

  return executeWithValidation(
    claudeAdapter,
    prompt,
    (data) => {
      const parsed = TlaResultSchema.safeParse(data);
      if (parsed.success) {
        return { data: parsed.data, success: true };
      }
      return { error: parsed.error.message, success: false };
    },
    config,
    store,
  );
}
