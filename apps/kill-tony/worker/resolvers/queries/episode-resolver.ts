import type { GraphQLResolveInfo } from "graphql/type";

import { getPrismaClient } from "../../prisma-client.ts";
import { getPrismaSelect } from "../../utilties.ts";

export const episodeResolver = async (
  _: unknown,
  _arguments: { number: number },
  contextValue: { env: Env },
  info: GraphQLResolveInfo,
) => {
  const prismaClient = getPrismaClient(contextValue.env);

  return prismaClient.episode.findUnique({
    select: getPrismaSelect(info),
    where: { number: _arguments.number },
  });
};

export const episodesResolver = async (
  _: unknown,
  _arguments: { number: number },
  contextValue: { env: Env },
  info: GraphQLResolveInfo,
) => {
  const prismaClient = getPrismaClient(contextValue.env);

  return prismaClient.episode.findMany({
    select: getPrismaSelect(info),
  });
};
