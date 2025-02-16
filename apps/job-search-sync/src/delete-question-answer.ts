import type { TokenSchema } from "@ethang/schemas/src/auth/token.js";

import { createJsonResponse } from "@ethang/toolbelt/src/fetch/create-json-response.js";
import { parseFetchJson } from "@ethang/toolbelt/src/fetch/json.js";
import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async.js";
import isError from "lodash/isError.js";
import { z } from "zod";

export const deleteQuestionAnswer = async (
  request: Request,
  tokenData: TokenSchema,
  environment: Env,
) => {
  const requestData = await parseFetchJson(
    request,
    z.object({
      id: z.string(),
    }),
  );

  if (isError(requestData)) {
    return createJsonResponse(
      { message: requestData.message },
      "BAD_REQUEST",
      undefined,
      request,
    );
  }

  const result = await attemptAsync(async () => {
    return environment.DB.prepare(
      `delete from questionAnswers where id = ? and userEmail = ?`,
    )
      .bind(requestData.id, tokenData.email)
      .first();
  });

  if (isError(result)) {
    return createJsonResponse(
      { message: result.message },
      "INTERNAL_SERVER_ERROR",
      undefined,
      request,
    );
  }

  return createJsonResponse({ id: requestData.id }, "OK", undefined, request);
};
