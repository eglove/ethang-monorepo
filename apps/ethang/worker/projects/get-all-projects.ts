import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import toInteger from "lodash/toInteger.js";

import { getPrismaClient } from "../prisma-client";

export const getAllProjects = async (request: Request, environment: Env) => {
  const prisma = getPrismaClient(environment);
  const url = new URL(request.url);

  const page = toInteger(url.searchParams.get("page") ?? "1");
  const limit = toInteger(url.searchParams.get("limit") ?? "10");
  const skip = (page - 1) * limit;

  const total = await prisma.project.count();

  const projects = await prisma.project.findMany({
    include: { techs: true },
    orderBy: { title: "asc" },
    skip,
    take: limit,
  });

  return createJsonResponse(
    {
      pagination: { limit, page, total, totalPages: Math.ceil(total / limit) },
      projects,
    },
    "OK",
  );
};
