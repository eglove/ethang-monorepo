import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";

import { getPrismaClient } from "../prisma-client";

export const getAllTodos = async (environment: Env, userId: string) => {
  const prisma = getPrismaClient(environment);

  const todos = await prisma.todos.findMany({ where: { userId } });

  return createJsonResponse(todos, "OK");
};
