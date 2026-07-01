import { Schema } from "effect";

export const logLevelSchema = Schema.Literal(
  "debug",
  "info",
  "warn",
  "error",
  "fatal"
);

export type LogIngestInput = Schema.Schema.Type<LogIngestSchema>;

export class LogIngestSchema extends Schema.Class<LogIngestSchema>(
  "LogIngestSchema"
)({
  environment: Schema.String,
  level: logLevelSchema,
  message: Schema.String,
  metadata: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.String })
  ),
  serviceName: Schema.String,
  stack: Schema.optional(Schema.String)
}) {}
