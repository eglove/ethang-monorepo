import map from "lodash/map.js";

import { TodoItem } from "./todo-item.tsx";

type Todo = {
  id: string;
};

type TodoListProperties = {
  readonly todos: Todo[];
};

export const TodoList = ({ todos }: TodoListProperties) => {
  return (
    <div className="flex flex-col gap-2">
      {map(todos, (todo) => {
        return <TodoItem id={todo.id} key={todo.id} />;
      })}
    </div>
  );
};
