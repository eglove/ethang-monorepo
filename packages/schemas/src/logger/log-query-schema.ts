import { Schema } from "effect";

import { logLevelSchema } from "./log-schema.ts";

export type LogQueryInput = Schema.Schema.Type<LogQuerySchema>;

export class LogQuerySchema extends Schema.Class<LogQuerySchema>(
  "LogQuerySchema"
)({
  endDate: Schema.optional(Schema.String),
  environment: Schema.optional(Schema.String),
  level: Schema.optional(logLevelSchema),
  limit: Schema.optional(Schema.NumberFromString),
  offset: Schema.optional(Schema.NumberFromString),
  serviceName: Schema.optional(Schema.String),
  startDate: Schema.optional(Schema.String)
}) {}
