import type { TokenSchema } from "@ethang/schemas/src/auth/token.ts";

import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import { parseJson } from "@ethang/toolbelt/json/json.js";
import { get, isString } from "lodash";
import isError from "lodash/isError.js";
import map from "lodash/map.js";
import { z } from "zod";

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

  return createJsonResponse(
    {
      applications: map(results[0].results, (application) => {
        const rounds = get(application, ["interviewRounds"]);
        const parsed = isString(rounds)
          ? parseJson(rounds, z.array(z.string()))
          : [];

        return {
          ...application,
          interviewRounds: isError(parsed) ? [] : parsed,
        };
      }),
      qas: results[1].results,
    },
    "OK",
  );
};
