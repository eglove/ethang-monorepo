import { todoSchema } from "@ethang/schemas/dashboard/todo-schema.ts";

import { getPrismaClient } from "../prisma-client.ts";
import { queryOnBody } from "../utilities/query-on-body.ts";

export const updateTodo = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      const prisma = getPrismaClient(environment);

      return prisma.todos.update({
        data: {
          description: body.description,
          dueDate: body.dueDate,
          recurs: body.recurs,
          title: body.title,
        },
        where: { id: body.id, userId },
      });
    },
    request,
    requestSchema: todoSchema,
  });
};
