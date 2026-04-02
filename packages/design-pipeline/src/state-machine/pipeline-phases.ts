export type ArtifactName =
  | "briefingPath"
  | "designConsensusPath"
  | "implementationPlanPath"
  | "tlaReviewPath"
  | "tlaSpecPath"
  | "tlcResult";

export type HaltReason =
  | "AGENT_FAILURE"
  | "NONE"
  | "RETRY_EXHAUSTED"
  | "USER_HALT"
  | "VALIDATION_EXHAUSTED";

export type PipelinePhase =
  | "COMPLETE"
  | "HALTED"
  | "IDLE"
  | "PHASE_1_QUESTIONER"
  | "PHASE_2_DESIGN_DEBATE"
  | "PHASE_3_TLA_WRITER"
  | "PHASE_4_TLA_REVIEW"
  | "PHASE_5_IMPLEMENTATION"
  | "PHASE_6_PAIR_PROGRAMMING";

// Phase sets
export const TERMINAL_PHASES: ReadonlySet<PipelinePhase> = new Set([
  "COMPLETE",
  "HALTED",
]);

export const NON_TERMINAL_PHASES: ReadonlySet<PipelinePhase> = new Set([
  "IDLE",
  "PHASE_1_QUESTIONER",
  "PHASE_2_DESIGN_DEBATE",
  "PHASE_3_TLA_WRITER",
  "PHASE_4_TLA_REVIEW",
  "PHASE_5_IMPLEMENTATION",
  "PHASE_6_PAIR_PROGRAMMING",
]);

export const ACTIVE_PHASES: ReadonlySet<PipelinePhase> = new Set([
  "PHASE_1_QUESTIONER",
  "PHASE_2_DESIGN_DEBATE",
  "PHASE_3_TLA_WRITER",
  "PHASE_4_TLA_REVIEW",
  "PHASE_5_IMPLEMENTATION",
  "PHASE_6_PAIR_PROGRAMMING",
]);

export const VALIDATED_PHASES: ReadonlySet<PipelinePhase> = new Set([
  "PHASE_1_QUESTIONER",
  "PHASE_2_DESIGN_DEBATE",
  "PHASE_3_TLA_WRITER",
  "PHASE_4_TLA_REVIEW",
  "PHASE_5_IMPLEMENTATION",
]);

export const RETRYABLE_PHASES: ReadonlySet<PipelinePhase> = new Set([
  "PHASE_1_QUESTIONER",
  "PHASE_3_TLA_WRITER",
]);

// Constants
export const MAX_PIPELINE_RETRIES = 3;
export const MAX_VALIDATION_ATTEMPTS = 3;

// Phase ordering (matches TLA+ PhaseOrd)
export const PHASE_ORD: Readonly<Record<PipelinePhase, number>> = {
  COMPLETE: 7,
  HALTED: 8,
  IDLE: 0,
  PHASE_1_QUESTIONER: 1,
  PHASE_2_DESIGN_DEBATE: 2,
  PHASE_3_TLA_WRITER: 3,
  PHASE_4_TLA_REVIEW: 4,
  PHASE_5_IMPLEMENTATION: 5,
  PHASE_6_PAIR_PROGRAMMING: 6,
};

// Artifact names
export const ALL_ARTIFACT_NAMES: ReadonlySet<ArtifactName> = new Set([
  "briefingPath",
  "designConsensusPath",
  "implementationPlanPath",
  "tlaReviewPath",
  "tlaSpecPath",
  "tlcResult",
]);

const EMPTY_ARTIFACTS: ReadonlySet<ArtifactName> = new Set();

// Which phase produces which artifacts (matches TLA+ ArtifactsProducedBy)
export const ARTIFACTS_PRODUCED_BY: Readonly<
  Record<PipelinePhase, ReadonlySet<ArtifactName>>
> = {
  COMPLETE: EMPTY_ARTIFACTS,
  HALTED: EMPTY_ARTIFACTS,
  IDLE: EMPTY_ARTIFACTS,
  PHASE_1_QUESTIONER: new Set(["briefingPath"]),
  PHASE_2_DESIGN_DEBATE: new Set(["designConsensusPath"]),
  PHASE_3_TLA_WRITER: new Set(["tlaSpecPath"]),
  PHASE_4_TLA_REVIEW: new Set(["tlaReviewPath", "tlcResult"]),
  PHASE_5_IMPLEMENTATION: new Set(["implementationPlanPath"]),
  PHASE_6_PAIR_PROGRAMMING: EMPTY_ARTIFACTS,
};

// Clear sets for backward transitions
export const PHASE_1_CLEAR_SET: ReadonlySet<ArtifactName> = ALL_ARTIFACT_NAMES;

export const PHASE_3_CLEAR_SET: ReadonlySet<ArtifactName> = new Set([
  "tlaReviewPath",
  "tlaSpecPath",
  "tlcResult",
]);
