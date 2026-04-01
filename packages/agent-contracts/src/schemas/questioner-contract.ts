import { z } from "zod";

export const dispatchTargetListSchema = z.array(z.string().min(1));

export const decisionGuideRowSchema = z.object({
  recommendation: z.string().min(1),
  trigger: z.string().min(1),
});
