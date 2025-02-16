import type { TokenSchema } from "@ethang/schemas/src/auth/token.js";

import { createJsonResponse } from "@ethang/toolbelt/src/fetch/create-json-response.js";
import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async.js";
import isError from "lodash/isError.js";

export const getData = async (tokenData: TokenSchema, environment: Env) => {
  const results = await attemptAsync(async () =>
    Promise.all([
      environment.DB.prepare("select * from applications where userEmail = ?")
        .bind(tokenData.email)
        .all(),
      environment.DB.prepare(
        "select * from questionAnswers where userEmail = ?",
      )
        .bind(tokenData.email)
        .all(),
    ]),
  );

  if (isError(results)) {
    return createJsonResponse(
      { error: results.message },
      "INTERNAL_SERVER_ERROR",
    );
  }

  return createJsonResponse(results, "OK");
};
