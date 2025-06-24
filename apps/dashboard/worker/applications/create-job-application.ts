import { createApplicationSchema } from "@ethang/schemas/src/dashboard/application-schema.ts";
import isNil from "lodash/isNil.js";

import { getPrismaClient } from "../prisma-client.ts";
import { queryOnBody } from "../utilities/query-on-body.ts";

export const createJobApplication = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      const prisma = getPrismaClient(environment);

      return prisma.applications.create({
        data: {
          applied: body.applied,
          company: body.company,
          jobBoardUrl: isNil(body.jobBoardUrl) ? null : body.jobBoardUrl,
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
