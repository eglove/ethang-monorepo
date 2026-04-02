import { z } from "zod";

export const CodeWriterEntrySchema = z.object({
  description: z.string().min(1),
  fileTypes: z.array(z.string().min(1)).min(1),
  name: z.string().min(1),
  pairingRules: z.array(z.string().min(1)).min(1),
  selectionGuidance: z.string().min(1),
});

export type CodeWriterEntry = z.infer<typeof CodeWriterEntrySchema>;

export const CodeWriterListSchema = z.array(CodeWriterEntrySchema).min(1);
