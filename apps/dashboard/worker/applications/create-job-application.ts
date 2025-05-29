import { createApplicationSchema } from "@ethang/schemas/src/dashboard/application-schema.ts";
import isArray from "lodash/isArray.js";

import { getPrismaClient } from "../prisma-client.ts";
import { queryOnBody } from "../utilities/query-on-body.ts";

export const createJobApplication = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      const prisma = await getPrismaClient(environment);

      return prisma.applications.create({
        data: {
          applied: body.applied,
          company: body.company,
          interviewRounds: isArray(body.interviewRounds)
            ? JSON.stringify(body.interviewRounds)
            : null,
          rejected: body.rejected,
          title: body.title,
          url: body.url,
          userId,
        },
      });
    },
    request,
    requestSchema: createApplicationSchema,
  });
};
