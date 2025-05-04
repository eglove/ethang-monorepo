import { Button, Input, Link } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import map from "lodash/map.js";
import { Trash2Icon } from "lucide-react";
import { DateTime } from "luxon";
import { type FormEvent, useState } from "react";

import { createTodo } from "../data/mutations/add-todo.ts";
import { deleteTodo } from "../data/mutations/delete-todo.ts";
import { getTodos } from "../data/queries/get-todos.ts";

const Index = () => {
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  const todosQuery = useQuery(getTodos());

  const { mutate: createTodoMutate } = useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      setName("");
      queryClient.invalidateQueries(getTodos()).catch(globalThis.console.error);
    },
  });

  const { mutate: deleteTodoMutation } = useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => {
      queryClient.invalidateQueries(getTodos()).catch(globalThis.console.error);
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    createTodoMutate({ due: DateTime.now().toISO(), name });
  };

  return (
    <div className="p-2">
      <Link href="/about">About</Link>
      <div className="underline">Todos</div>
      <ul className="list-disc list-inside grid gap-4">
        {map(todosQuery.data, (todo) => {
          return (
            <li className="flex items-center gap-2" key={todo.id}>
              {todo.name}{" "}
              <Button
                isIconOnly
                onPress={() => {
                  deleteTodoMutation({ id: todo.id });
                }}
                color="danger"
                size="sm"
              >
                <Trash2Icon />
              </Button>
            </li>
          );
        })}
      </ul>
      <form className="my-4 max-w-sm grid gap-4" onSubmit={handleSubmit}>
        <Input label="Add Todo" onValueChange={setName} value={name} />
        <Button className="max-w-max" color="primary" type="submit">
          Submit
        </Button>
      </form>
    </div>
  );
};

export const Route = createFileRoute("/")({
  component: Index,
});
