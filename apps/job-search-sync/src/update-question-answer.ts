import type { TokenSchema } from "@ethang/schemas/auth/token.js";

import { questionAnswerSchema } from "@ethang/schemas/job-search/question-answer-schema.js";
import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { parseFetchJson } from "@ethang/toolbelt/fetch/json.js";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

import { addQuestionAnswerNoCheck } from "./add-question-answer.js";

export const updateQuestionAnswer = async (
  request: Request,
  tokenData: TokenSchema,
  environment: Env,
) => {
  const requestData = await parseFetchJson(request, questionAnswerSchema);

  if (isError(requestData)) {
    return createJsonResponse({ message: requestData.message }, "BAD_REQUEST");
  }

  const result = await attemptAsync(async () => {
    return environment.DB.prepare(
      `update questionAnswers set question = ?, answer = ? where id = ? and userEmail = ?`,
    )
      .bind(
        requestData.question,
        requestData.answer,
        requestData.id,
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

  if (isNil(result)) {
    return addQuestionAnswerNoCheck(requestData, tokenData, environment);
  }

  return createJsonResponse(requestData, "OK");
};
