import { Schema } from "effect";

import { isIsoDate } from "../../domain/job-application/iso-date.ts";
import { STATUSES } from "../../domain/job-application/status.ts";

const AppliedDateSchema = Schema.NonEmptyString.pipe(
  Schema.filter((value) => {
    return isIsoDate(value);
  }),
);

export class ListApplicationsParamsSchema extends Schema.Class<ListApplicationsParamsSchema>(
  "ListApplicationsParamsSchema",
)({
  appliedDate: AppliedDateSchema,
  status: Schema.optionalWith(Schema.Literal(...STATUSES), { nullable: true }),
  token: Schema.NonEmptyString,
}) {}
