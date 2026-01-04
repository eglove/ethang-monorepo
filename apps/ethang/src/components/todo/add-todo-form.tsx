import { Button, Input } from "@heroui/react";
import isError from "lodash/isError.js";
import trim from "lodash/trim.js";
import { type FormEvent, useState } from "react";

import { todoStore } from "../../stores/todo-store.ts";

export const AddTodoForm = () => {
  const [newTodo, setNewTodo] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedTodo = trim(newTodo);

    if ("" !== trimmedTodo) {
      try {
        todoStore.addTodo(trimmedTodo);
        setNewTodo("");
      } catch (error) {
        if (isError(error)) {
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      }
    }
  };

  return (
    <form className="flex gap-2" onSubmit={handleSubmit}>
      <Input
        value={newTodo}
        onValueChange={setNewTodo}
        aria-label="New todo title"
        placeholder="Add a new todo"
      />
      <Button type="submit" color="primary">
        Add
      </Button>
    </form>
  );
};
