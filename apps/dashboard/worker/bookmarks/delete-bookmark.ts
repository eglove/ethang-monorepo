import { deleteBookmarkSchema } from "@ethang/schemas/dashboard/bookmark-schema.ts";

import { getPrismaClient } from "../prisma-client.ts";
import { queryOnBody } from "../utilities/query-on-body.ts";

export const deleteBookmark = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      const prisma = getPrismaClient(environment);

      return prisma.bookmarks.delete({
        where: {
          id: body.id,
          userId,
        },
      });
    },
    request,
    requestSchema: deleteBookmarkSchema,
  });
};
