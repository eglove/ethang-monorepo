import type { GraphQLResolveInfo } from "graphql/type";

import get from "lodash/get.js";

import type { PathSelect } from "../../generated/prisma/models/Path.ts";

import { getPrismaClient, prismaSelect } from "../prisma-client.ts";

export const path = async (
  _parent: unknown,
  _arguments: { id: string },
  context: { env: Env },
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<PathSelect>(info, {
    Path: ["id", "__typename"],
  });

  return prisma.path.findUnique({
    select,
    where: { id: get(_arguments, ["id"]) },
  });
};

export const paths = async (
  _parent: unknown,
  _arguments: unknown,
  context: { env: Env },
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<PathSelect>(info, {
    Path: ["id", "__typename"],
  });

  return prisma.path.findMany({
    orderBy: {
      order: "asc",
    },
    select,
  });
};
