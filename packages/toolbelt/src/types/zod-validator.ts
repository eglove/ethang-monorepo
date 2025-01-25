import type { z, ZodSchema } from "zod";

export type ZodValidator<Z extends ZodSchema> = ZodSchema<z.output<Z>>;
