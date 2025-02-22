import type { TokenSchema } from "@ethang/schemas/src/auth/token.ts";

import { jobApplicationSchema } from "@ethang/schemas/src/job-search/job-application-schema.ts";
import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { parseFetchJson } from "@ethang/toolbelt/fetch/json.js";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

import { addApplicationNoCheck } from "./add-application.js";

export const updateApplication = async (
  request: Request,
  tokenData: TokenSchema,
  environment: Env,
) => {
  const requestData = await parseFetchJson(request, jobApplicationSchema);

  if (isError(requestData)) {
    return createJsonResponse({ message: requestData.message }, "BAD_REQUEST");
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
    );
  }

  if (isNil(result)) {
    return addApplicationNoCheck(requestData, tokenData, environment);
  }

  return createJsonResponse(requestData, "OK");
};
