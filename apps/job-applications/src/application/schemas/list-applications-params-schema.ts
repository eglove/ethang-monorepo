import { Schema } from "effect";

import { STATUSES } from "../../domain/job-application/status.ts";
import { ApplicationCursorFromEncoded } from "../application-cursor.ts";

export class ListApplicationsParamsSchema extends Schema.Class<ListApplicationsParamsSchema>(
  "ListApplicationsParamsSchema"
)({
  after: Schema.optionalWith(ApplicationCursorFromEncoded, { nullable: true }),
  first: Schema.optionalWith(Schema.Number, {
    default: () => {
      return 50;
    }
  }),
  status: Schema.optionalWith(Schema.Literal(...STATUSES), { nullable: true }),
  token: Schema.NonEmptyString
}) {}
