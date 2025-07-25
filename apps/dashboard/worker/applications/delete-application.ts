import { deleteApplicationSchema } from "@ethang/schemas/dashboard/application-schema.ts";

import { getPrismaClient } from "../prisma-client.ts";
import { queryOnBody } from "../utilities/query-on-body.ts";

export const deleteApplication = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      const prisma = getPrismaClient(environment);

      return prisma.applications.delete({ where: { id: body.id, userId } });
    },
    request,
    requestSchema: deleteApplicationSchema,
  });
};
