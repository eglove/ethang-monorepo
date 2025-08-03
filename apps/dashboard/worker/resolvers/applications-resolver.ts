import type { GraphQLResolveInfo } from "graphql/type";

import isNil from "lodash/isNil.js";
import toNumber from "lodash/toNumber";

import type {
  applicationsCreateInput,
  applicationsModel,
  applicationsUpdateInput,
} from "../../generated/prisma/models/applications.ts";
import type { Context } from "../types.ts";

import { getAverageApplicationsPerDay } from "../stats/get-average-applications-per-day.ts";
import { getAverageResponseRate } from "../stats/get-average-response-rate.ts";
import { getAverageTimeToRejected } from "../stats/get-average-time-to-rejected.ts";
import { getDailyApplicationsMap } from "../stats/get-daily-applications-map.ts";
import { getUserStatsData } from "../stats/get-user-stats-data.ts";
import {
  prismaSelect,
  prismaSelectWithPagination,
} from "../utilities/prisma-select.ts";

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
    orderBy: { applied: "desc" },
    select: prismaSelectWithPagination(info, "applications"),
    skip: (_arguments.page - 1) * _arguments.limit,
    take: _arguments.limit,
    where,
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

export const createApplicationResolver = async (
  _: never,
  _arguments: { input: applicationsCreateInput },
  context: Context,
  info: GraphQLResolveInfo,
) => {
  return context.prisma.applications.create({
    data: {
      ..._arguments.input,
      dmSent: _arguments.input.dmSent ?? null,
      dmUrl: _arguments.input.dmUrl ?? null,
      jobBoardUrl: _arguments.input.jobBoardUrl ?? null,
      rejected: _arguments.input.rejected ?? null,
      userId: context.userId,
    },
    select: prismaSelect(info),
  });
};

export const deleteApplicationResolver = async (
  _: never,
  _arguments: { input: Pick<applicationsModel, "id"> },
  context: Context,
  info: GraphQLResolveInfo,
) => {
  return context.prisma.applications.delete({
    select: prismaSelect(info),
    where: {
      id: _arguments.input.id,
    },
  });
};

export const updateApplicationResolver = async (
  _: never,
  _arguments: { input: { id: string } & applicationsUpdateInput },
  context: Context,
  info: GraphQLResolveInfo,
) => {
  return context.prisma.applications.update({
    data: {
      ..._arguments.input,
      dmSent: _arguments.input.dmSent ?? null,
      dmUrl: _arguments.input.dmUrl ?? null,
      jobBoardUrl: _arguments.input.jobBoardUrl ?? null,
      rejected: _arguments.input.rejected ?? null,
      userId: context.userId,
    },
    select: prismaSelect(info),
    where: {
      id: _arguments.input.id,
    },
  });
};
