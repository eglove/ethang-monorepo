import { z } from "zod";

export const environment = z
  .object({
    VITE_CLERK_PUBLISHABLE_KEY: z.string().default(""),
    VITE_CONVEX_URL: z.string().default(""),
  })
  .parse(import.meta.env);
