import { deleteContactSchema } from "@ethang/schemas/dashboard/contact-schema.ts";

import { getPrismaClient } from "../prisma-client.ts";
import { queryOnBody } from "../utilities/query-on-body.ts";

export const deleteContact = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      const prisma = getPrismaClient(environment);

      return prisma.contacts.delete({ where: { id: body.id, userId } });
    },
    request,
    requestSchema: deleteContactSchema,
  });
};
