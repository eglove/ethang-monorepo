import type { GraphQLResolveInfo } from "graphql/type";

import get from "lodash/get.js";
import isNil from "lodash/isNil.js";
import isObject from "lodash/isObject.js";
import map from "lodash/map.js";

import type {
  KnowledgeAreaCreateInput,
  KnowledgeAreaSelect,
  KnowledgeAreaUpdateInput,
} from "../../generated/prisma/models/KnowledgeArea.ts";
import type { ServerContext } from "../index.ts";

import { getPrismaClient, prismaSelect } from "../prisma-client.ts";

export const knowledgeArea = async (
  _parent: unknown,
  _arguments: { id: string },
  context: ServerContext,
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<KnowledgeAreaSelect>(info, {
    knowledgeArea: { id: true },
  });

  if (isObject(select.courses)) {
    select.courses.orderBy = { order: "asc" };
  }

  const data = await prisma.knowledgeArea.findUnique({
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

export const knowledgeAreas = async (
  _parent: unknown,
  _arguments: unknown,
  context: ServerContext,
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<KnowledgeAreaSelect>(info, {
    KnowledgeArea: { id: true },
  });

  if (isObject(select.courses)) {
    select.courses.orderBy = { order: "asc" };
  }

  const data = await prisma.knowledgeArea.findMany({
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

export const createKnowledgeArea = async (
  _parent: unknown,
  _arguments: {
    data: Exclude<KnowledgeAreaCreateInput, "courses" | "id">;
  },
  context: ServerContext,
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<KnowledgeAreaSelect>(info, {
    knowledgeArea: { id: true },
  });

  const data = get(_arguments, ["data"]);

  return prisma.knowledgeArea.create({
    data,
    select,
  });
};

export const updateKnowledgeArea = async (
  _parent: unknown,
  _arguments: {
    data: Pick<KnowledgeAreaUpdateInput, "name" | "order">;
    id: string;
  },
  context: ServerContext,
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<KnowledgeAreaSelect>(info, {
    knowledgeArea: { id: true },
  });

  const id = get(_arguments, ["id"]);
  const data = get(_arguments, ["data"]);

  return prisma.knowledgeArea.update({
    data,
    select,
    where: { id },
  });
};

export const deleteKnowledgeArea = async (
  _parent: unknown,
  _arguments: { id: string },
  context: ServerContext,
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<KnowledgeAreaSelect>(info, {
    knowledgeArea: { id: true },
  });

  const id = get(_arguments, ["id"]);

  return prisma.knowledgeArea.delete({
    select,
    where: { id },
  });
};
