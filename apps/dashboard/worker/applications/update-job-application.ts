import { applicationSchema } from "@ethang/schemas/src/dashboard/application-schema.ts";
import isArray from "lodash/isArray.js";

import { queryOnBody } from "../utilities/query-on-body.ts";

export const updateJobApplication = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      return environment.DB.prepare(
        "update applications set title = ?, url = ?, company = ?, applied = ?, interviewRounds = ?, rejected = ? where id = ? and userId = ?",
      )
        .bind(
          body.title,
          body.url,
          body.company,
          body.applied,
          isArray(body.interviewRounds)
            ? JSON.stringify(body.interviewRounds)
            : body.interviewRounds,
          body.rejected,
          body.id,
          userId,
        )
        .first();
    },
    request,
    requestSchema: applicationSchema,
  });
};
