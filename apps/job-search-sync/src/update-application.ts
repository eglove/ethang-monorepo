import type { TokenSchema } from "@ethang/schemas/src/auth/token.js";

import { jobApplicationSchema } from "@ethang/schemas/src/job-search/job-application-schema.js";
import { createJsonResponse } from "@ethang/toolbelt/src/fetch/create-json-response.js";
import { parseFetchJson } from "@ethang/toolbelt/src/fetch/json.js";
import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async.js";
import isError from "lodash/isError.js";

export const updateApplication = async (
  request: Request,
  tokenData: TokenSchema,
  environment: Env,
) => {
  const requestData = await parseFetchJson(request, jobApplicationSchema);

  if (isError(requestData)) {
    return createJsonResponse(
      { message: requestData.message },
      "BAD_REQUEST",
      undefined,
      request,
    );
  }

  const result = await attemptAsync(async () =>
    environment.DB.prepare(
      `update applications
    set applied = ?,
        company = ?,
        title = ?,
        url = ?,
        rejected = ?,
        interviewRounds = ?
    where id = ?
    and userEmail = ?`,
    )
      .bind(
        requestData.applied,
        requestData.company,
        requestData.title,
        requestData.url,
        requestData.rejected,
        requestData.interviewRounds,
        requestData.id,
        tokenData.email,
      )
      .first(),
  );

  if (isError(result)) {
    return createJsonResponse(
      { message: result.message },
      "INTERNAL_SERVER_ERROR",
      undefined,
      request,
    );
  }

  return createJsonResponse(requestData, "OK", undefined, request);
};
