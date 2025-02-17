import type { TokenSchema } from "@ethang/schemas/src/auth/token.js";

import { jobApplicationSchema } from "@ethang/schemas/src/job-search/job-application-schema.js";
import { questionAnswerSchema } from "@ethang/schemas/src/job-search/question-answer-schema.js";
import { createJsonResponse } from "@ethang/toolbelt/src/fetch/create-json-response.js";
import { parseFetchJson } from "@ethang/toolbelt/src/fetch/json.js";
import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async.js";
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

  const applicationStatement = environment.DB.prepare(`
    insert or replace into applications (id, applied, company, title, url, rejected, interviewRounds, userEmail)
    values (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const questionAnswerStatement = environment.DB.prepare(`
    insert or replace into questionAnswers (id, question, answer, userEmail)
    values (?, ?, ?, ?)
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

  const questionAnswerBatch = map(requestData.qas, (qa) => {
    return questionAnswerStatement.bind(
      qa.id,
      qa.question,
      qa.answer,
      tokenData.email,
    );
  });

  const sqlResult = await attemptAsync(async () => {
    return Promise.all([
      environment.DB.batch(applicationBatch),
      environment.DB.batch(questionAnswerBatch),
    ]);
  });

  if (isError(sqlResult)) {
    return createJsonResponse(
      { message: sqlResult.message },
      "INTERNAL_SERVER_ERROR",
    );
  }

  return createJsonResponse(requestData, "OK");
};
