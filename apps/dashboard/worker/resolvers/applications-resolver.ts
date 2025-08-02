import type { GraphQLResolveInfo } from "graphql/type";

import isNil from "lodash/isNil.js";

import type { Context } from "../types.ts";

import { prismaSelectWithPagination } from "../utilities/prisma-select.ts";

export const getAllApplicationsResolver = async (
  _: never,
  _arguments: { limit: number; page: number; search: string | undefined },
  context: Context,
  info: GraphQLResolveInfo,
) => {
  const where: {
    OR?: Record<string, { contains: string }>[];
    userId: string;
  } = { userId: context.userId };

  if (!isNil(_arguments.search)) {
    where.OR = [
      { company: { contains: _arguments.search } },
      { title: { contains: _arguments.search } },
    ];
  }

  const total = await context.prisma.applications.count({ where });

  const applications = await context.prisma.applications.findMany({
    select: prismaSelectWithPagination(info, "applications"),
    where: {
      userId: context.userId,
    },
  });

  return {
    applications,
    pagination: {
      limit: _arguments.limit,
      page: _arguments.page,
      total,
      totalPages: Math.ceil(total / _arguments.limit),
    },
  };
};
