import type { z } from "zod";

import type { deleteTodoSchema } from "../../../worker/create-todo-schema.ts";

export const deleteTodo = async (todo: z.infer<typeof deleteTodoSchema>) => {
  const response = await globalThis.fetch("/api/todos", {
    body: JSON.stringify(todo),
    method: "DELETE",
  });

  return response.json();
};
