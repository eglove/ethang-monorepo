import get from "lodash/get.js";

import { getPrismaClient } from "../prisma-client.ts";

export const course = async (
  _parent: unknown,
  _arguments: { id: string },
  context: { env: Env },
) => {
  const prisma = getPrismaClient(get(context, ["env"]));

  return prisma.course.findUnique({
    include: {
      knowledgeAreas: true,
      path: true,
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
) => {
  const prisma = getPrismaClient(get(context, ["env"]));

  const where = get(_arguments, ["where"]);

  return prisma.course.findMany({
    include: {
      knowledgeAreas: true,
      path: true,
    },
    orderBy: {
      order: "asc",
    },
    where: where ?? {},
  });
};
