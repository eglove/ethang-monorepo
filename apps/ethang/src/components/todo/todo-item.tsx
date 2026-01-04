import { useStore } from "@ethang/store/use-store";
import { Button, Card, CardBody, Checkbox, Input } from "@heroui/react";
import find from "lodash/find.js";
import isError from "lodash/isError.js";

import { todoStore } from "../../stores/todo-store.ts";

type TodoItemProperties = {
  readonly id: string;
};

export const TodoItem = ({ id }: TodoItemProperties) => {
  const todo = useStore(todoStore, (state) => {
    return find(state.todos, { id });
  });

  if (!todo) {
    return null;
  }

  return (
    <Card>
      <CardBody className="flex flex-row items-center justify-between">
        <div className="flex grow items-center gap-2">
          <Checkbox
            aria-label="Toggle todo"
            isSelected={todo.completed}
            onValueChange={() => {
              todoStore.toggleTodo(id);
            }}
          />
          <Input
            value={todo.title}
            variant="underlined"
            aria-label="Todo title"
            className={todo.completed ? "line-through" : ""}
            onValueChange={(value) => {
              try {
                todoStore.updateTodo(id, value);
              } catch (error) {
                if (isError(error)) {
                  // eslint-disable-next-line no-console
                  console.error(error.message);
                }
              }
            }}
          />
        </div>
        <Button
          isIconOnly
          color="danger"
          variant="light"
          aria-label="Delete todo"
          onPress={() => {
            todoStore.deleteTodo(id);
          }}
        >
          ✕
        </Button>
      </CardBody>
    </Card>
  );
};
