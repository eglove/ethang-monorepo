import { createContactSchema } from "@ethang/schemas/src/dashboard/contact-schema.ts";

import { getPrismaClient } from "../prisma-client.ts";
import { queryOnBody } from "../utilities/query-on-body.ts";

export const createContact = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      const prisma = await getPrismaClient(environment);

      return prisma.contacts.create({
        data: {
          email: body.email,
          expectedNextContact: body.expectedNextContact,
          lastContact: body.lastContact,
          linkedIn: body.linkedIn,
          name: body.name,
          phone: body.phone,
          userId,
        },
      });
    },
    request,
    requestSchema: createContactSchema,
  });
};
