import { Schema } from "effect";

import { STATUSES } from "../../domain/job-application/status.ts";

export class UpdateApplicationChangesSchema extends Schema.Class<UpdateApplicationChangesSchema>(
  "UpdateApplicationChangesSchema"
)({
  appliedDate: Schema.optional(Schema.String),
  company: Schema.optional(Schema.NonEmptyString),
  id: Schema.NonEmptyString,
  location: Schema.optionalWith(Schema.String, { nullable: true }),
  nextInterviewDate: Schema.optionalWith(Schema.String, { nullable: true }),
  notes: Schema.optionalWith(Schema.String, { nullable: true }),
  salary: Schema.optionalWith(Schema.String, { nullable: true }),
  status: Schema.optionalWith(Schema.Literal(...STATUSES), { nullable: true }),
  title: Schema.optional(Schema.NonEmptyString),
  token: Schema.NonEmptyString
}) {}
