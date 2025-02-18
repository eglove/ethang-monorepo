import type { TokenSchema } from "@ethang/schemas/auth/token.js";

import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import isError from "lodash/isError.js";

export const getQas = async (tokenData: TokenSchema, environment: Env) => {
  const qas = await attemptAsync(async () => {
    return environment.DB.prepare(
      `select *
             from questionAnswers
             where userEmail = ?`,
    )
      .bind(tokenData.email)
      .all();
  });

  if (isError(qas)) {
    return createJsonResponse({ error: qas.message }, "INTERNAL_SERVER_ERROR");
  }

  return createJsonResponse(qas.results, "OK");
};
