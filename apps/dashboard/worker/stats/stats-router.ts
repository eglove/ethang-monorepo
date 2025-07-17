import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";

import { getUserStats } from "./get-user-stats.ts";

export const statsRouter = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  // eslint-disable-next-line sonar/no-small-switch
  switch (request.method) {
    case "GET": {
      return getUserStats(environment, userId);
    }

    default: {
      return createJsonResponse(
        { error: "Method not allowed" },
        "METHOD_NOT_ALLOWED",
      );
    }
  }
};
