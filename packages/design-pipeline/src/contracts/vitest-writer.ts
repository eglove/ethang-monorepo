import { z } from "zod";

import { CodeWriterInputSchema } from "./shared/code-writer-input.ts";

export const VitestWriterInputSchema = CodeWriterInputSchema.extend({
  codeWriter: z.string().min(1),
});
export type VitestWriterInput = z.infer<typeof VitestWriterInputSchema>;

export {
  type TestWriterOutput as VitestWriterOutput,
  TestWriterOutputSchema as VitestWriterOutputSchema,
} from "./shared/test-writer-output.ts";
