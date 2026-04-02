import { z } from "zod";

export const TlaWriterInputSchema = z.object({
  briefingPath: z.string().min(1),
  designConsensus: z.string().min(1),
});

export const TlaWriterOutputSchema = z.object({
  cfgPath: z.string().min(1),
  specContent: z.string().min(1),
  specPath: z.string().min(1),
  tlcOutput: z.string(),
  tlcResult: z.enum(["PASS", "FAIL"]),
});

export type TlaWriterInput = z.infer<typeof TlaWriterInputSchema>;
export type TlaWriterOutput = z.infer<typeof TlaWriterOutputSchema>;
