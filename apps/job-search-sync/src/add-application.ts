import type { TokenSchema } from "@ethang/schemas/auth/token.js";

import {
  type JobApplicationSchema,
  jobApplicationSchema,
} from "@ethang/schemas/job-search/job-application-schema.js";
import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { parseFetchJson } from "@ethang/toolbelt/fetch/json.js";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import isError from "lodash/isError.js";

export const addApplication = async (
  request: Request,
  tokenData: TokenSchema,
  environment: Env,
) => {
  const requestData = await parseFetchJson(request, jobApplicationSchema);

  if (isError(requestData)) {
    return createJsonResponse({ message: requestData.message }, "BAD_REQUEST");
  }

  return addApplicationNoCheck(requestData, tokenData, environment);
};

export const addApplicationNoCheck = async (
  requestData: JobApplicationSchema,
  tokenData: TokenSchema,
  environment: Env,
) => {
  const result = await attemptAsync(async () =>
    environment.DB.prepare(
      `
    insert into applications (id, applied, company, title, url, rejected, interviewRounds, userEmail)
    values (?, ?, ?, ?, ?, ?, ?, ?)
  `,
    )
      .bind(
        requestData.id,
        requestData.applied,
        requestData.company,
        requestData.title,
        requestData.url,
        requestData.rejected,
        requestData.interviewRounds,
        tokenData.email,
      )
      .first(),
  );

  if (isError(result)) {
    return createJsonResponse(
      { message: result.message },
      "INTERNAL_SERVER_ERROR",
    );
  }

  return createJsonResponse(requestData, "OK");
};
