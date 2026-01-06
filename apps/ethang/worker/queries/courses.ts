import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import isNil from "lodash/isNil.js";

import type { KnowledgeAreaSelect } from "../../generated/prisma/models/KnowledgeArea.ts";

import { getPrismaClient } from "../prisma-client.ts";

export const getAllCourses = async (environment: Env) => {
  const prisma = getPrismaClient(environment);

  return prisma.course.findMany();
};

export const getKnowledgeAreas = async (
  environment: Env,
  select?: KnowledgeAreaSelect,
) => {
  const prisma = getPrismaClient(environment);

  if (!isNil(select)) {
    const data = await prisma.knowledgeArea.findMany({ select });
    return createJsonResponse(data, "OK");
  }

  const data = await prisma.knowledgeArea.findMany();

  return createJsonResponse(data, "OK");
};

export const getKnowledgeArea = async (environment: Env, id: string) => {
  const prisma = getPrismaClient(environment);

  const data = await prisma.knowledgeArea.findUnique({ where: { id } });

  return createJsonResponse(data, "OK");
};
