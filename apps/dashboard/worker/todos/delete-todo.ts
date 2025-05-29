import { deleteTodoSchema } from "@ethang/schemas/src/dashboard/todo-schema.ts";

import { getPrismaClient } from "../prisma-client.ts";
import { queryOnBody } from "../utilities/query-on-body.ts";

export const deleteTodo = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      const prisma = getPrismaClient(environment);

      return prisma.todos.delete({
        where: { id: body.id, userId },
      });
    },
    request,
    requestSchema: deleteTodoSchema,
  });
};
