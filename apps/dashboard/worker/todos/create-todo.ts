import { createTodoSchema } from "@ethang/schemas/src/dashboard/todo-schema.ts";

import { getPrismaClient } from "../prisma-client.ts";
import { queryOnBody } from "../utilities/query-on-body.ts";

export const createTodo = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      const prisma = await getPrismaClient(environment);

      return prisma.todos.create({
        data: {
          description: body.description,
          dueDate: body.dueDate,
          recurs: body.recurs,
          title: body.title,
          userId,
        },
      });
    },
    request,
    requestSchema: createTodoSchema,
  });
};
