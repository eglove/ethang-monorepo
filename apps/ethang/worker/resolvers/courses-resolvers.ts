import type { GraphQLResolveInfo } from "graphql/type";

import get from "lodash/get.js";

import type {
  CourseSelect,
  CourseUncheckedCreateInput,
  CourseUncheckedUpdateInput,
} from "../../generated/prisma/models/Course.ts";
import type { ServerContext } from "../index.ts";

import { getPrismaClient, prismaSelect } from "../prisma-client.ts";

export const course = async (
  _parent: unknown,
  _arguments: { id: string },
  context: ServerContext,
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<CourseSelect>(info, {
    course: { id: true },
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
  context: ServerContext,
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<CourseSelect>(info, {
    course: { id: true },
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

export const createCourse = async (
  _parent: unknown,
  _arguments: {
    data: Exclude<CourseUncheckedCreateInput, "id" | "knowledgeAreas">;
  },
  context: ServerContext,
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<CourseSelect>(info, {
    course: { id: true },
  });

  const data = get(_arguments, ["data"]);

  return prisma.course.create({
    data,
    select,
  });
};

export const updateCourse = async (
  _parent: unknown,
  _arguments: {
    data: Pick<
      CourseUncheckedUpdateInput,
      "author" | "name" | "order" | "pathId" | "url"
    >;
    id: string;
  },
  context: ServerContext,
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<CourseSelect>(info, {
    course: { id: true },
  });

  const id = get(_arguments, ["id"]);
  const data = get(_arguments, ["data"]);

  return prisma.course.update({
    data,
    select,
    where: { id },
  });
};

export const deleteCourse = async (
  _parent: unknown,
  _arguments: { id: string },
  context: ServerContext,
  info: GraphQLResolveInfo,
) => {
  const prisma = getPrismaClient(get(context, ["env"]));
  const select = prismaSelect<CourseSelect>(info, {
    course: { id: true },
  });

  const id = get(_arguments, ["id"]);

  return prisma.course.delete({
    select,
    where: { id },
  });
};
