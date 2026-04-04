import type { PipelineConfig } from "../constants.ts";
import type { PipelineStore } from "../engine/pipeline-store.ts";
import type { ClaudeAdapter } from "../ports/claude-adapter.ts";
import type { GitAdapter } from "../ports/git-adapter.ts";
import type { StageResult } from "./base-coordinator.ts";

import { buildPairProgrammingPrompt } from "../prompts/pair-programming.ts";
import {
  type ImplementationPlan,
  PairSessionResultSchema,
} from "../schemas/index.ts";

export async function executePairProgramming(
  claudeAdapter: ClaudeAdapter,
  gitAdapter: GitAdapter,
  config: PipelineConfig,
  store: PipelineStore,
  plan: ImplementationPlan,
  runId: string,
): Promise<StageResult> {
  const stage = store.getStage("PairProgramming");

  if ("executing" !== stage.status) {
    return { error: "Stage not executing", success: false };
  }

  const prompt = buildPairProgrammingPrompt(plan);
  const result = await claudeAdapter.executePrompt(prompt);

  if (!result.ok) {
    store.failCurrentStage(result.errorKind);
    return { success: false };
  }

  store.finishExecution();
  const parsed = PairSessionResultSchema.safeParse(result.data);
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

export async function executePairRouting(
  claudeAdapter: ClaudeAdapter,
  store: PipelineStore,
  plan: ImplementationPlan,
  config: PipelineConfig,
): Promise<{ error?: string; success: boolean }> {
  const stage = store.getStage("PairProgramming");

  if ("pair_routing" !== stage.status) {
    return {
      error: "Stage not in pair_routing",
      success: false,
    };
  }

  const prompt = buildPairProgrammingPrompt(plan);
  const result = await claudeAdapter.routePairMessage(prompt);

  if (!result.ok) {
    if (stage.retries >= config.maxRetries) {
      store.failCurrentStage("retry_exhausted");
      return { success: false };
    }
    store.pairRoutingApiFail(config.maxRetries);
    return { error: result.errorKind, success: false };
  }

  store.completePairRouting();
  return { success: true };
}
