import { jobApplicationSchema } from "@ethang/schemas/src/job-search/job-application-schema.js";
import { questionAnswerSchema } from "@ethang/schemas/src/job-search/question-answer-schema.js";
import { createJsonResponse } from "@ethang/toolbelt/src/fetch/create-json-response.js";
import { parseFetchJson } from "@ethang/toolbelt/src/fetch/json.js";
import isError from "lodash/isError.js";
import { z } from "zod";

export const syncData = async (request: Request) => {
  const data = await parseFetchJson(
    request,
    z.object({
      applications: z.array(jobApplicationSchema),
      qas: z.array(questionAnswerSchema),
    }),
  );

  if (isError(data)) {
    return createJsonResponse(
      { message: data.message },
      "BAD_REQUEST",
      undefined,
      request,
    );
  }

  return createJsonResponse(data, "OK", undefined, request);
};
