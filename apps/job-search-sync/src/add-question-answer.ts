import type { TokenSchema } from "@ethang/schemas/src/auth/token.js";

import {
  type QuestionAnswerSchema,
  questionAnswerSchema,
} from "@ethang/schemas/src/job-search/question-answer-schema.js";
import { createJsonResponse } from "@ethang/toolbelt/src/fetch/create-json-response.js";
import { parseFetchJson } from "@ethang/toolbelt/src/fetch/json.js";
import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async.js";
import isError from "lodash/isError.js";

export const addQuestionAnswer = async (
  request: Request,
  tokenData: TokenSchema,
  environment: Env,
) => {
  const requestData = await parseFetchJson(request, questionAnswerSchema);

  if (isError(requestData)) {
    return createJsonResponse({ message: requestData.message }, "BAD_REQUEST");
  }

  return addQuestionAnswerNoCheck(requestData, tokenData, environment);
};

export const addQuestionAnswerNoCheck = async (
  requestData: QuestionAnswerSchema,
  tokenData: TokenSchema,
  environment: Env,
) => {
  const result = await attemptAsync(async () => {
    return environment.DB.prepare(
      `insert into questionAnswers (id, question, answer, userEmail) values (?, ?, ?, ?)`,
    )
      .bind(
        requestData.id,
        requestData.question,
        requestData.answer,
        tokenData.email,
      )
      .first();
  });

  if (isError(result)) {
    return createJsonResponse(
      { message: result.message },
      "INTERNAL_SERVER_ERROR",
    );
  }

  return createJsonResponse(requestData, "OK");
};
