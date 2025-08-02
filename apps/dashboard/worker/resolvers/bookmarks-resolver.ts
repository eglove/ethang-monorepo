import type { GraphQLResolveInfo } from "graphql/type";

import type { Context } from "../types.ts";

import { prismaSelect } from "../utilities/prisma-select.ts";

export const getAllBookmarksResolver = async (
  _: never,
  __: never,
  context: Context,
  info: GraphQLResolveInfo,
) => {
  return context.prisma.bookmarks.findMany({
    select: prismaSelect(info),
    where: {
      userId: context.userId,
    },
  });
};
