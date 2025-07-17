import type { GraphQLResolveInfo } from "graphql/type";

import map from "lodash/map.js";

import type { Appearance, Episode } from "../../../generated/prisma/client.ts";
import type { CreateAppearance } from "./appearance.ts";

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
    data: {
      ..._arguments.input,
      appearances: {
        connectOrCreate: map(_arguments.input.appearances, (appearance) => {
          return {
            create: appearance,
            where: { name: appearance.name },
          };
        }),
      },
    },
    select: getPrismaSelect(info),
  });
};

type AddAppearanceToEpisodeInput = {
  appearance: CreateAppearance;
  number: number;
};

export const addAppearanceToEpisodeMutation = async (
  _: unknown,
  _arguments: { input: AddAppearanceToEpisodeInput },
  contextValue: { env: Env },
  info: GraphQLResolveInfo,
) => {
  const prismaClient = getPrismaClient(contextValue.env);

  return prismaClient.episode.update({
    data: {
      appearances: {
        connectOrCreate: {
          create: _arguments.input.appearance,
          where: { name: _arguments.input.appearance.name },
        },
      },
    },
    select: getPrismaSelect(info),
    where: { number: _arguments.input.number },
  });
};
