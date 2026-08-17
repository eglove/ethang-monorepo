/* eslint-disable max-classes-per-file */
import { Effect, ParseResult, Schema } from "effect";

import { STATUSES } from "../domain/job-application/status.ts";
import { ValidationError } from "../errors/validation-error.ts";

export class CreateApplicationInputSchema extends Schema.Class<CreateApplicationInputSchema>(
  "CreateApplicationInputSchema"
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
  token: Schema.NonEmptyString
}) {}

export class ListApplicationsParamsSchema extends Schema.Class<ListApplicationsParamsSchema>(
  "ListApplicationsParamsSchema"
)({
  after: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
  first: Schema.optionalWith(Schema.Number, {
    default: () => {
      return 50;
    }
  }),
  status: Schema.optionalWith(Schema.Literal(...STATUSES), { nullable: true }),
  token: Schema.NonEmptyString
}) {}

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

export const decodeInput = <I, A>(
  schema: Schema.Schema<A, I>,
  input: unknown
) => {
  return Effect.mapError(Schema.decodeUnknown(schema)(input), (cause) => {
    return new ValidationError(
      ParseResult.TreeFormatter.formatErrorSync(cause)
    );
  });
};
