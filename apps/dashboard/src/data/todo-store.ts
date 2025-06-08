import {
  type CreateTodo,
  type Todo,
  todosSchema,
} from "@ethang/schemas/src/dashboard/todo-schema.ts";
import { fetchJson } from "@ethang/toolbelt/fetch/fetch-json";
import { queryOptions } from "@tanstack/react-query";
import { produce } from "immer";
import isEmpty from "lodash/isEmpty.js";
import isError from "lodash/isError";
import isNil from "lodash/isNil";
import { DateTime } from "luxon";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";

import { queryClient } from "../components/providers.tsx";
import { queryKeys } from "./queries/queries.ts";

const defaultState = {
  isCreateModalOpen: false,
  isUpdateModalOpen: false,
  todoToUpdate: null as null | Todo,
};

type Subscriber = (state: TodoState) => void;
type TodoState = typeof defaultState;
const todoPath = "/api/todo";

export class TodoStore {
  public get state() {
    return this._state;
  }

  private _state = defaultState;
  private readonly _subscribers = new Set<Subscriber>();

  public completeTodo(userId = "") {
    return {
      mutationFn: async (todo: null | Todo) => {
        if (isNil(todo)) {
          return;
        }

        let isOk = false;

        if (isNil(todo.recurs)) {
          const response = await globalThis.fetch(todoPath, {
            body: JSON.stringify({
              id: todo.id,
            }),
            method: "DELETE",
          });

          isOk = response.ok;
        } else {
          const nextDue = DateTime.now()
            .plus({ millisecond: todo.recurs })
            .toISO();

          const response = await globalThis.fetch(todoPath, {
            body: JSON.stringify({
              ...todo,
              dueDate: nextDue,
            }),
            method: "PUT",
          });

          isOk = response.ok;
        }

        if (isOk) {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.allUserTodos(userId),
          });
        }
      },
    };
  }

  public createModal(userId = "") {
    return {
      mutationFn: async (data: CreateTodo) => {
        const response = await globalThis.fetch(todoPath, {
          body: JSON.stringify(data),
          method: "POST",
        });

        if (response.ok) {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.allUserTodos(userId),
          });

          this.update((state) => {
            state.isCreateModalOpen = false;
          }, false);
        }
      },
    };
  }

  public deleteTodo(userId = "", onOk?: () => void) {
    return {
      mutationFn: async (todo: Todo) => {
        if (isNil(userId) || isEmpty(userId)) {
          return;
        }

        const response = await globalThis.fetch(todoPath, {
          body: JSON.stringify({ id: todo.id }),
          method: "DELETE",
        });

        if (response.ok) {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.allUserTodos(userId),
          });

          onOk?.();
        }
      },
    };
  }

  public getAll(userId = "") {
    return queryOptions({
      enabled: !isNil(userId) && !isEmpty(userId),
      queryFn: async () => {
        const data = await fetchJson(todoPath, todosSchema);

        if (isError(data)) {
          throw new Error("Failed to fetch todos");
        }

        return data;
      },
      queryKey: queryKeys.todos(userId),
    });
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

  public setTodoToUpdate(todo: null | Todo) {
    this.update((state) => {
      state.todoToUpdate = todo;
    });
  }

  public subscribe(subscriber: Subscriber) {
    this._subscribers.add(subscriber);

    return () => {
      this._subscribers.delete(subscriber);
    };
  }

  public updateTodo(userId = "") {
    return {
      mutationFn: async (todo: null | Todo) => {
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
          await queryClient.invalidateQueries({
            queryKey: queryKeys.allUserTodos(userId),
          });

          this.update((state) => {
            state.isUpdateModalOpen = false;
          }, false);
        }
      },
    };
  }

  private update(updater: Subscriber, shouldNotify = true) {
    this._state = produce(this._state, updater);

    if (shouldNotify) {
      for (const callback of this._subscribers) {
        callback(this._state);
      }
    }
  }
}

export const todoStore = new TodoStore();

export const useTodoStore = <Selection>(
  selector: (snapshot: TodoState) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean,
) => {
  return useSyncExternalStoreWithSelector(
    (listener) => {
      return todoStore.subscribe(listener);
    },
    () => todoStore.state,
    () => todoStore.state,
    selector,
    isEqual,
  );
};
