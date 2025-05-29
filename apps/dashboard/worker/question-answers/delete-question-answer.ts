import { deleteQuestionAnswerSchema } from "@ethang/schemas/src/dashboard/question-answer-schema.ts";

import { getPrismaClient } from "../prisma-client.ts";
import { queryOnBody } from "../utilities/query-on-body.ts";

export const deleteQuestionAnswer = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      const prisma = getPrismaClient(environment);

      return prisma.questionAnswers.delete({ where: { id: body.id, userId } });
    },
    request,
    requestSchema: deleteQuestionAnswerSchema,
  });
};
