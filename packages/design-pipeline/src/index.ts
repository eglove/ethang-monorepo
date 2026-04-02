export {
  type DebateModeratorInput,
  DebateModeratorInputSchema,
  type DebateModeratorOutput,
  DebateModeratorOutputSchema,
} from "./contracts/debate-moderator.ts";
export {
  type HonoWriterInput,
  HonoWriterInputSchema,
  type HonoWriterOutput,
  HonoWriterOutputSchema,
} from "./contracts/hono-writer.ts";
export {
  type CodeWriterEntry,
  CodeWriterEntrySchema,
  CodeWriterListSchema,
} from "./contracts/implementation-writer.ts";
export {
  type PlaywrightWriterInput,
  PlaywrightWriterInputSchema,
  type PlaywrightWriterOutput,
  PlaywrightWriterOutputSchema,
} from "./contracts/playwright-writer.ts";
export {
  decisionGuideRowSchema,
  dispatchTargetListSchema,
} from "./contracts/questioner.ts";
export {
  type CodeWriterInput,
  CodeWriterInputSchema,
} from "./contracts/shared/code-writer-input.ts";
export {
  type CodeWriterOutput,
  CodeWriterOutputSchema,
} from "./contracts/shared/code-writer-output.ts";

// Contracts — Shared
export { FrontmatterSchema } from "./contracts/shared/frontmatter.ts";
export { HandoffContractSchema } from "./contracts/shared/handoff-contract.ts";
export { SectionSchema } from "./contracts/shared/section.ts";
export {
  type TestWriterOutput,
  TestWriterOutputSchema,
} from "./contracts/shared/test-writer-output.ts";
export {
  type ValidationError,
  type ValidationResult,
  ValidationResultSchema,
} from "./contracts/shared/validation-result.ts";
export {
  type TlaWriterInput,
  TlaWriterInputSchema,
  type TlaWriterOutput,
  TlaWriterOutputSchema,
} from "./contracts/tla-writer.ts";

// Contracts — Agents
/** @deprecated Use CodeWriterInputSchema from contracts/shared/code-writer-input.ts */
export { TrainerInputSchema } from "./contracts/trainer-input.ts";
export { TrainerOutputSchema } from "./contracts/trainer-output.ts";
// Contracts — Writer Agents
export {
  type TypescriptWriterInput,
  TypescriptWriterInputSchema,
  type TypescriptWriterOutput,
  TypescriptWriterOutputSchema,
} from "./contracts/typescript-writer.ts";
export {
  type UiWriterInput,
  UiWriterInputSchema,
  type UiWriterOutput,
  UiWriterOutputSchema,
} from "./contracts/ui-writer.ts";
export {
  type VitestWriterInput,
  VitestWriterInputSchema,
  type VitestWriterOutput,
  VitestWriterOutputSchema,
} from "./contracts/vitest-writer.ts";

export {
  advancePipeline,
  advancePipelineWithOutput,
  getPipelineStatus,
  haltPipeline,
  retryPipeline,
  startPipeline,
} from "./engine/pipeline-engine.ts";
export {
  parseAndExecute,
  type RunnerResult,
} from "./engine/pipeline-runner.ts";
// Engine
export {
  createSession,
  DEFAULT_STATE_DIRECTORY,
  loadSession,
  saveSession,
} from "./engine/state-store.ts";
export {
  validateCodeWriterOutput,
  validateDebateOutput,
  validateTestWriterOutput,
  validateTlaWriterOutput,
} from "./engine/validator.ts";

export {
  isValidPipelineTransition,
  type PipelineAction,
  transitionPipeline,
} from "./state-machine/pipeline-lifecycle.ts";
export {
  ACTIVE_PHASES,
  ALL_ARTIFACT_NAMES,
  type ArtifactName,
  ARTIFACTS_PRODUCED_BY,
  type HaltReason,
  MAX_PIPELINE_RETRIES,
  MAX_VALIDATION_ATTEMPTS,
  NON_TERMINAL_PHASES,
  PHASE_1_CLEAR_SET,
  PHASE_3_CLEAR_SET,
  PHASE_ORD,
  type PipelinePhase,
  RETRYABLE_PHASES,
  TERMINAL_PHASES,
  VALIDATED_PHASES,
} from "./state-machine/pipeline-phases.ts";
export {
  type PipelineState,
  PipelineStateSchema,
} from "./state-machine/pipeline-state.ts";
// State Machine
export {
  isValidTransition,
  type StepState,
  type TransitionContext,
} from "./state-machine/step-lifecycle.ts";
