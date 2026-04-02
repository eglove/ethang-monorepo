import { z } from "zod";

export const TestWriterOutputSchema = z.object({
  allPass: z.boolean(),
  testCount: z.number().int().min(1),
  testFilesWritten: z.array(z.string().min(1)).min(1),
});

export type TestWriterOutput = z.infer<typeof TestWriterOutputSchema>;
