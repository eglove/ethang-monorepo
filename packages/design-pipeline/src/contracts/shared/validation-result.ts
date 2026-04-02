import { z } from "zod";

const ValidationErrorSchema = z.object({
  code: z.string().min(1),
  expected: z.string(),
  hint: z.string(),
  path: z.string(),
  received: z.string(),
});

export const ValidationResultSchema = z
  .object({
    errors: z.array(ValidationErrorSchema),
    valid: z.boolean(),
  })
  .refine(
    (result) => {
      if (result.valid) {
        return 0 === result.errors.length;
      }

      return 0 < result.errors.length;
    },
    {
      message:
        "valid=true requires empty errors; valid=false requires non-empty errors",
    },
  );

export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
