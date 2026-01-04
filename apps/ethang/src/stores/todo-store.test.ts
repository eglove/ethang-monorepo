import { describe, expect, it } from "vitest";

import { TodoStore } from "./todo-store";

describe("TodoStore", () => {
  const idUndefined = "id is undefined";

  it("should add a todo", () => {
    const store = new TodoStore();
    store.addTodo("Test Todo");
    expect(store.state.todos).toHaveLength(1);
    expect(store.state.todos[0]?.title).toBe("Test Todo");
    expect(store.state.todos[0]?.completed).toBe(false);
  });

  it("should toggle a todo", () => {
    const store = new TodoStore();
    store.addTodo("Test Todo");
    const id = store.state.todos[0]?.id;

    if (id === undefined) {
      throw new Error(idUndefined);
    }

    store.toggleTodo(id);
    expect(store.state.todos[0]?.completed).toBe(true);
    store.toggleTodo(id);
    expect(store.state.todos[0]?.completed).toBe(false);
  });

  it("should update a todo title", () => {
    const store = new TodoStore();
    store.addTodo("Test Todo");
    const id = store.state.todos[0]?.id;

    if (id === undefined) {
      throw new Error(idUndefined);
    }

    store.updateTodo(id, "Updated Todo");
    expect(store.state.todos[0]?.title).toBe("Updated Todo");
  });

  it("should delete a todo", () => {
    const store = new TodoStore();
    store.addTodo("Test Todo");
    const id = store.state.todos[0]?.id;

    if (id === undefined) {
      throw new Error(idUndefined);
    }

    store.deleteTodo(id);
    expect(store.state.todos).toHaveLength(0);
  });
});
