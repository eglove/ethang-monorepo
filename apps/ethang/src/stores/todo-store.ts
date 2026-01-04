import { BaseStore } from "@ethang/store";
import filter from "lodash/filter.js";
import find from "lodash/find.js";
import { v4 } from "uuid";
import { z } from "zod";

const todoSchema = z.object({
  completed: z.boolean(),
  id: z.uuid(),
  title: z.string().min(1),
});

type Todo = z.infer<typeof todoSchema>;

type TodoState = {
  todos: Todo[];
};

const initialState: TodoState = {
  todos: [],
};

export class TodoStore extends BaseStore<TodoState> {
  public constructor() {
    super(initialState);
  }

  public addTodo(title: string) {
    const result = todoSchema.safeParse({
      completed: false,
      id: v4(),
      title,
    });

    if (!result.success) {
      throw new Error("Invalid todo data");
    }

    this.update((draft) => {
      draft.todos.push(result.data);
    });
  }

  public deleteTodo(id: string) {
    this.update((draft) => {
      draft.todos = filter(draft.todos, (t) => {
        return t.id !== id;
      });
    });
  }

  public toggleTodo(id: string) {
    this.update((draft) => {
      const todo = find(draft.todos, (t) => {
        return t.id === id;
      });

      if (todo) {
        todo.completed = !todo.completed;
      }
    });
  }

  public updateTodo(id: string, title: string) {
    const todoToUpdate = find(this.state.todos, { id });

    if (!todoToUpdate) {
      return;
    }

    const result = todoSchema.safeParse({
      ...todoToUpdate,
      title,
    });

    if (!result.success) {
      throw new Error("Invalid todo title");
    }

    this.update((draft) => {
      const todo = find(draft.todos, (t) => {
        return t.id === id;
      });

      if (todo) {
        todo.title = result.data.title;
      }
    });
  }
}

export const todoStore = new TodoStore();
