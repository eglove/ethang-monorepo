import type { TokenSchema } from "@ethang/schemas/src/auth/token.js";

import { createJsonResponse } from "@ethang/toolbelt/src/fetch/create-json-response.js";
import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

export const getApplications = async (
  request: Request,
  tokenData: TokenSchema,
  environment: Env,
) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (isNil(id)) {
    const applications = await attemptAsync(async () => {
      return environment.DB.prepare(
        `select *
             from applications
             where userEmail = ?`,
      )
        .bind(tokenData.email)
        .all();
    });

    if (isError(applications)) {
      return createJsonResponse(
        { error: applications.message },
        "INTERNAL_SERVER_ERROR",
      );
    }

    return createJsonResponse(applications, "OK");
  }

  const application = await attemptAsync(async () => {
    return environment.DB.prepare(
      `select *
             from applications
             where userEmail = ? and id = ?`,
    )
      .bind(tokenData.email, id)
      .first();
  });

  if (isError(application)) {
    return createJsonResponse(
      { error: application.message },
      "INTERNAL_SERVER_ERROR",
    );
  }

  return createJsonResponse(application, "OK");
};
