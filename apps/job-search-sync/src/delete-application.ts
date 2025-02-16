import type { TokenSchema } from "@ethang/schemas/src/auth/token.js";

import { createJsonResponse } from "@ethang/toolbelt/src/fetch/create-json-response.js";
import { parseFetchJson } from "@ethang/toolbelt/src/fetch/json.js";
import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async.js";
import isError from "lodash/isError.js";
import { z } from "zod";

export const deleteApplication = async (
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
    return createJsonResponse({ message: requestData.message }, "BAD_REQUEST");
  }

  const result = await attemptAsync(async () =>
    environment.DB.prepare(
      `
    delete from applications
    where id = ?
    and userEmail = ?
    `,
    )
      .bind(requestData.id, tokenData.email)
      .first(),
  );

  if (isError(result)) {
    return createJsonResponse(
      { message: result.message },
      "INTERNAL_SERVER_ERROR",
    );
  }

  return createJsonResponse({ id: requestData.id }, "OK");
};
