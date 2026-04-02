import every from "lodash/every.js";
import get from "lodash/get.js";
import isArray from "lodash/isArray.js";
import isFunction from "lodash/isFunction.js";
import isPlainObject from "lodash/isPlainObject.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";
import { readFile } from "node:fs/promises";

import type { ValidationError } from "../contracts/shared/validation-result.js";
import type {
  HaltReason,
  PipelinePhase,
} from "../state-machine/pipeline-phases.js";
import type { PipelineState } from "../state-machine/pipeline-state.js";

import { transitionPipeline } from "../state-machine/pipeline-lifecycle.js";
import { createSession, loadSession, saveSession } from "./state-store.js";
import { validateDebateOutput, validateTlaWriterOutput } from "./validator.js";

const STRUCTURAL_INVALID_INPUT = "STRUCTURAL_INVALID_INPUT";
const FILE_READ_HINT = "Output file could not be read or is not valid JSON";
const OUTPUT_PATH_FIELD = "outputPath";
const PHASE_6 = "PHASE_6_PAIR_PROGRAMMING";

export type PipelineResponse = EngineError | PhaseContext | ValidationFailure;
type EngineError = { error: string; pid?: number };
type PhaseContext = { context: Record<string, unknown>; phase: string };

type PhaseValidator = (
  output: unknown,
  state: PipelineState,
) => { errors: ValidationError[]; valid: boolean };

type ValidationFailure = { errors: ValidationError[]; valid: false };

const PHASE_VALIDATOR_MAP: Partial<Record<PipelinePhase, PhaseValidator>> = {
  PHASE_2_DESIGN_DEBATE: validateDebateOutput,
  PHASE_3_TLA_WRITER: validateTlaWriterOutput,
  PHASE_4_TLA_REVIEW: validateDebateOutput,
};

type ArtifactExtractor = (
  output: Record<string, unknown>,
) => Record<string, string>;

const extractPhase1 = (
  output: Record<string, unknown>,
): Record<string, string> => {
  return { briefingPath: String(get(output, ["briefingPath"], "")) };
};

const extractPhase2 = (
  output: Record<string, unknown>,
): Record<string, string> => {
  return { designConsensusPath: String(get(output, ["synthesis"], "")) };
};

const extractPhase3 = (
  output: Record<string, unknown>,
): Record<string, string> => {
  return {
    tlaSpecPath: String(get(output, ["specPath"], "")),
    tlcResult: String(get(output, ["tlcResult"], "")),
  };
};

const extractPhase4 = (
  output: Record<string, unknown>,
): Record<string, string> => {
  return { tlaReviewPath: String(get(output, ["synthesis"], "")) };
};

const extractPhase5 = (
  output: Record<string, unknown>,
): Record<string, string> => {
  return {
    implementationPlanPath: String(get(output, ["implementationPlanPath"], "")),
  };
};

const ARTIFACT_EXTRACTORS: Partial<Record<PipelinePhase, ArtifactExtractor>> = {
  PHASE_1_QUESTIONER: extractPhase1,
  PHASE_2_DESIGN_DEBATE: extractPhase2,
  PHASE_3_TLA_WRITER: extractPhase3,
  PHASE_4_TLA_REVIEW: extractPhase4,
  PHASE_5_IMPLEMENTATION: extractPhase5,
};

const extractArtifacts = (
  phase: PipelinePhase,
  output: Record<string, unknown>,
): Record<string, string> => {
  const extractor: unknown = get(ARTIFACT_EXTRACTORS, [phase]);

  if (isFunction(extractor)) {
    const typedExtractor = extractor as ArtifactExtractor;
    return typedExtractor(output);
  }

  return {};
};

const extractExperts = (
  phase: PipelinePhase,
  output: Record<string, unknown>,
): string[] | undefined => {
  if ("PHASE_1_QUESTIONER" !== phase) {
    return undefined;
  }

  const experts: unknown = get(output, ["experts"]);

  if (isArray(experts) && every(experts, (item: unknown) => isString(item))) {
    return map(experts, String);
  }

  /* v8 ignore next -- defensive: Phase 1 output always provides string[] experts */
  return undefined;
};

const toRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (isPlainObject(value)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- lodash isPlainObject guarantees object shape
    return value as Record<string, unknown>;
  }

  return undefined;
};

const readOutputFile = async (
  outputPath: string,
): Promise<Record<string, unknown> | ValidationFailure> => {
  let raw: string;

  try {
    raw = await readFile(outputPath, "utf8");
  } catch {
    return {
      errors: [
        {
          code: STRUCTURAL_INVALID_INPUT,
          expected: "readable JSON file",
          hint: FILE_READ_HINT,
          path: OUTPUT_PATH_FIELD,
          received: outputPath,
        },
      ],
      valid: false,
    };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    const record = toRecord(parsed);

    if (record !== undefined) {
      return record;
    }

    return {
      errors: [
        {
          code: STRUCTURAL_INVALID_INPUT,
          expected: "JSON object",
          hint: "Output must be a JSON object, not an array or primitive",
          path: OUTPUT_PATH_FIELD,
          received: raw.slice(0, 100),
        },
      ],
      valid: false,
    };
  } catch {
    return {
      errors: [
        {
          code: STRUCTURAL_INVALID_INPUT,
          expected: "valid JSON",
          hint: FILE_READ_HINT,
          path: OUTPUT_PATH_FIELD,
          received: raw.slice(0, 100),
        },
      ],
      valid: false,
    };
  }
};

