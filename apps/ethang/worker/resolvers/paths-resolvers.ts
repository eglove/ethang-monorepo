import type { GraphQLResolveInfo } from "graphql/type";

import get from "lodash/get.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

import type { PathSelect } from "../../generated/prisma/models/Path.ts";

import { getPrismaClient, prismaSelect } from "../prisma-client.ts";

export const path = async (
  _parent: unknown,
  _arguments: { id: string },
  context: { env: Env },
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<PathSelect>(info, {
    Course: ["id", "__typename"],
  });

  const data = await prisma.path.findUnique({
    select,
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

export const paths = async (
  _parent: unknown,
  _arguments: unknown,
  context: { env: Env },
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<PathSelect>(info, {
    Course: ["id", "__typename"],
  });

  const data = await prisma.path.findMany({
    orderBy: {
      order: "asc",
    },
    select,
  });

  return map(data, (item) => {
    return {
      ...item,
      courseCount: get(item, ["_count", "courses"]),
    };
  });
};
