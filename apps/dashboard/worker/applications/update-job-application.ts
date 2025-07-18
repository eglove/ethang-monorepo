import { updateApplicationSchema } from "@ethang/schemas/dashboard/application-schema.ts";
import isNil from "lodash/isNil.js";

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

      return prisma.applications.update({
        data: {
          applied: body.applied,
          company: body.company,
          dmSent: isNil(body.dmSent) ? null : body.dmSent,
          dmUrl: isNil(body.dmUrl) ? null : body.dmUrl,
          jobBoardUrl: isNil(body.jobBoardUrl) ? null : body.jobBoardUrl,
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
