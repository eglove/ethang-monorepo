import type { GraphQLResolveInfo } from "graphql/type";

import get from "lodash/get.js";
import isObject from "lodash/isObject.js";

import type {
  PathCreateInput,
  PathSelect,
  PathUpdateInput,
} from "../../generated/prisma/models/Path.ts";
import type { ServerContext } from "../index.ts";

import { getPrismaClient, prismaSelect } from "../prisma-client.ts";

export const path = async (
  _parent: unknown,
  _arguments: { id: string },
  context: ServerContext,
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<PathSelect>(info, {
    path: { id: true },
  });

  if (isObject(select.courses)) {
    select.courses.orderBy = { order: "asc" };
  }

  return prisma.path.findUnique({
    select,
    where: { id: get(_arguments, ["id"]) },
  });
};

export const paths = async (
  _parent: unknown,
  _arguments: unknown,
  context: ServerContext,
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<PathSelect>(info, {
    path: { id: true },
  });

  if (isObject(select.courses)) {
    select.courses.orderBy = { order: "asc" };
  }

  return prisma.path.findMany({
    orderBy: {
      order: "asc",
    },
    select,
  });
};

export const createPath = async (
  _parent: unknown,
  _arguments: {
    data: Exclude<PathCreateInput, "courses" | "id">;
  },
  context: ServerContext,
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<PathSelect>(info, {
    path: { id: true },
  });

  const data = get(_arguments, ["data"]);

  return prisma.path.create({
    data,
    select,
  });
};

export const updatePath = async (
  _parent: unknown,
  _arguments: {
    data: Pick<PathUpdateInput, "name" | "order" | "url">;
    id: string;
  },
  context: ServerContext,
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<PathSelect>(info, {
    path: { id: true },
  });

  const id = get(_arguments, ["id"]);
  const data = get(_arguments, ["data"]);

  return prisma.path.update({
    data,
    select,
    where: { id },
  });
};

export const deletePath = async (
  _parent: unknown,
  _arguments: { id: string },
  context: ServerContext,
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<PathSelect>(info, {
    path: { id: true },
  });

  const id = get(_arguments, ["id"]);

  return prisma.path.delete({
    select,
    where: { id },
  });
};
