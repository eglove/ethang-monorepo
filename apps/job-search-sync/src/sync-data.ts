import type { TokenSchema } from "@ethang/schemas/src/auth/token.ts";

import { jobApplicationSchema } from "@ethang/schemas/src/job-search/job-application-schema.ts";
import { questionAnswerSchema } from "@ethang/schemas/src/job-search/question-answer-schema.ts";
import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { parseFetchJson } from "@ethang/toolbelt/fetch/json.js";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import isEmpty from "lodash/isEmpty.js";
import isError from "lodash/isError.js";
import map from "lodash/map.js";
import { z } from "zod";

export const syncData = async (
  request: Request,
  tokenData: TokenSchema,
  environment: Env,
) => {
  const requestData = await parseFetchJson(
    request,
    z.object({
      applications: z.array(jobApplicationSchema),
      qas: z.array(questionAnswerSchema),
    }),
  );

  if (isError(requestData)) {
    return createJsonResponse({ message: requestData.message }, "BAD_REQUEST");
  }

  if (isEmpty(requestData.applications) && isEmpty(requestData.qas)) {
    return createJsonResponse({ message: "No data to sync" }, "BAD_REQUEST");
  }

  if (!isEmpty(requestData.applications)) {
    const applicationStatement = environment.DB.prepare(`
    insert or replace into applications (id, applied, company, title, url, rejected, interviewRounds, userEmail)
    values (?, ?, ?, ?, ?, ?, ?, ?)
  `);

    const applicationBatch = map(requestData.applications, (application) => {
      return applicationStatement.bind(
        application.id,
        application.applied,
        application.company,
        application.title,
        application.url,
        application.rejected ?? null,
        application.interviewRounds
          ? JSON.stringify(application.interviewRounds)
          : null,
        tokenData.email,
      );
    });

    const applicationResult = await attemptAsync(async () => {
      return environment.DB.batch(applicationBatch);
    });

    if (isError(applicationResult)) {
      return createJsonResponse(
        { message: applicationResult.message },
        "INTERNAL_SERVER_ERROR",
      );
    }
  }

  if (!isEmpty(requestData.qas)) {
    const questionAnswerStatement = environment.DB.prepare(`
    insert or replace into questionAnswers (id, question, answer, userEmail)
    values (?, ?, ?, ?)
  `);

    const questionAnswerBatch = map(requestData.qas, (qa) => {
      return questionAnswerStatement.bind(
        qa.id,
        qa.question,
        qa.answer,
        tokenData.email,
      );
    });

    const qaResult = await attemptAsync(async () => {
      return environment.DB.batch(questionAnswerBatch);
    });

    if (isError(qaResult)) {
      return createJsonResponse(
        { message: qaResult.message },
        "INTERNAL_SERVER_ERROR",
      );
    }
  }

  return createJsonResponse(requestData, "OK");
};
