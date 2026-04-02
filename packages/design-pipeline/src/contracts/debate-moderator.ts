import { z } from "zod";

export const DebateModeratorInputSchema = z.object({
  context: z.string().min(1),
  experts: z.array(z.string().min(1)).min(1),
  topic: z.string().min(1),
});

export const DebateModeratorOutputSchema = z.object({
  consensusReached: z.boolean(),
  participatingExperts: z.array(z.string().min(1)).min(1),
  rounds: z.number().int().min(1),
  synthesis: z.string().min(1),
  unresolvedDissents: z.array(z.string()),
});

export type DebateModeratorInput = z.infer<typeof DebateModeratorInputSchema>;
export type DebateModeratorOutput = z.infer<typeof DebateModeratorOutputSchema>;
