import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";

import { getPrismaClient } from "../prisma-client.ts";

export const getAllBookmarks = async (environment: Env, userId: string) => {
  const prisma = await getPrismaClient(environment);

  const bookmarks = await prisma.bookmarks.findMany({
    where: {
      userId,
    },
  });

  return createJsonResponse(bookmarks, "OK");
};
