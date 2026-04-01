import { z } from "zod";

export const HandoffContractSchema = z.object({
  format: z.string().optional(),
  passes: z.string().min(1),
  passesTo: z.string().min(1),
});
