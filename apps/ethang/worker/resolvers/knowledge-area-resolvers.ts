import type { GraphQLResolveInfo } from "graphql/type";

import get from "lodash/get.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

import type { KnowledgeAreaSelect } from "../../generated/prisma/models/KnowledgeArea.ts";

import { getPrismaClient, prismaSelect } from "../prisma-client.ts";

export const knowledgeArea = async (
  _parent: unknown,
  _arguments: { id: string },
  context: { env: Env },
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<KnowledgeAreaSelect>(info, {
    knowledgeArea: { id: true },
  });

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
  context: { env: Env },
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<KnowledgeAreaSelect>(info, {
    KnowledgeArea: { id: true },
  });

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
