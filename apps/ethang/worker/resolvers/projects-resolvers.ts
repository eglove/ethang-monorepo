import get from "lodash/get.js";
import isNil from "lodash/isNil.js";

import { getPrismaClient } from "../prisma-client";

export const project = async (
  _parent: object,
  _arguments: { id: string },
  context: { env: Env },
) => {
  const prisma = getPrismaClient(get(context, ["env"]));

  return prisma.project.findUnique({
    include: { techs: true },
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
) => {
  const prisma = getPrismaClient(get(context, ["env"]));

  const skip = get(_arguments, ["skip"]);
  const take = get(_arguments, ["take"]);
  const where = get(_arguments, ["where"]);
  const orderBy = get(_arguments, ["orderBy"]);

  const total = await prisma.project.count({
    where: where ?? {},
  });

  const fetchedProjects = await prisma.project.findMany({
    include: { techs: true },
    orderBy: orderBy ?? { title: "asc" },
    ...(!isNil(skip) && { skip }),
    ...(!isNil(take) && { take }),
    where: where ?? {},
  });

  return {
    projects: fetchedProjects,
    total,
  };
};
