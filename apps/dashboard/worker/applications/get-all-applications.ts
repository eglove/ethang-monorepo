import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";

import { getPrismaClient } from "../prisma-client.ts";

export const getAllApplications = async (environment: Env, userId: string) => {
  const prisma = getPrismaClient(environment);
  const applications = await prisma.applications.findMany({
    where: { userId },
  });

  return createJsonResponse(applications, "OK");
};
