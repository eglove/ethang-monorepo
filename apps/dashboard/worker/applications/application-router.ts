import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";

import { createJobApplication } from "./create-job-application.ts";
import { deleteApplication } from "./delete-application.ts";
import { getAllApplications } from "./get-all-applications.ts";
import { updateJobApplication } from "./update-job-application.ts";

export const applicationRouter = async (request: Request, environment: Env) => {
  switch (request.method) {
    case "DELETE": {
      return deleteApplication(request, environment);
    }

    case "GET": {
      return getAllApplications(request, environment);
    }

    case "POST": {
      return createJobApplication(request, environment);
    }

    case "PUT": {
      return updateJobApplication(request, environment);
    }

    default: {
      return createJsonResponse(
        { error: "Method not allowed" },
        "METHOD_NOT_ALLOWED",
      );
    }
  }
};
