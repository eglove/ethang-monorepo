import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import toInteger from "lodash/toInteger";

import { getPrismaClient } from "../prisma-client.ts";

export const getAllApplications = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  const prisma = getPrismaClient(environment);
  const url = new URL(request.url);

  const page = toInteger(url.searchParams.get("page") ?? "1");
  const limit = toInteger(url.searchParams.get("limit") ?? "10");
  const skip = (page - 1) * limit;

  const search = url.searchParams.get("search") ?? "";

  const where: {
    OR?: Record<string, { contains: string }>[];
    userId: string;
  } = { userId };

  if (search) {
    where.OR = [
      { company: { contains: search } },
      { title: { contains: search } },
    ];
  }

  const total = await prisma.applications.count({ where });

  const applications = await prisma.applications.findMany({
    include: { interviewRounds: true },
    orderBy: {
      applied: "desc",
    },
    skip,
    take: limit,
    where,
  });

  return createJsonResponse(
    {
      data: applications,
      pagination: {
        limit,
        page,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    "OK",
  );
};
