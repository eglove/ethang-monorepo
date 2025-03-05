/* eslint-disable @typescript-eslint/no-unsafe-type-assertion,@typescript-eslint/no-unsafe-assignment */
import type { TokenSchema } from "@ethang/schemas/src/auth/token.js";

import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import get from "lodash/get.js";
import isError from "lodash/isError.js";
import times from "lodash/times.js";

import { userStatsQuery } from "./sql-queries/stats.js";

export const userStats = async (tokenData: TokenSchema, environment: Env) => {
  const results = await attemptAsync(async () => {
    return environment.DB.prepare(userStatsQuery)
      .bind(...times(7, () => tokenData.email))
      .first();
  });

  if (isError(results)) {
    return createJsonResponse(
      { message: "Failed to get stats" },
      "INTERNAL_SERVER_ERROR",
    );
  }

  return createJsonResponse(
    {
      ...results,
      applicationsPerDay: JSON.parse(
        get(results, ["applicationsPerDay"], "") as string,
      ),
      topCompanies: JSON.parse(get(results, ["topCompanies"], "") as string),
    },
    "OK",
  );
};
