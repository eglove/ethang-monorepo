import { z } from "zod";

export const todoSchema = z.object({
  description: z.string().nullable(),
  dueDate: z.string(),
  id: z.string(),
  recurs: z.number().int().nullable(),
  title: z.string(),
  userId: z.string(),
});

export const createTodoSchema = todoSchema.omit({
  id: true,
  userId: true,
});

export const deleteTodoSchema = z.object({
  id: z.string(),
});

export const completeTodoSchema = z.object({
  dueDate: z.string().datetime().nullable(),
  id: z.string(),
});

export const todosSchema = z.array(todoSchema);

export type CompleteTodo = z.infer<typeof completeTodoSchema>;
export type CreateTodo = z.infer<typeof createTodoSchema>;
export type DeleteTodo = z.infer<typeof deleteTodoSchema>;
export type Todo = z.infer<typeof todoSchema>;
