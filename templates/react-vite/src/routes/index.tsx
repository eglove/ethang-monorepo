import { Button, Link } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import map from "lodash/map.js";
import { Trash2Icon } from "lucide-react";

import { CreateTodoForm } from "../components/todos/create-todo-form.tsx";
import { deleteTodo } from "../data/mutations/delete-todo.ts";
import { getTodos } from "../data/queries/get-todos.ts";

const Index = () => {
  const queryClient = useQueryClient();

  const todosQuery = useQuery(getTodos());

  const { mutate: deleteTodoMutation } = useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => {
      // eslint-disable-next-line no-console
      queryClient.invalidateQueries(getTodos()).catch(console.error);
    },
  });

  return (
    <div className="p-2">
      <Link href="/about">About</Link>
      <div className="underline">Todos</div>
      <ul className="list-disc list-inside grid gap-4 my-4">
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
      <CreateTodoForm />
    </div>
  );
};

export const Route = createFileRoute("/")({
  component: Index,
});
