import isString from "lodash/isString.js";
import { DateTime } from "luxon";
import { z } from "zod";

export const logIngestSchema = z.object({
  environment: z.string(),
  level: z.enum(["debug", "info", "warn", "error", "fatal"]),
  message: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  serviceName: z.string(),
  stack: z.string().optional()
});

export const logQuerySchema = z.object({
  endDate: z
    .preprocess((value) => {
      if (isString(value)) {
        const date = DateTime.fromISO(value);

        return date.isValid ? date.toJSDate() : undefined;
      }
      return value;
    }, z.date().optional())
    .optional(),
  environment: z.string().optional(),
  level: z.enum(["debug", "info", "warn", "error", "fatal"]).optional(),
  limit: z.coerce.number().max(100).optional(),
  offset: z.coerce.number().optional(),
  serviceName: z.string().optional(),
  startDate: z
    .preprocess((value) => {
      if (isString(value)) {
        const date = DateTime.fromISO(value);

        return date.isValid ? date.toJSDate() : null;
      }
      return value;
    }, z.date().optional())
    .optional()
});

export type LogIngestInput = z.infer<typeof logIngestSchema>;
export type LogQueryInput = z.infer<typeof logQuerySchema>;
