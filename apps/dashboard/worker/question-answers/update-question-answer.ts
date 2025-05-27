import { questionAnswerSchema } from "@ethang/schemas/src/dashboard/question-answer-schema.ts";

import { queryOnBody } from "../utilities/query-on-body.ts";

export const updateQuestionAnswer = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      return environment.DB.prepare(
        "update questionAnswers set question = ?, answer = ? where id = ? and userId = ?",
      )
        .bind(body.question, body.answer, body.id, userId)
        .first();
    },
    request,
    requestSchema: questionAnswerSchema,
  });
};
