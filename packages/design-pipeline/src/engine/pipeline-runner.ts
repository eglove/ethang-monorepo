import type {
  HaltReason,
  PipelinePhase,
} from "../state-machine/pipeline-phases.js";
import type { PipelineState } from "../state-machine/pipeline-state.js";

import {
  advancePipeline,
  getPipelineStatus,
  haltPipeline,
  type PipelineResponse,
  retryPipeline,
  startPipeline,
} from "./pipeline-engine.js";
import { DEFAULT_STATE_DIRECTORY } from "./state-store.js";

const VALID_HALT_REASONS: ReadonlySet<string> = new Set<HaltReason>([
  "AGENT_FAILURE",
  "NONE",
  "RETRY_EXHAUSTED",
  "USER_HALT",
  "VALIDATION_EXHAUSTED",
]);

const isHaltReason = (value: string): value is HaltReason => {
  return VALID_HALT_REASONS.has(value);
};

const VALID_PHASES: ReadonlySet<string> = new Set<PipelinePhase>([
  "COMPLETE",
  "HALTED",
  "IDLE",
  "PHASE_1_QUESTIONER",
  "PHASE_2_DESIGN_DEBATE",
  "PHASE_3_TLA_WRITER",
  "PHASE_4_TLA_REVIEW",
  "PHASE_5_IMPLEMENTATION",
  "PHASE_6_PAIR_PROGRAMMING",
]);

const isPipelinePhase = (value: string): value is PipelinePhase => {
  return VALID_PHASES.has(value);
};

const USAGE_TEXT = `Usage: pipeline-runner <command> [args]

Commands:
  start <slug>                     Start a new pipeline
  advance <slug> <output-json>     Advance pipeline with output file
  status <slug>                    Get pipeline status
  halt <slug> <reason>             Halt pipeline with reason
  retry <slug> <target-phase>      Retry pipeline at target phase`;

const INVALID_HALT_REASON = "Invalid halt reason";
const INVALID_PHASE = "Invalid target phase";

export type RunnerResult = {
  exitCode: number;
  stderr: string;
  stdout: string;
};

const EMPTY_STRING = "";

const usageError = (): RunnerResult => {
  return { exitCode: 1, stderr: USAGE_TEXT, stdout: EMPTY_STRING };
};

const errorResult = (message: string): RunnerResult => {
  return {
    exitCode: 1,
    stderr: EMPTY_STRING,
    stdout: JSON.stringify({ error: message }),
  };
};

const toResult = (response: PipelineResponse | PipelineState): RunnerResult => {
  if ("error" in response) {
    return {
      exitCode: 1,
      stderr: EMPTY_STRING,
      stdout: JSON.stringify(response),
    };
  }

  return {
    exitCode: 0,
    stderr: EMPTY_STRING,
    stdout: JSON.stringify(response),
  };
};

const handleStart = async (
  slug: string,
  stateDirectory: string,
): Promise<RunnerResult> => {
  return toResult(await startPipeline(slug, stateDirectory));
};

const handleAdvance = async (
  slug: string,
  rest: string[],
  stateDirectory: string,
): Promise<RunnerResult> => {
  const [outputPath] = rest;

  if (outputPath === undefined) {
    return usageError();
  }

  return toResult(await advancePipeline(slug, outputPath, stateDirectory));
};

const handleStatus = async (
  slug: string,
  stateDirectory: string,
): Promise<RunnerResult> => {
  return toResult(await getPipelineStatus(slug, stateDirectory));
};

const handleHalt = async (
  slug: string,
  rest: string[],
  stateDirectory: string,
): Promise<RunnerResult> => {
  const [reason] = rest;

  if (reason === undefined) {
    return usageError();
  }

  if (!isHaltReason(reason)) {
    return errorResult(INVALID_HALT_REASON);
  }

  return toResult(await haltPipeline(slug, reason, stateDirectory));
};

const handleRetry = async (
  slug: string,
  rest: string[],
  stateDirectory: string,
): Promise<RunnerResult> => {
  const [targetPhase] = rest;

  if (targetPhase === undefined) {
    return usageError();
  }

  if (!isPipelinePhase(targetPhase)) {
    return errorResult(INVALID_PHASE);
  }

  return toResult(await retryPipeline(slug, targetPhase, stateDirectory));
};

export const parseAndExecute = async (
  argv: string[],
  stateDirectory: string = DEFAULT_STATE_DIRECTORY,
): Promise<RunnerResult> => {
  const [command, ...rest] = argv;

  if (command === undefined) {
    return usageError();
  }

  const [slug, ...commandRest] = rest;

  if (slug === undefined) {
    return usageError();
  }

  switch (command) {
    case "advance": {
      return handleAdvance(slug, commandRest, stateDirectory);
    }

    case "halt": {
      return handleHalt(slug, commandRest, stateDirectory);
    }

    case "retry": {
      return handleRetry(slug, commandRest, stateDirectory);
    }

    case "start": {
      return handleStart(slug, stateDirectory);
    }

    case "status": {
      return handleStatus(slug, stateDirectory);
    }

    default: {
      return usageError();
    }
  }
};
