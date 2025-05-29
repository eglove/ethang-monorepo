import { createBookmarkSchema } from "@ethang/schemas/src/dashboard/bookmark-schema.ts";

import { getPrismaClient } from "../prisma-client.ts";
import { queryOnBody } from "../utilities/query-on-body.ts";

export const createBookmark = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      const prisma = await getPrismaClient(environment);

      return prisma.bookmarks.create({
        data: {
          title: body.title,
          url: body.url,
          userId,
        },
      });
    },
    request,
    requestSchema: createBookmarkSchema,
  });
};
