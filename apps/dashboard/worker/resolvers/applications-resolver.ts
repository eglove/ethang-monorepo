import type { GraphQLResolveInfo } from "graphql/type";

import isNil from "lodash/isNil.js";
import toNumber from "lodash/toNumber";

import type { Context } from "../types.ts";

import { getAverageApplicationsPerDay } from "../stats/get-average-applications-per-day.ts";
import { getAverageResponseRate } from "../stats/get-average-response-rate.ts";
import { getAverageTimeToRejected } from "../stats/get-average-time-to-rejected.ts";
import { getDailyApplicationsMap } from "../stats/get-daily-applications-map.ts";
import { getUserStatsData } from "../stats/get-user-stats-data.ts";
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

export const getApplicationsStatsResolver = async (
  _: never,
  _arguments: { limit: number; page: number; search: string | undefined },
  context: Context,
) => {
  const {
    allUserApplications,
    topCompanies,
    totalApplications,
    totalCompanies,
  } = await getUserStatsData(context.env, context.userId);

  const averageApplicationsPerDay =
    getAverageApplicationsPerDay(allUserApplications);
  const averageResponseRate = getAverageResponseRate(allUserApplications);
  const averageTimeToRejected = getAverageTimeToRejected(allUserApplications);
  const userDailyApplications = getDailyApplicationsMap(allUserApplications);

  return {
    averageApplicationsPerDay: toNumber(averageApplicationsPerDay),
    averageResponseRate: toNumber(averageResponseRate),
    averageTimeToRejected: toNumber(averageTimeToRejected),
    topCompanies,
    totalApplications: totalApplications._count._all,
    totalCompanies: totalCompanies.length,
    userDailyApplications,
  };
};
