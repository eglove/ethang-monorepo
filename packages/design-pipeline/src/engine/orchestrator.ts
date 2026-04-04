import type { ClaudeAdapter } from "../ports/claude-adapter.ts";
import type { GitAdapter } from "../ports/git-adapter.ts";
import type { StageResult } from "../stages/base-coordinator.ts";

import {
  defaultPipelineConfig,
  PairStage,
  type PipelineConfig,
  type StageName,
  STAGES,
  StreamingStages,
} from "../constants.ts";
import {
  type BriefingResult,
  BriefingResultSchema,
  type DebateSynthesis,
  DebateSynthesisSchema,
  type ImplementationPlan,
  ImplementationPlanSchema,
  type PairSessionResult,
  PairSessionResultSchema,
  type TlaResult,
  TlaResultSchema,
  type TlaReviewSynthesis,
  TlaReviewSynthesisSchema,
} from "../schemas/index.ts";
import { executeDebateModerator } from "../stages/debate-moderator.ts";
import { executeExpertReview } from "../stages/expert-review.ts";
import { executeForkJoin } from "../stages/fork-join.ts";
import {
  executeImplementationPlanning,
  executeStreamingConfirmation,
} from "../stages/implementation-planning.ts";
import {
  executePairProgramming,
  executePairRouting,
} from "../stages/pair-programming.ts";
import { executeQuestioner, executeStreaming } from "../stages/questioner.ts";
import { executeTlaWriter } from "../stages/tla-writer.ts";
import { executeCompensation, shouldCompensate } from "./compensation.ts";
import { type PipelineState, PipelineStore } from "./pipeline-store.ts";

export type OrchestratorDeps = {
  claudeAdapter: ClaudeAdapter;
  config?: PipelineConfig;
  gitAdapter: GitAdapter;
};

export type PipelineResult = {
  artifacts?: Record<string, unknown>;
  error?: string;
  errorKind?: string;
  state: PipelineState;
  success: boolean;
};

export async function executeOrchestrator(
  deps: OrchestratorDeps,
  streamingInputs?: Record<string, string[]>,
  runId?: string,
): Promise<PipelineResult> {
  const config = deps.config ?? defaultPipelineConfig;
  const id = runId ?? `run-${Date.now()}`;
  const store = new PipelineStore();

  store.startRun();

  for (let stageIndex = 1; 7 >= stageIndex; stageIndex += 1) {
    // eslint-disable-next-line no-await-in-loop
    const success = await executeStageIteration(
      stageIndex,
      deps,
      store,
      config,
      streamingInputs,
      id,
    );

    if (!success) {
      return handleFailure(store, deps.gitAdapter, id);
    }
  }

  store.completeRun();
  return {
    artifacts: store.state.artifacts,
    state: store.state,
    success: true,
  };
}

async function buildDebateModeratorResult(
  deps: OrchestratorDeps,
  config: PipelineConfig,
  store: PipelineStore,
): Promise<StageResult> {
  return executeDebateModerator(
    deps.claudeAdapter,
    config,
    store,
    getArtifactAsBriefing(store),
  );
}

async function buildExpertReviewResult(
  deps: OrchestratorDeps,
  config: PipelineConfig,
  store: PipelineStore,
): Promise<StageResult> {
  return executeExpertReview(
    deps.claudeAdapter,
    config,
    store,
    getArtifactAsTlaResult(store),
  );
}

async function buildForkJoinResult(
  deps: OrchestratorDeps,
  config: PipelineConfig,
  store: PipelineStore,
  runId: string,
): Promise<StageResult> {
  return executeForkJoin(
    deps.claudeAdapter,
    deps.gitAdapter,
    config,
    store,
    getArtifactAsPairSessionResult(store),
    runId,
  );
}

async function buildImplementationPlanningResult(
  deps: OrchestratorDeps,
  config: PipelineConfig,
  store: PipelineStore,
): Promise<StageResult> {
  return executeImplementationPlanning(deps.claudeAdapter, config, store, {
    briefing: getArtifactAsBriefing(store),
    debateSynthesis: getArtifactAsDebateSynthesis(store),
    tlaResult: getArtifactAsTlaResult(store),
    tlaReviewSynthesis: getArtifactAsTlaReviewSynthesis(store),
  });
}

async function buildPairProgrammingResult(
  deps: OrchestratorDeps,
  config: PipelineConfig,
  store: PipelineStore,
  runId: string,
): Promise<StageResult> {
  return executePairProgramming(
    deps.claudeAdapter,
    deps.gitAdapter,
    config,
    store,
    getArtifactAsImplementationPlan(store),
    runId,
  );
}

async function buildQuestionerResult(
  deps: OrchestratorDeps,
  config: PipelineConfig,
  store: PipelineStore,
): Promise<StageResult> {
  return executeQuestioner(
    deps.claudeAdapter,
    config,
    store,
    "pipeline context",
  );
}

async function buildTlaWriterResult(
  deps: OrchestratorDeps,
  config: PipelineConfig,
  store: PipelineStore,
): Promise<StageResult> {
  return executeTlaWriter(
    deps.claudeAdapter,
    config,
    store,
    getArtifactAsDebateSynthesis(store),
  );
}

async function executeStage(
  stageName: StageName,
  deps: OrchestratorDeps,
  config: PipelineConfig,
  store: PipelineStore,
  runId: string,
): Promise<StageResult> {
  switch (stageName) {
    case "DebateModerator": {
      return buildDebateModeratorResult(deps, config, store);
    }

    case "ExpertReview": {
      return buildExpertReviewResult(deps, config, store);
    }

    case "ForkJoin": {
      return buildForkJoinResult(deps, config, store, runId);
    }

    case "ImplementationPlanning": {
      return buildImplementationPlanningResult(deps, config, store);
    }

    case "PairProgramming": {
      return buildPairProgrammingResult(deps, config, store, runId);
    }

    case "Questioner": {
      return buildQuestionerResult(deps, config, store);
    }

    case "TlaWriter": {
      return buildTlaWriterResult(deps, config, store);
    }
  }
}

