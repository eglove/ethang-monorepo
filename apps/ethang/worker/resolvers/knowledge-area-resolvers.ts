import get from "lodash/get.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

import { getPrismaClient } from "../prisma-client.ts";

export const knowledgeArea = async (
  _parent: unknown,
  _arguments: { id: string },
  context: { env: Env },
) => {
  const prisma = getPrismaClient(get(context, ["env"]));

  const data = await prisma.knowledgeArea.findUnique({
    include: {
      _count: {
        select: { courses: true },
      },
    },
    where: { id: get(_arguments, ["id"]) },
  });

  if (isNil(data)) {
    return null;
  }

  return {
    ...data,
    courseCount: get(data, ["_count", "courses"]),
  };
};

export const knowledgeAreas = async (
  _parent: unknown,
  _arguments: unknown,
  context: { env: Env },
) => {
  const prisma = getPrismaClient(get(context, ["env"]));

  const data = await prisma.knowledgeArea.findMany({
    include: {
      _count: {
        select: { courses: true },
      },
    },
    orderBy: {
      order: "asc",
    },
  });

  return map(data, (item) => {
    return {
      ...item,
      courseCount: get(item, ["_count", "courses"]),
    };
  });
};
