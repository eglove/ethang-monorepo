import type { GraphQLResolveInfo } from "graphql/type";

import { getPrismaClient } from "../../prisma-client";
import { getPrismaSelect } from "../../utilties";

export type CreateAppearance = {
  isBucketPull: boolean;
  isGoldenTicketWinner: boolean;
  isGuest: boolean;
  isHallOfFame: boolean;
  isRegular: boolean;
  name: string;
};

export const createAppearanceMutation = async (
  _: unknown,
  _arguments: { input: CreateAppearance },
  contextValue: { env: Env },
  info: GraphQLResolveInfo,
) => {
  const prismaClient = getPrismaClient(contextValue.env);

  return prismaClient.appearance.create({
    data: _arguments.input,
    select: getPrismaSelect(info),
  });
};
