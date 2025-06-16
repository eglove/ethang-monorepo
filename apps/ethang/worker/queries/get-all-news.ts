import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import toInteger from "lodash/toInteger";

import { getPrismaClient } from "../prisma-client.ts";

export const getAllNews = async (request: Request, environment: Env) => {
  const prisma = getPrismaClient(environment);
  const url = new URL(request.url);

  const page = toInteger(url.searchParams.get("page") ?? "1");
  const limit = toInteger(url.searchParams.get("limit") ?? "10");
  const offset = (page - 1) * limit;

  const total = await prisma.news.count();

  const prismaData = await prisma.news.findMany({
    orderBy: { published: "desc" },
    skip: offset,
    take: limit,
  });

  return createJsonResponse(
    {
      news: prismaData,
      pagination: { limit, page, total, totalPages: Math.ceil(total / limit) },
    },
    "OK",
  );
};
