import type { GraphQLResolveInfo } from "graphql/type";

import { getPrismaClient } from "../../prisma-client.ts";
import { getPrismaSelect } from "../../utilties.ts";

export const appearanceResolver = async (
  _: unknown,
  _arguments: { name: string },
  contextValue: { env: Env },
  info: GraphQLResolveInfo,
) => {
  const prismaClient = getPrismaClient(contextValue.env);

  return prismaClient.appearance.findUnique({
    select: getPrismaSelect(info),
    where: { name: _arguments.name },
  });
};

export const appearancesResolver = async (
  _: unknown,
  _arguments: { name: string },
  contextValue: { env: Env },
  info: GraphQLResolveInfo,
) => {
  const prismaClient = getPrismaClient(contextValue.env);

  return prismaClient.appearance.findMany({
    select: getPrismaSelect(info),
  });
};
