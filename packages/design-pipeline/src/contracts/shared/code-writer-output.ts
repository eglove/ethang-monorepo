import { z } from "zod";

export const CodeWriterOutputSchema = z.object({
  filesWritten: z.array(z.string().min(1)).min(1),
  tddCycles: z.number().int().min(1),
  testsPass: z.boolean(),
});

export type CodeWriterOutput = z.infer<typeof CodeWriterOutputSchema>;
