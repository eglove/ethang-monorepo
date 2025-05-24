import {
  createApplicationSchema,
  type JobApplication,
} from "@ethang/schemas/src/dashboard/application-schema.ts";
import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import { parseFetchJson } from "@ethang/toolbelt/fetch/json";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async";
import isError from "lodash/isError";
import { v7 } from "uuid";

export const createJobApplication = async (
  request: Request,
  environment: Env,
) => {
  const body = await parseFetchJson(request, createApplicationSchema);

  if (isError(body)) {
    return createJsonResponse({ error: "Invalid request" }, "BAD_REQUEST");
  }

  const application = await attemptAsync(async () => {
    return environment.DB.prepare(
      "insert into applications (id, userId, applied, company, title, url, rejected, interviewRounds) values (?, ?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        v7(),
        body.userId,
        body.applied,
        body.company,
        body.title,
        body.url,
        body.rejected,
        body.interviewRounds,
      )
      .first<JobApplication>();
  });

  if (isError(application)) {
    return createJsonResponse(
      { error: application.message },
      "INTERNAL_SERVER_ERROR",
    );
  }

  return createJsonResponse(application, "OK");
};
