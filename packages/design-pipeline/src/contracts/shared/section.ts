import { z } from "zod";

export const SectionSchema = z.object({
  heading: z.string(),
  required: z.boolean(),
});
