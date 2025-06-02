import { updateApplicationSchema } from "@ethang/schemas/src/dashboard/application-schema.ts";

import { getPrismaClient } from "../prisma-client.ts";
import { queryOnBody } from "../utilities/query-on-body.ts";

export const updateJobApplication = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      const prisma = getPrismaClient(environment);

      await prisma.applications.update({
        data: {
          interviewRounds: {
            deleteMany: {},
          },
        },
        where: { id: body.id, userId },
      });

      return prisma.applications.update({
        data: {
          applied: body.applied,
          company: body.company,
          interviewRounds: {
            createMany: {
              data: body.interviewRounds,
            },
          },
          rejected: body.rejected,
          title: body.title,
          url: body.url,
        },
        where: { id: body.id, userId },
      });
    },
    request,
    requestSchema: updateApplicationSchema,
  });
};
