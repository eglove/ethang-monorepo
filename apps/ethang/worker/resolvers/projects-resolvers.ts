import get from "lodash/get.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";
import toInteger from "lodash/toInteger.js";

import { getPrismaClient } from "../prisma-client";

export const projects = async (
  _parent: unknown,
  _arguments: { after?: string; first?: number },
  context: { env: Env },
) => {
  const prisma = getPrismaClient(get(context, ["env"]));

  const first = toInteger(get(_arguments, ["first"], 10));
  const after = get(_arguments, ["after"]);

  const totalCount = await prisma.project.count();

  const fetchedProjects = await prisma.project.findMany({
    ...(isString(after) ? { cursor: { id: after } } : {}),
    include: { techs: true },
    orderBy: { id: "asc" },
    skip: isString(after) ? 1 : 0,
    take: first + 1,
  });

  const hasNextPage = fetchedProjects.length > first;
  const nodes = hasNextPage ? fetchedProjects.slice(0, -1) : fetchedProjects;

  const edges = map(nodes, (project) => {
    return {
      cursor: get(project, ["id"]),
      node: project,
    };
  });

  const endCursor = get(edges.at(-1), ["cursor"]);
  const startCursor = get(edges.at(0), ["cursor"]);

  return {
    edges,
    pageInfo: {
      endCursor,
      hasNextPage,
      hasPreviousPage: isString(after),
      startCursor,
    },
    totalCount,
  };
};
