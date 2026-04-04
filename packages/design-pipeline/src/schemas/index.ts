import { z } from "zod";

export const BriefingResultSchema = z.object({
  constraints: z.array(z.string()),
  requirements: z.array(z.string()),
  summary: z.string(),
});

export type BriefingResult = z.infer<typeof BriefingResultSchema>;

export const DebateSynthesisSchema = z.object({
  consensus: z.string(),
  dissent: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export type DebateSynthesis = z.infer<typeof DebateSynthesisSchema>;

export const TlaResultSchema = z.object({
  cfgContent: z.string(),
  tlaContent: z.string(),
  tlcOutput: z.string(),
});

export type TlaResult = z.infer<typeof TlaResultSchema>;

export const TlaReviewSynthesisSchema = z.object({
  amendments: z.array(z.string()),
  consensus: z.string(),
  gaps: z.array(z.string()),
});

export type TlaReviewSynthesis = z.infer<typeof TlaReviewSynthesisSchema>;

export const ImplementationPlanSchema = z.object({
  steps: z
    .array(
      z.object({
        files: z.array(z.string()),
        id: z.string(),
        title: z.string(),
      }),
    )
    .min(1),
  tiers: z.array(
    z.object({
      taskIds: z.array(z.string()),
      tier: z.number(),
    }),
  ),
});

export type ImplementationPlan = z.infer<typeof ImplementationPlanSchema>;

export const PairSessionResultSchema = z.object({
  branchName: z.string(),
  commitMessage: z.string(),
  completedTasks: z.array(z.string()),
  testsPassed: z.boolean(),
});

export type PairSessionResult = z.infer<typeof PairSessionResultSchema>;

export const ForkJoinResultSchema = z.object({
  branchName: z.string(),
  commitMessage: z.string(),
  plantUml: z.string(),
  reviewSummary: z.string(),
});

export type ForkJoinResult = z.infer<typeof ForkJoinResultSchema>;
