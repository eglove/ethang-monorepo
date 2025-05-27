import { deleteQuestionAnswerSchema } from "@ethang/schemas/src/dashboard/question-answer-schema.ts";

import { queryOnBody } from "../utilities/query-on-body.ts";

export const deleteQuestionAnswer = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      return environment.DB.prepare(
        "delete from questionAnswers where id = ? and userId = ?",
      )
        .bind(body.id, userId)
        .first();
    },
    request,
    requestSchema: deleteQuestionAnswerSchema,
  });
};
