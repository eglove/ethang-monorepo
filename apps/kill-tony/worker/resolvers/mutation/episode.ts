import type { GraphQLResolveInfo } from "graphql/type";

import set from "lodash/set";

import type { Appearance, Episode } from "../../../generated/prisma/client.ts";

import { getPrismaClient } from "../../prisma-client.ts";
import { getPrismaSelect } from "../../utilties.ts";

type Input = { appearances: Omit<Appearance, "id">[] } & Episode;

export const createEpisodeMutation = async (
  _: unknown,
  _arguments: { input: Input },
  contextValue: { env: Env },
  info: GraphQLResolveInfo,
) => {
  const prismaClient = getPrismaClient(contextValue.env);

  return prismaClient.episode.create({
    data: _arguments.input,
    select: getPrismaSelect(info),
  });
};

type AddAppearanceToEpisodeInput = {
  isBucketPull: boolean;
  isGoldenTicketCashIn: boolean;
  isGuest: boolean;
  isRegular: boolean;
  name: string;
  number: number;
};

export const addAppearanceToEpisodeMutation = async (
  _: unknown,
  _arguments: { input: AddAppearanceToEpisodeInput },
  contextValue: { env: Env },
  info: GraphQLResolveInfo,
) => {
  const prismaClient = getPrismaClient(contextValue.env);

  const connectOrCreate = {
    connectOrCreate: {
      create: { name: _arguments.input.name },
      where: { name: _arguments.input.name },
    },
  };

  const dataParameter = {};
  if (_arguments.input.isBucketPull) {
    set(dataParameter, ["bucketPulls"], connectOrCreate);
  }

  if (_arguments.input.isGoldenTicketCashIn) {
    set(dataParameter, ["goldenTicketCashIns"], connectOrCreate);
  }

  if (_arguments.input.isGuest) {
    set(dataParameter, ["guests"], connectOrCreate);
  }

  if (_arguments.input.isRegular) {
    set(dataParameter, ["regulars"], connectOrCreate);
  }

  return prismaClient.episode.update({
    data: dataParameter,
    select: getPrismaSelect(info),
    where: { number: _arguments.input.number },
  });
};
