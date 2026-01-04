import { useStore } from "@ethang/store/use-store";

import { todoStore } from "../../stores/todo-store.ts";
import { AddTodoForm } from "./add-todo-form.tsx";
import { TodoList } from "./todo-list.tsx";
import { TodoTemplate } from "./todo-template.tsx";

export const TodoPage = () => {
  const todos = useStore(todoStore, (state) => {
    return state.todos;
  });

  return (
    <TodoTemplate
      addTodoForm={<AddTodoForm />}
      todoList={<TodoList todos={todos} />}
    />
  );
};
