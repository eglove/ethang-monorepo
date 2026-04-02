import { z } from "zod";

import {
  MAX_PIPELINE_RETRIES,
  MAX_VALIDATION_ATTEMPTS,
} from "./pipeline-phases.js";

const HaltReasonSchema = z.enum([
  "AGENT_FAILURE",
  "NONE",
  "RETRY_EXHAUSTED",
  "USER_HALT",
  "VALIDATION_EXHAUSTED",
]);

const RetryCountSchema = z.number().int().min(0).max(MAX_PIPELINE_RETRIES);

const RetriesSchema = z.object({
  PHASE_1_QUESTIONER: RetryCountSchema.optional(),
  PHASE_3_TLA_WRITER: RetryCountSchema.optional(),
});

const ValidationAttemptsSchema = z
  .number()
  .int()
  .min(0)
  .max(MAX_VALIDATION_ATTEMPTS);

const SharedFieldsBase = {
  retries: RetriesSchema,
  slug: z.string(),
  startedAt: z.string(),
  validationAttempts: ValidationAttemptsSchema,
};

// Context schemas for each accumulation level
const EmptyContextSchema = z.object({});

const Phase2ContextSchema = z.object({
  briefingPath: z.string(),
  experts: z.array(z.string()).nonempty(),
});

const Phase3ContextSchema = Phase2ContextSchema.extend({
  designConsensusPath: z.string(),
});

const Phase4ContextSchema = Phase3ContextSchema.extend({
  tlaSpecPath: z.string(),
  tlcResult: z.string(),
});

const Phase5ContextSchema = Phase4ContextSchema.extend({
  tlaReviewPath: z.string(),
});

const FullContextSchema = Phase5ContextSchema.extend({
  implementationPlanPath: z.string(),
});

const HaltedContextSchema = z.record(z.string(), z.unknown());

// Non-halted phases require haltReason = "NONE"
const NonHaltedHaltReason = z.literal("NONE");

// Halted phase requires haltReason != "NONE"
const HaltedHaltReason = HaltReasonSchema.exclude(["NONE"]);

const IdleSchema = z.object({
  ...SharedFieldsBase,
  accumulatedContext: EmptyContextSchema,
  haltReason: NonHaltedHaltReason,
  phase: z.literal("IDLE"),
});

const Phase1Schema = z.object({
  ...SharedFieldsBase,
  accumulatedContext: EmptyContextSchema,
  haltReason: NonHaltedHaltReason,
  phase: z.literal("PHASE_1_QUESTIONER"),
});

const Phase2Schema = z.object({
  ...SharedFieldsBase,
  accumulatedContext: Phase2ContextSchema,
  haltReason: NonHaltedHaltReason,
  phase: z.literal("PHASE_2_DESIGN_DEBATE"),
});

const Phase3Schema = z.object({
  ...SharedFieldsBase,
  accumulatedContext: Phase3ContextSchema,
  haltReason: NonHaltedHaltReason,
  phase: z.literal("PHASE_3_TLA_WRITER"),
});

const Phase4Schema = z.object({
  ...SharedFieldsBase,
  accumulatedContext: Phase4ContextSchema,
  haltReason: NonHaltedHaltReason,
  phase: z.literal("PHASE_4_TLA_REVIEW"),
});

const Phase5Schema = z.object({
  ...SharedFieldsBase,
  accumulatedContext: Phase5ContextSchema,
  haltReason: NonHaltedHaltReason,
  phase: z.literal("PHASE_5_IMPLEMENTATION"),
});

const Phase6Schema = z.object({
  ...SharedFieldsBase,
  accumulatedContext: FullContextSchema,
  haltReason: NonHaltedHaltReason,
  phase: z.literal("PHASE_6_PAIR_PROGRAMMING"),
});

const CompleteSchema = z.object({
  ...SharedFieldsBase,
  accumulatedContext: FullContextSchema,
  haltReason: NonHaltedHaltReason,
  phase: z.literal("COMPLETE"),
});

const HaltedSchema = z.object({
  ...SharedFieldsBase,
  accumulatedContext: HaltedContextSchema,
  haltReason: HaltedHaltReason,
  phase: z.literal("HALTED"),
});

export const PipelineStateSchema = z.discriminatedUnion("phase", [
  CompleteSchema,
  HaltedSchema,
  IdleSchema,
  Phase1Schema,
  Phase2Schema,
  Phase3Schema,
  Phase4Schema,
  Phase5Schema,
  Phase6Schema,
]);

export type PipelineState = z.infer<typeof PipelineStateSchema>;
