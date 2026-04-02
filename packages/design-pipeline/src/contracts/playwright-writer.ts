import { z } from "zod";

import { CodeWriterInputSchema } from "./shared/code-writer-input.ts";

export const PlaywrightWriterInputSchema = CodeWriterInputSchema.extend({
  codeWriter: z.string().min(1),
});
export type PlaywrightWriterInput = z.infer<typeof PlaywrightWriterInputSchema>;

export {
  type TestWriterOutput as PlaywrightWriterOutput,
  TestWriterOutputSchema as PlaywrightWriterOutputSchema,
} from "./shared/test-writer-output.ts";
