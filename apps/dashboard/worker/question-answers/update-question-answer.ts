import { questionAnswerSchema } from "@ethang/schemas/dashboard/question-answer-schema.ts";

import { getPrismaClient } from "../prisma-client.ts";
import { queryOnBody } from "../utilities/query-on-body.ts";

export const updateQuestionAnswer = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      const prisma = getPrismaClient(environment);

      return prisma.questionAnswers.update({
        data: {
          answer: body.answer,
          question: body.question,
        },
        where: {
          id: body.id,
          userId,
        },
      });
    },
    request,
    requestSchema: questionAnswerSchema,
  });
};
