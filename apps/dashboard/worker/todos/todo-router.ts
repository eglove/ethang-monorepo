import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";

import { createTodo } from "./create-todo.ts";
import { deleteTodo } from "./delete-todo.ts";
import { getAllTodos } from "./get-all-todos.ts";
import { updateTodo } from "./update-todo.ts";

export const todoRouter = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  switch (request.method) {
    case "DELETE": {
      return deleteTodo(request, environment, userId);
    }

    case "GET": {
      return getAllTodos(environment, userId);
    }

    case "POST": {
      return createTodo(request, environment, userId);
    }

    case "PUT": {
      return updateTodo(request, environment, userId);
    }

    default: {
      return createJsonResponse(
        { error: "Method not allowed" },
        "METHOD_NOT_ALLOWED",
      );
    }
  }
};
