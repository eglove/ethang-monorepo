import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";

import { getPrismaClient } from "../prisma-client";

export const getAllContacts = async (environment: Env, userId: string) => {
  const prisma = await getPrismaClient(environment);

  const contacts = await prisma.contacts.findMany({
    orderBy: [{ expectedNextContact: "asc" }, { lastContact: "asc" }],
    where: {
      userId,
    },
  });

  return createJsonResponse(contacts, "OK");
};
