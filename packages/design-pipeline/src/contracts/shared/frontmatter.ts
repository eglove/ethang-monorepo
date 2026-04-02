import { z } from "zod";

export const FrontmatterSchema = z.object({
  description: z.string().min(1),
  name: z.string().min(1),
});
