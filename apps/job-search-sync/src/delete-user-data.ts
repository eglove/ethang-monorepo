import type { TokenSchema } from "@ethang/schemas/src/auth/token.js";

import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { parseFetchJson } from "@ethang/toolbelt/fetch/json.js";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import isError from "lodash/isError.js";
import { z } from "zod";

export const deleteUserData = async (
  request: Request,
  tokenData: TokenSchema,
  environment: Env,
) => {
  const requestData = await parseFetchJson(
    request,
    z.object({
      userEmail: z.string(),
    }),
  );

  if (isError(requestData)) {
    return createJsonResponse({ message: requestData.message }, "BAD_REQUEST");
  }

  const result = await attemptAsync(async () => {
    await Promise.all([
      environment.DB.prepare(`delete from applications where userEmail = ?`)
        .bind(tokenData.email)
        .first(),
      environment.DB.prepare(`delete from questionAnswers where userEmail = ?`)
        .bind(tokenData.email)
        .first(),
    ]);
  });

  if (isError(result)) {
    return createJsonResponse(
      { message: result.message },
      "INTERNAL_SERVER_ERROR",
    );
  }

  return createJsonResponse({ message: "OK" }, "OK");
};
