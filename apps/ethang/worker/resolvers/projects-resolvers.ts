import type { GraphQLResolveInfo } from "graphql/type";

import get from "lodash/get.js";
import isNil from "lodash/isNil.js";

import type {
  ProjectCreateInput,
  ProjectSelect,
  ProjectUpdateInput,
} from "../../generated/prisma/models/Project.ts";

import { getPrismaClient, prismaSelect } from "../prisma-client";

export const project = async (
  _parent: object,
  _arguments: { id: string },
  context: { env: Env },
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<ProjectSelect>(info, {
    project: { id: true },
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
    project: { id: true },
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

export const createProject = async (
  _parent: object,
  _arguments: {
    data: Exclude<ProjectCreateInput, "id" | "techs">;
  },
  context: { env: Env },
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<ProjectSelect>(info, {
    project: { id: true },
  });

  const data = get(_arguments, ["data"]);

  return prisma.project.create({
    data,
    select,
  });
};

export const updateProject = async (
  _parent: object,
  _arguments: {
    data: Pick<
      ProjectUpdateInput,
      "code" | "description" | "publicUrl" | "title"
    >;
    id: string;
  },
  context: { env: Env },
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<ProjectSelect>(info, {
    project: { id: true },
  });

  const id = get(_arguments, ["id"]);
  const data = get(_arguments, ["data"]);

  return prisma.project.update({
    data,
    select,
    where: { id },
  });
};

export const deleteProject = async (
  _parent: object,
  _arguments: { id: string },
  context: { env: Env },
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<ProjectSelect>(info, {
    project: { id: true },
  });

  const id = get(_arguments, ["id"]);

  return prisma.project.delete({
    select,
    where: { id },
  });
};
