import type { CreateTodo } from "@ethang/schemas/dashboard/todo-schema.ts";

import { BaseStore } from "@ethang/store";

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
}

export const todoStore = new TodoStore();
