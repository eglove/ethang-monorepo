import type { Generated, Insertable, Selectable, Updateable } from "kysely";

export type Database = {
  todo: TodoTable;
};

export type NewTodo = Insertable<TodoTable>;
export type Todo = Selectable<TodoTable>;
export type TodoUpdate = Updateable<TodoTable>;

type TodoTable = {
  due: string;
  id: Generated<number>;
  name: string;
};
