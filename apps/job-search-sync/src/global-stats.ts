/* eslint-disable @typescript-eslint/no-unsafe-type-assertion,@typescript-eslint/no-unsafe-assignment */
import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import get from "lodash/get.js";
import isError from "lodash/isError.js";

import { globalStatsQuery } from "./queries/global-stats.js";

export const globalStats = async (environment: Env) => {
  const results = await attemptAsync(async () => {
    return environment.DB.prepare(globalStatsQuery).first();
  });

  if (isError(results)) {
    return createJsonResponse(
      { message: "Failed to get top companies" },
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
