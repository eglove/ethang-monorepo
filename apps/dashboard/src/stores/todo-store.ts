import type { CreateTodo } from "@ethang/schemas/dashboard/todo-schema.ts";

import { BaseStore } from "@ethang/store";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil";
import { DateTime } from "luxon";

import type { FetchedTodo } from "../graphql/queries/get-all-todos.ts";

const defaultState = {
  isCreateModalOpen: false,
  isUpdateModalOpen: false,
  todoToUpdate: null as FetchedTodo | null,
};

type TodoState = typeof defaultState;
const todoPath = "/api/todo";

export class TodoStore extends BaseStore<TodoState> {
  public constructor() {
    super(defaultState);
  }

  public completeTodo() {
    return {
      mutationFn: async (todo: FetchedTodo | null) => {
        if (isNil(todo)) {
          return;
        }

        if (isNil(todo.recurs)) {
          await globalThis.fetch(todoPath, {
            body: JSON.stringify({
              id: todo.id,
            }),
            method: "DELETE",
          });
        } else {
          const nextDue = DateTime.now()
            .plus({ millisecond: todo.recurs })
            .toISO();

          await globalThis.fetch(todoPath, {
            body: JSON.stringify({
              ...todo,
              dueDate: nextDue,
            }),
            method: "PUT",
          });
        }
      },
    };
  }

  public createModal() {
    return {
      mutationFn: async (data: CreateTodo) => {
        const response = await globalThis.fetch(todoPath, {
          body: JSON.stringify(data),
          method: "POST",
        });

        if (response.ok) {
          this.update((state) => {
            state.isCreateModalOpen = false;
          }, false);
        }
      },
    };
  }

  public deleteTodo(userId = "", onOk?: () => void) {
    return {
      mutationFn: async (todo: FetchedTodo) => {
        if (isNil(userId) || isEmpty(userId)) {
          return;
        }

        const response = await globalThis.fetch(todoPath, {
          body: JSON.stringify({ id: todo.id }),
          method: "DELETE",
        });

        if (response.ok) {
          onOk?.();
        }
      },
    };
  }

  public setIsCreateModalOpen(isOpen: boolean) {
    this.update((state) => {
      state.isCreateModalOpen = isOpen;
    });
  }

  public setIsUpdateModalOpen(isOpen: boolean) {
    this.update((state) => {
      state.isUpdateModalOpen = isOpen;
    });
  }

  public setTodoToUpdate(todo: FetchedTodo | null) {
    this.update((state) => {
      state.todoToUpdate = todo;
    });
  }

  public updateTodo(userId = "") {
    return {
      mutationFn: async (todo: FetchedTodo | null) => {
        if (isNil(todo)) {
          return;
        }

        const response = await fetch(todoPath, {
          body: JSON.stringify({
            ...todo,
            userId,
          }),
          method: "PUT",
        });

        if (response.ok) {
          this.update((state) => {
            state.isUpdateModalOpen = false;
          }, false);
        }
      },
    };
  }
}

export const todoStore = new TodoStore();
