import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";

import { getPrismaClient } from "../prisma-client";

export const getAllQuestionAnswers = async (
  environment: Env,
  userId: string,
) => {
  const prisma = getPrismaClient(environment);
  const questionAnswers = await prisma.questionAnswers.findMany({
    where: { userId },
  });

  return createJsonResponse(questionAnswers, "OK");
};
