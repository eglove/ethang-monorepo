import type { GraphQLResolveInfo } from "graphql/type";

import get from "lodash/get.js";
import isNil from "lodash/isNil.js";

import type { ProjectSelect } from "../../generated/prisma/models/Project.ts";

import { getPrismaClient, prismaSelect } from "../prisma-client";

export const project = async (
  _parent: object,
  _arguments: { id: string },
  context: { env: Env },
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<ProjectSelect>(info, {
    Project: ["id", "__typename"],
  });

  return prisma.project.findUnique({
    select,
    where: { id: get(_arguments, ["id"]) },
  });
};

export const projects = async (
  _parent: unknown,
  _arguments: {
    orderBy?: Record<string, "asc" | "desc">;
    skip?: number;
    take?: number;
    where?: { title?: { in?: string[] } };
  },
  context: { env: Env },
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<ProjectSelect>(info, {
    Project: ["id", "__typename"],
  });

  const skip = get(_arguments, ["skip"]);
  const take = get(_arguments, ["take"]);
  const where = get(_arguments, ["where"]);
  const orderBy = get(_arguments, ["orderBy"]);

  return prisma.project.findMany({
    orderBy: orderBy ?? { title: "asc" },
    select,
    ...(!isNil(skip) && { skip }),
    ...(!isNil(take) && { take }),
    where: where ?? {},
  });
};
