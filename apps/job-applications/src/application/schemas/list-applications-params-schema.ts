import { Schema } from "effect";

import { STATUSES } from "../../domain/job-application/status.ts";

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
