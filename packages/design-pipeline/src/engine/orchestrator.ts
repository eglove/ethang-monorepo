import constant from "lodash/constant.js";
import map from "lodash/map.js";
import noop from "lodash/noop.js";
import some from "lodash/some.js";

import type { ClaudeAdapter } from "../ports/claude-adapter.ts";
import type { GitAdapter } from "../ports/git-adapter.ts";
import type { StageResult } from "../stages/base-coordinator.ts";
import type {
  AnthropicClient,
  QuestionerDeps,
  ReadlinePort,
  SessionResult,
} from "../stages/questioner-session.ts";

import {
  createDefaultFeatureFlags,
  type FeatureFlags,
  isSdkEnabled,
} from "../config/feature-flags.ts";
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
  type EslintRunner,
  type LintAiClient,
  runLintFixer,
} from "../stages/lint-fixer.ts";
import {
  executePairProgramming,
  executePairRouting,
} from "../stages/pair-programming.ts";
import { executeTlaWriter } from "../stages/tla-writer.ts";
import { executeCompensation, shouldCompensate } from "./compensation.ts";
import { type PipelineState, PipelineStore } from "./pipeline-store.ts";

export type OrchestratorDeps = {
  anthropicClient?: AnthropicClient;
  claudeAdapter: ClaudeAdapter;
  config?: PipelineConfig;
  eslintRunner?: EslintRunner;
  featureFlags?: FeatureFlags;
  gitAdapter: GitAdapter;
  questionerRunner?: QuestionerRunner;
  readlinePort?: ReadlinePort;
  rootDirectory?: string;
};

export type PipelineResult = {
  artifacts?: Record<string, unknown>;
  error?: string;
  errorKind?: string;
  state: PipelineState;
  success: boolean;
};

export type QuestionerRunner = (deps: QuestionerDeps) => Promise<SessionResult>;

export async function executeOrchestrator(
  deps: OrchestratorDeps,
  streamingInputs?: Record<string, string[]>,
  runId?: string,
): Promise<PipelineResult> {
  const config = deps.config ?? defaultPipelineConfig;
  const flags = deps.featureFlags ?? createDefaultFeatureFlags();
  const id = runId ?? `run-${Date.now()}`;
  const store = new PipelineStore();

  store.startRun();

  // Stage 1 (Questioner) always uses the new SDK path
  const questionerSuccess = await executeQuestionerSdkPath(
    deps,
    store,
    config,
    streamingInputs,
    id,
  );

  if (!questionerSuccess) {
    return handleFailure(store, deps.gitAdapter, id);
  }

  // Stages 2-7: check feature flag for SDK vs legacy handoff
  const remainingStagesUseSdk = checkRemainingStagesSdk(flags);

  if (!remainingStagesUseSdk) {
    // Legacy handoff: stages 2-7 would be dispatched to claude CLI subprocess.
    // Stub: return current state indicating handoff to legacy CLI.
    // Cannot call completeRun() because stage 7 has not completed in-process.
    return {
      artifacts: store.state.artifacts,
      state: store.state,
      success: true,
    };
  }

  // SDK path: continue orchestrator loop for stages 2-7
  for (let stageIndex = 2; 7 >= stageIndex; stageIndex += 1) {
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

export async function executeStage(
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
      return { error: "questioner_uses_sdk_path", success: false };
    }

    case "TlaWriter": {
      return buildTlaWriterResult(deps, config, store);
    }
  }
}

export function getStageName(stageIndex: number): StageName {
  const name = STAGES[stageIndex - 1];
  if (name === undefined) {
    throw new Error(`Invalid stage index: ${stageIndex}`);
  }
  return name;
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

function checkRemainingStagesSdk(flags: FeatureFlags): boolean {
  // Check if ANY of stages 2-7 have SDK enabled.
  // If all are disabled, hand off to legacy claude CLI subprocess.
  const remainingStages: StageName[] = [
    "DebateModerator",
    "TlaWriter",
    "ExpertReview",
    "ImplementationPlanning",
    "PairProgramming",
    "ForkJoin",
  ];
  return some(remainingStages, (stage) => isSdkEnabled(flags, stage));
}

async function executeQuestionerSdkPath(
  deps: OrchestratorDeps,
  store: PipelineStore,
  config: PipelineConfig,
  _streamingInputs: Record<string, string[]> | undefined,
  _runId: string,
): Promise<boolean> {
  const runner = deps.questionerRunner;

  if (runner === undefined) {
    store.failCurrentStage("questioner_runner_missing");
    return false;
  }

  // The store is at stage 1 (Questioner) with streaming_input status after startRun().
  // Transition through: streaming_input -> executing -> validating -> completed.
  store.streamInput(config.maxStreamTurns);
  store.completeStreaming();

  try {
    const result = await runner({
      client: deps.anthropicClient ?? {
        messages: { create: constant(Promise.resolve({ content: [] })) },
      },
      config: {
        maxLintPasses: 10,
        maxRetries: config.maxRetries,
        maxSignoffAttempts: 3,
        maxTurns: config.maxStreamTurns,
        retryBaseDelayMs: config.retryBaseDelayMs,
      },
      readline: deps.readlinePort ?? {
        close: noop,
        question: constant(Promise.resolve("")),
      },
      topic: "pipeline",
    });

    if (!result.success) {
      store.failCurrentStage("questioner_session_failed");
      return false;
    }

    // Run lint-fixer on the produced briefing markdown file
    if (
      null !== result.briefingPath &&
      deps.anthropicClient !== undefined &&
      deps.eslintRunner !== undefined
    ) {
      await runLintFixerOnBriefing(
        result.briefingPath,
        deps.anthropicClient,
        deps.eslintRunner,
        deps.readlinePort,
        deps.rootDirectory,
      );
    }

    // Map session artifact to the BriefingResult shape expected by downstream stages
    const artifact = {
      constraints: map(result.artifact.questions, "answer"),
      requirements: map(result.artifact.questions, "question"),
      summary: result.artifact.summary ?? "",
    };

    // Transition: executing -> validating -> completed
    store.finishExecution();
    store.validationPass(artifact);
    store.storeArtifact("Questioner", artifact);

    // Advance to stage 2
    store.advanceStage();

    return true;
  } catch (error: unknown) {
    globalThis.console.error(
      "[orchestrator] Questioner SDK path failed:",
      error,
    );
    store.failCurrentStage("questioner_session_failed");
    return false;
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
  // Questioner streaming is now handled by the SDK path (executeQuestionerSdkPath).
  // Only ImplementationPlanning streaming goes through here.
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

async function runLintFixerOnBriefing(
  briefingPath: string,
  aiClient: AnthropicClient,
  eslintRunner: EslintRunner,
  readlinePort?: ReadlinePort,
  rootDirectory?: string,
): Promise<void> {
  const recipesPath =
    rootDirectory === undefined
      ? "lint-fixer-recipes.md"
      : `${rootDirectory}/packages/design-pipeline/lint-fixer-recipes.md`;

  const userPort = {
    async askUser(prompt: string): Promise<string> {
      if (readlinePort === undefined) {
        return "";
      }

      return readlinePort.question(prompt);
    },
  };

  await runLintFixer(
    briefingPath,
    {
      interactive: readlinePort !== undefined,
      maxLintPasses: 10,
      recipesPath,
    },
    { messages: aiClient.messages } satisfies LintAiClient,
    userPort,
    eslintRunner,
  );
}
