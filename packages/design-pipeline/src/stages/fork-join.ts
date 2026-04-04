import type { PipelineConfig } from "../constants.ts";
import type { PipelineStore } from "../engine/pipeline-store.ts";
import type { ClaudeAdapter } from "../ports/claude-adapter.ts";
import type { GitAdapter } from "../ports/git-adapter.ts";
import type { StageResult } from "./base-coordinator.ts";

import { buildForkJoinPrompt } from "../prompts/fork-join.ts";
import {
  ForkJoinResultSchema,
  type PairSessionResult,
} from "../schemas/index.ts";

export async function executeForkJoin(
  claudeAdapter: ClaudeAdapter,
  gitAdapter: GitAdapter,
  config: PipelineConfig,
  store: PipelineStore,
  pairResult: PairSessionResult,
  runId: string,
): Promise<StageResult> {
  const stage = store.getStage("ForkJoin");

  if ("executing" !== stage.status) {
    return { error: "Stage not executing", success: false };
  }

  const prompt = buildForkJoinPrompt(pairResult);
  const result = await claudeAdapter.executePrompt(prompt);

  if (!result.ok) {
    store.failCurrentStage(result.errorKind);
    return { success: false };
  }

  store.finishExecution();
  const parsed = ForkJoinResultSchema.safeParse(result.data);
  if (!parsed.success) {
    store.validationFail();
    return { success: false };
  }

  store.validationPass(parsed.data);

  const lockAcquired = gitAdapter.acquireLock(runId);
  if (!lockAcquired) {
    store.gitFail();
    return { success: false };
  }

  const commitResult = await gitAdapter.commit(parsed.data.commitMessage);
  if (!commitResult.ok) {
    gitAdapter.releaseLock(runId);
    if (stage.retries >= config.maxRetries) {
      store.gitRetryExhausted(config.maxRetries);
      return { success: false };
    }
    store.gitRetry(config.maxRetries);
    return { success: false };
  }

  gitAdapter.releaseLock(runId);
  store.gitSuccess(parsed.data);
  return { artifact: parsed.data, success: true };
}
