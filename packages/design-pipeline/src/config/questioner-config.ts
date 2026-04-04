import { z } from "zod";

export const QuestionerConfigSchema = z.object({
  maxLintPasses: z.number().int().min(1),
  maxRetries: z.number().int().min(1),
  maxSignoffAttempts: z.number().int().min(1),
  maxTurns: z.number().int().min(1),
  retryBaseDelayMs: z.number().int().min(0),
});

export type QuestionerConfig = z.infer<typeof QuestionerConfigSchema>;

const defaults: QuestionerConfig = {
  maxLintPasses: 10,
  maxRetries: 3,
  maxSignoffAttempts: 3,
  maxTurns: 50,
  retryBaseDelayMs: 1000,
};

export function createQuestionerConfig(
  overrides?: Partial<QuestionerConfig>,
): QuestionerConfig {
  return QuestionerConfigSchema.parse({ ...defaults, ...overrides });
}
