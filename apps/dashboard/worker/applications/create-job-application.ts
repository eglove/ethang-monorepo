import {
  createApplicationSchema,
  type JobApplication,
} from "@ethang/schemas/src/dashboard/application-schema.ts";
import { v7 } from "uuid";

import { queryOnBody } from "../utilities/query-on-body.ts";

export const createJobApplication = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      return environment.DB.prepare(
        "insert into applications (id, userId, applied, company, title, url, rejected, interviewRounds) values (?, ?, ?, ?, ?, ?, ?, ?)",
      )
        .bind(
          v7(),
          userId,
          body.applied,
          body.company,
          body.title,
          body.url,
          body.rejected,
          body.interviewRounds,
        )
        .first<JobApplication>();
    },
    request,
    requestSchema: createApplicationSchema,
  });
};
