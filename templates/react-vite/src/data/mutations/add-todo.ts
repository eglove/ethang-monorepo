import type { z } from "zod";

import type { createTodoSchema } from "../../../worker/create-todo-schema.ts";

export const createTodo = async (todo: z.infer<typeof createTodoSchema>) => {
  const response = await globalThis.fetch("/api/todos", {
    body: JSON.stringify(todo),
    method: "POST",
  });

  return response.json();
};
