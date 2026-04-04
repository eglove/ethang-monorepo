import type { PipelineConfig, StageName } from "../constants.ts";
import type { PipelineStore } from "../engine/pipeline-store.ts";
import type { ClaudeAdapter } from "../ports/claude-adapter.ts";
import type { StageRecord } from "../types/stage.ts";

export type StageCoordinatorDeps = {
  claudeAdapter: ClaudeAdapter;
  config: PipelineConfig;
};

export type StageResult = {
  artifact?: unknown;
  error?: string;
  errorKind?: string;
  success: boolean;
};

export async function executeWithValidation(
  claudeAdapter: ClaudeAdapter,
  prompt: string,
  validate: (data: unknown) => {
    data?: unknown;
    error?: string;
    success: boolean;
  },
  config: PipelineConfig,
  store: PipelineStore,
): Promise<StageResult> {
  let retries = 0;

  while (retries <= config.maxRetries) {
    // eslint-disable-next-line no-await-in-loop
    const result = await claudeAdapter.executePrompt(prompt);

    if (result.ok) {
      store.finishExecution();
      const validation = validate(result.data);
      if (validation.success) {
        store.validationPass(validation.data ?? result.data);
        return {
          artifact: validation.data ?? result.data,
          success: true,
        };
      }
      if (retries >= config.maxRetries) {
        store.validationFail();
        store.retryExhausted(config.maxRetries);
        return {
          error: validation.error ?? "validation_failed",
          success: false,
        };
      }
      store.validationFail();
      retries += 1;
      store.retryAfterValidationFail(config.maxRetries);
      store.retryToExecuting();
    } else {
      if (retries >= config.maxRetries) {
        store.claudeApiFailExhausted(config.maxRetries);
        return { errorKind: result.errorKind, success: false };
      }
      store.claudeApiFail(result.errorKind, config.maxRetries);
      retries += 1;
      store.retryToExecuting();
    }
  }

  return { error: "retry_exhausted", success: false };
}

export function getStageRecord(
  store: PipelineStore,
  stageName: StageName,
): StageRecord {
  return store.getStage(stageName);
}
