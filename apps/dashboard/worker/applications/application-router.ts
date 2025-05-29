import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";

import { createJobApplication } from "./create-job-application.ts";
import { deleteApplication } from "./delete-application.ts";
import { getAllApplications } from "./get-all-applications.ts";
import { updateJobApplication } from "./update-job-application.ts";

export const applicationRouter = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  switch (request.method) {
    case "DELETE": {
      return deleteApplication(request, environment, userId);
    }

    case "GET": {
      return getAllApplications(environment, userId);
    }

    case "POST": {
      return createJobApplication(request, environment, userId);
    }

    case "PUT": {
      return updateJobApplication(request, environment, userId);
    }

    default: {
      return createJsonResponse(
        { error: "Method not allowed" },
        "METHOD_NOT_ALLOWED",
      );
    }
  }
};
