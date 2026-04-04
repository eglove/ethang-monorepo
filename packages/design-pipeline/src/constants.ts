import { z } from "zod";

export const STAGES = [
  "Questioner",
  "DebateModerator",
  "TlaWriter",
  "ExpertReview",
  "ImplementationPlanning",
  "PairProgramming",
  "ForkJoin",
] as const;

export type StageName = (typeof STAGES)[number];

export const StreamingStages: ReadonlySet<StageName> = new Set<StageName>([
  "ImplementationPlanning",
  "Questioner",
]);

export const GitStages: ReadonlySet<StageName> = new Set<StageName>([
  "ForkJoin",
  "PairProgramming",
]);

export const PairStage: StageName = "PairProgramming";

export const PipelineConfigSchema = z.object({
  maxRetries: z.number().int().min(1),
  maxStreamTurns: z.number().int().min(1),
  retryBaseDelayMs: z.number().int().min(0),
});

export type PipelineConfig = z.infer<typeof PipelineConfigSchema>;

export const defaultPipelineConfig: PipelineConfig = {
  maxRetries: 3,
  maxStreamTurns: 20,
  retryBaseDelayMs: 1000,
};
