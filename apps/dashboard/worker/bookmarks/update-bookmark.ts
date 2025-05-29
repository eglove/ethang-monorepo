import { bookmarkSchema } from "@ethang/schemas/src/dashboard/bookmark-schema.ts";

import { getPrismaClient } from "../prisma-client.ts";
import { queryOnBody } from "../utilities/query-on-body.ts";

export const updateBookmark = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      const prisma = getPrismaClient(environment);

      return prisma.bookmarks.update({
        data: {
          title: body.title,
          url: body.url,
        },
        where: {
          id: body.id,
          userId,
        },
      });
    },
    request,
    requestSchema: bookmarkSchema,
  });
};