export const startPipeline = async (
  slug: string,
  stateDirectory: string,
): Promise<PipelineResponse> => {
  const session = await createSession(slug, stateDirectory);

  if ("error" in session) {
    return session;
  }

  const result = transitionPipeline(session, {
    artifacts: {},
    type: "forward",
  });

  /* v8 ignore next 3 -- defensive: IDLE always has a forward target */
  if ("error" in result) {
    return result;
  }

  await saveSession(result, stateDirectory);

  return { context: {}, phase: result.phase };
};

const isValidationFailure = (
  value: Record<string, unknown> | ValidationFailure,
): value is ValidationFailure => {
  return "valid" in value && false === value.valid;
};

const runPhaseValidation = async (
  state: PipelineState,
  parsed: Record<string, unknown>,
  stateDirectory: string,
): Promise<undefined | ValidationFailure> => {
  const validator: unknown = get(PHASE_VALIDATOR_MAP, [state.phase]);

  if (!isFunction(validator)) {
    return undefined;
  }

  const typedValidator = validator as PhaseValidator;
  const validation = typedValidator(parsed, state);

  if (validation.valid) {
    return undefined;
  }

  const failResult = transitionPipeline(state, { type: "validation_fail" });

  /* v8 ignore next 3 -- defensive: validation_fail on validated phase always succeeds */
  if (!("error" in failResult)) {
    await saveSession(failResult, stateDirectory);
  }

  return { errors: validation.errors, valid: false };
};

const applyForwardTransition = async (
  state: PipelineState,
  parsed: Record<string, unknown>,
  stateDirectory: string,
): Promise<PipelineResponse> => {
  const artifacts = extractArtifacts(state.phase, parsed);
  const experts = extractExperts(state.phase, parsed);

  if (PHASE_6 === state.phase) {
    const completeResult = transitionPipeline(state, {
      artifacts: {},
      type: "forward",
    });

    /* v8 ignore next 3 -- defensive: PHASE_6 always has a valid forward target */
    if ("error" in completeResult) {
      return completeResult;
    }

    await saveSession(completeResult, stateDirectory);
    return { context: completeResult.accumulatedContext, phase: "COMPLETE" };
  }

  const forwardAction =
    experts === undefined
      ? { artifacts, type: "forward" as const }
      : { artifacts, experts, type: "forward" as const };
  const forwardResult = transitionPipeline(state, forwardAction);

  /* v8 ignore next 3 -- defensive: validated phases always have forward targets */
  if ("error" in forwardResult) {
    return forwardResult;
  }

  await saveSession(forwardResult, stateDirectory);

  return {
    context: forwardResult.accumulatedContext,
    phase: forwardResult.phase,
  };
};

const processOutput = async (
  state: PipelineState,
  output: Record<string, unknown>,
  stateDirectory: string,
): Promise<PipelineResponse> => {
  const validationError = await runPhaseValidation(
    state,
    output,
    stateDirectory,
  );

  if (validationError !== undefined) {
    return validationError;
  }

  return applyForwardTransition(state, output, stateDirectory);
};

export const advancePipelineWithOutput = async (
  slug: string,
  output: Record<string, unknown>,
  stateDirectory: string,
): Promise<PipelineResponse> => {
  const state = await loadSession(slug, stateDirectory);

  if ("error" in state) {
    return state;
  }

  return processOutput(state, output, stateDirectory);
};

export const advancePipeline = async (
  slug: string,
  outputPath: string,
  stateDirectory: string,
): Promise<PipelineResponse> => {
  const state = await loadSession(slug, stateDirectory);

  if ("error" in state) {
    return state;
  }

  const output = await readOutputFile(outputPath);

  if (isValidationFailure(output)) {
    return output;
  }

  return processOutput(state, output, stateDirectory);
};

export const retryPipeline = async (
  slug: string,
  target: PipelinePhase,
  stateDirectory: string,
): Promise<PipelineResponse> => {
  const state = await loadSession(slug, stateDirectory);

  if ("error" in state) {
    return state;
  }

  const result = transitionPipeline(state, { target, type: "backward" });

  if ("error" in result) {
    return result;
  }

  await saveSession(result, stateDirectory);

  return {
    context: result.accumulatedContext,
    phase: result.phase,
  };
};

export const haltPipeline = async (
  slug: string,
  reason: HaltReason,
  stateDirectory: string,
): Promise<PipelineResponse> => {
  const state = await loadSession(slug, stateDirectory);

  if ("error" in state) {
    return state;
  }

  const result = transitionPipeline(state, { reason, type: "halt" });

  if ("error" in result) {
    return result;
  }

  await saveSession(result, stateDirectory);

  return {
    context: { haltReason: reason },
    phase: result.phase,
  };
};

export const getPipelineStatus = async (
  slug: string,
  stateDirectory: string,
): Promise<EngineError | PipelineState> => {
  return loadSession(slug, stateDirectory);
};
