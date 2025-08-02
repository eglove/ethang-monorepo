import type { GraphQLResolveInfo } from "graphql/type";

import type { Context } from "../types.ts";

import { prismaSelect } from "../utilities/prisma-select.ts";

export const getAllTodosResolver = async (
  _: never,
  __: never,
  context: Context,
  info: GraphQLResolveInfo,
) => {
  return context.prisma.todos.findMany({
    orderBy: { dueDate: "asc" },
    select: prismaSelect(info),
    where: { userId: context.userId },
  });
};
