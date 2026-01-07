import type { GraphQLResolveInfo } from "graphql/type";

import get from "lodash/get.js";

import type { CourseSelect } from "../../generated/prisma/models/Course.ts";

import { getPrismaClient, prismaSelect } from "../prisma-client.ts";

export const course = async (
  _parent: unknown,
  _arguments: { id: string },
  context: { env: Env },
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<CourseSelect>(info, {
    Course: ["id", "__typename"],
  });

  return prisma.course.findUnique({
    select: {
      ...select,
    },
    where: { id: get(_arguments, ["id"]) },
  });
};

export const courses = async (
  _parent: unknown,
  _arguments: {
    where?: {
      knowledgeAreas?: { some?: { id?: { in?: string[] } } };
    };
  },
  context: { env: Env },
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<CourseSelect>(info, {
    Course: ["id", "__typename"],
  });

  const where = get(_arguments, ["where"]);

  return prisma.course.findMany({
    orderBy: {
      order: "asc",
    },
    select,
    where: where ?? {},
  });
};
