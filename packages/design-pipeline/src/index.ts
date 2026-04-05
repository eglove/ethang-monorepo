import type { StageStore } from "./stores/stage-store.ts";
import type { RunState } from "./util/enums.ts";
import type {
  FileOperations,
  GitOperations,
  LlmProvider,
} from "./util/interfaces.ts";

import { BriefingWriterStore } from "./stores/briefing-writer-store.ts";
import { DebateModeratorStore } from "./stores/debate-moderator-store.ts";
import { ExpertReviewStore } from "./stores/expert-review-store.ts";
import { ForkJoinStore } from "./stores/fork-join-store.ts";
import { ImplementationPlanningStore } from "./stores/implementation-planning-store.ts";
import { LintFixerStore } from "./stores/lint-fixer-store.ts";
import { OrchestratorStore } from "./stores/orchestrator-store.ts";
import { PairProgrammingStore } from "./stores/pair-programming-store.ts";
import { QuestionerSessionStore } from "./stores/questioner-session-store.ts";
import { TlaWriterStore } from "./stores/tla-writer-store.ts";
import { isDAG } from "./util/dag.ts";
import {
  ErrorKind,
  isResultError,
  ok,
  type Result,
  resultError,
} from "./util/result.ts";

export type PipelineConfig = {
  numStages: number;
};

export type PipelineResult = {
  runState: RunState;
  success: boolean;
};

const DEFAULT_CONFIG: PipelineConfig = { numStages: 10 };

type StageFactory = (stageIndex: number) => StageStore;

const createStageFactory = (
  llmProvider: LlmProvider,
  fileOperations: FileOperations,
  gitOperations: GitOperations,
): StageFactory => {
  const factories: Record<number, () => StageStore> = {
    1: () => {
      return new QuestionerSessionStore(llmProvider, fileOperations);
    },
    10: () => {
      return new LintFixerStore(llmProvider, 10);
    },
    2: () => {
      return new DebateModeratorStore(llmProvider, fileOperations);
    },
    3: () => {
      return new ExpertReviewStore(llmProvider, fileOperations);
    },
    4: () => {
      return new BriefingWriterStore(llmProvider, fileOperations);
    },
    5: () => {
      return new ImplementationPlanningStore(llmProvider, fileOperations);
    },
    6: () => {
      return new PairProgrammingStore(
        llmProvider,
        fileOperations,
        gitOperations,
      );
    },
    7: () => {
      return new ForkJoinStore(llmProvider);
    },
    8: () => {
      return new LintFixerStore(llmProvider);
    },
    9: () => {
      return new TlaWriterStore(llmProvider, fileOperations);
    },
  };

  return (stageIndex: number): StageStore => {
    const factory = factories[stageIndex];
    if (undefined === factory) {
      throw new Error(`No factory for stage ${String(stageIndex)}`);
    }

    return factory();
  };
};

export const createPipeline = (
  llmProvider: LlmProvider,
  fileOperations: FileOperations,
  gitOperations: GitOperations,
  config: PipelineConfig = DEFAULT_CONFIG,
): Result<{
  destroy: () => void;
  orchestrator: OrchestratorStore;
  stageFactory: StageFactory;
}> => {
  const orchestrator = new OrchestratorStore(config.numStages);

  // Validate subscription graph at wiring time
  const edges: (readonly [number, number])[] = [];
  for (let index = 1; config.numStages > index; index += 1) {
    edges.push([index, index + 1]);
  }

  const dagResult = isDAG(edges);
  if (isResultError(dagResult)) {
    orchestrator.destroy();
    return resultError(ErrorKind.ValidationError, "Invalid subscription DAG");
  }

  const stageFactory = createStageFactory(
    llmProvider,
    fileOperations,
    gitOperations,
  );

  const destroy = (): void => {
    orchestrator.destroy();
  };

  return ok({ destroy, orchestrator, stageFactory });
};

export const startPipeline = (
  orchestrator: OrchestratorStore,
): Result<null> => {
  return orchestrator.start();
};
