import { gql } from "@apollo/client";

import type { todosModel } from "../../generated/prisma/models/todos.ts";

export type FetchedTodo = Pick<
  todosModel,
  "description" | "dueDate" | "id" | "recurs" | "title" | "userId"
>;

export type GetAllTodos = {
  todos: FetchedTodo[];
};

export const getAllTodos = gql`
  query GetAllTodos {
    todos {
      description
      dueDate
      id
      recurs
      title
      userId
    }
  }
`;
