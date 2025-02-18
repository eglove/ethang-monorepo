import type { TokenSchema } from "@ethang/schemas/src/auth/token.ts";

import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import { parseJson } from "@ethang/toolbelt/json/json.js";
import get from "lodash/get.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";
import { z } from "zod";

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

    return createJsonResponse(
      map(applications.results, (result) => {
        const interviewRounds = get(result, ["interviewRounds"]);
        const parsed = isString(interviewRounds)
          ? parseJson(interviewRounds, z.array(z.string()))
          : [];

        return {
          ...result,
          interviewRounds: isError(parsed) ? [] : parsed,
        };
      }),
      "OK",
    );
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

  const interviewRounds = get(application, ["interviewRounds"]);
  const parsed = isString(interviewRounds)
    ? parseJson(interviewRounds, z.array(z.string()))
    : [];

  return createJsonResponse(
    {
      ...application,
      interviewRounds: isError(parsed) ? [] : parsed,
    },
    "OK",
  );
};
