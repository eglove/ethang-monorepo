import { createQuestionAnswerSchema } from "@ethang/schemas/src/dashboard/question-answer-schema.ts";

import { getPrismaClient } from "../prisma-client.ts";
import { queryOnBody } from "../utilities/query-on-body.ts";

export const createQuestionAnswer = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      const prisma = await getPrismaClient(environment);

      return prisma.questionAnswers.create({
        data: {
          answer: body.answer,
          question: body.question,
          userId,
        },
      });
    },
    request,
    requestSchema: createQuestionAnswerSchema,
  });
};
