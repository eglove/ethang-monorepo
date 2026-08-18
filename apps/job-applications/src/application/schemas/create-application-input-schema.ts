import { Schema } from "effect";

import { STATUSES } from "../../domain/job-application/status.ts";

export class CreateApplicationInputSchema extends Schema.Class<CreateApplicationInputSchema>(
  "CreateApplicationInputSchema",
)({
  applicationUrl: Schema.NonEmptyString,
  appliedDate: Schema.String,
  company: Schema.NonEmptyString,
  location: Schema.optionalWith(Schema.String, { nullable: true }),
  nextInterviewDate: Schema.optionalWith(Schema.String, { nullable: true }),
  notes: Schema.optionalWith(Schema.String, { nullable: true }),
  salary: Schema.optionalWith(Schema.String, { nullable: true }),
  status: Schema.optionalWith(Schema.Literal(...STATUSES), { nullable: true }),
  title: Schema.NonEmptyString,
  token: Schema.NonEmptyString,
}) {}