async function executeStageIteration(
  stageIndex: number,
  deps: OrchestratorDeps,
  store: PipelineStore,
  config: PipelineConfig,
  streamingInputs: Record<string, string[]> | undefined,
  runId: string,
): Promise<boolean> {
  const stageName = getStageName(stageIndex);

  const preResult = await prepareStageExecution(
    stageName,
    deps,
    store,
    config,
    streamingInputs,
  );
  if (preResult.failed) {
    return false;
  }

  const stageResult = await executeStage(stageName, deps, config, store, runId);

  if (!stageResult.success) {
    return false;
  }

  if (stageResult.artifact !== undefined) {
    store.storeArtifact(stageName, stageResult.artifact);
  }

  if (7 > stageIndex) {
    store.advanceStage();
  }

  return true;
}

function getArtifactAsBriefing(store: PipelineStore): BriefingResult {
  const parsed = BriefingResultSchema.safeParse(
    store.getArtifact("Questioner"),
  );
  if (parsed.success) {
    return parsed.data;
  }
  return { constraints: [], requirements: [], summary: "" };
}

function getArtifactAsDebateSynthesis(store: PipelineStore): DebateSynthesis {
  const parsed = DebateSynthesisSchema.safeParse(
    store.getArtifact("DebateModerator"),
  );
  if (parsed.success) {
    return parsed.data;
  }
  return { consensus: "", dissent: [], recommendations: [] };
}

function getArtifactAsImplementationPlan(
  store: PipelineStore,
): ImplementationPlan {
  const parsed = ImplementationPlanSchema.safeParse(
    store.getArtifact("ImplementationPlanning"),
  );
  if (parsed.success) {
    return parsed.data;
  }
  return { steps: [], tiers: [] };
}

function getArtifactAsPairSessionResult(
  store: PipelineStore,
): PairSessionResult {
  const parsed = PairSessionResultSchema.safeParse(
    store.getArtifact("PairProgramming"),
  );
  if (parsed.success) {
    return parsed.data;
  }
  return {
    branchName: "",
    commitMessage: "",
    completedTasks: [],
    testsPassed: false,
  };
}

function getArtifactAsTlaResult(store: PipelineStore): TlaResult {
  const parsed = TlaResultSchema.safeParse(store.getArtifact("TlaWriter"));
  if (parsed.success) {
    return parsed.data;
  }
  return { cfgContent: "", tlaContent: "", tlcOutput: "" };
}

function getArtifactAsTlaReviewSynthesis(
  store: PipelineStore,
): TlaReviewSynthesis {
  const parsed = TlaReviewSynthesisSchema.safeParse(
    store.getArtifact("ExpertReview"),
  );
  if (parsed.success) {
    return parsed.data;
  }
  return { amendments: [], consensus: "", gaps: [] };
}

function getStageName(stageIndex: number): StageName {
  const name = STAGES[stageIndex - 1];
  /* v8 ignore next 3 -- stageIndex is always 1-7 from executeOrchestrator loop */
  if (name === undefined) {
    throw new Error(`Invalid stage index: ${stageIndex}`);
  }
  return name;
}

async function handleFailure(
  store: PipelineStore,
  gitAdapter: GitAdapter,
  runId: string,
): Promise<PipelineResult> {
  if (shouldCompensate(store)) {
    store.beginCompensation();
    const compResult = await executeCompensation(store, gitAdapter, runId);
    return {
      error: compResult.error ?? "unknown_error",
      state: store.state,
      success: false,
    };
  }

  store.failRunNoCheckpoint();
  return { state: store.state, success: false };
}

async function handlePairRoutingStage(
  deps: OrchestratorDeps,
  store: PipelineStore,
  config: PipelineConfig,
): Promise<{ failed: boolean }> {
  store.beginNonStreamingStage();
  const routeResult = await executePairRouting(
    deps.claudeAdapter,
    store,
    getArtifactAsImplementationPlan(store),
    config,
  );
  if (!routeResult.success) {
    return { failed: true };
  }
  return { failed: false };
}

async function handleStreamingStage(
  stageName: StageName,
  messages: string[],
  deps: OrchestratorDeps,
  store: PipelineStore,
  config: PipelineConfig,
): Promise<{ failed: boolean }> {
  if ("Questioner" === stageName) {
    await executeStreaming(
      deps.claudeAdapter,
      store,
      config.maxStreamTurns,
      messages,
    );
    if ("failed" === store.state.stages[stageName].status) {
      return { failed: true };
    }
    store.completeStreaming();
    return { failed: false };
  }

  await executeStreamingConfirmation(
    deps.claudeAdapter,
    store,
    config.maxStreamTurns,
    messages,
  );
  if ("failed" === store.state.stages[stageName].status) {
    return { failed: true };
  }
  store.completeStreaming();
  return { failed: false };
}

async function prepareStageExecution(
  stageName: StageName,
  deps: OrchestratorDeps,
  store: PipelineStore,
  config: PipelineConfig,
  streamingInputs: Record<string, string[]> | undefined,
): Promise<{ failed: boolean }> {
  if (StreamingStages.has(stageName)) {
    const messages = streamingInputs?.[stageName] ?? ["default input"];
    return handleStreamingStage(stageName, messages, deps, store, config);
  }

  if (stageName === PairStage) {
    return handlePairRoutingStage(deps, store, config);
  }

  store.beginNonStreamingStage();
  return { failed: false };
}
