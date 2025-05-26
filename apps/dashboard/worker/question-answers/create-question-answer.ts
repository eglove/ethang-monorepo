import {
  createQuestionAnswerSchema,
  type QuestionAnswer,
} from "@ethang/schemas/src/dashboard/question-answer-schema.ts";
import { v7 } from "uuid";

import { queryOnBody } from "../utilities/query-on-body.ts";

export const createQuestionAnswer = async (
  request: Request,
  environment: Env,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      return environment.DB.prepare(
        "insert into questionAnswers (id, userId, question, answer) values (?, ?, ?, ?)",
      )
        .bind(v7(), body.userId, body.question, body.answer)
        .first<QuestionAnswer>();
    },
    request,
    requestSchema: createQuestionAnswerSchema,
  });
};
