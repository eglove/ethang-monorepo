import { addToast, Button, Form, Input } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { type FormEvent, useState } from "react";

import { createTodoSchema } from "../../../worker/create-todo-schema.ts";
import { createTodo } from "../../data/mutations/add-todo.ts";
import { getTodos } from "../../data/queries/get-todos.ts";

export const CreateTodoForm = () => {
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState({});

  const { mutate: createTodoMutate } = useMutation({
    mutationFn: createTodo,
    onError: (error) => {
      addToast({
        color: "danger",
        description: error.message,
        title: "Create Todo Error",
      });
    },
    onSuccess: () => {
      setErrors({});
      // eslint-disable-next-line no-console,sonar/no-reference-error
      queryClient.invalidateQueries(getTodos()).catch(console.error);
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = createTodoSchema.safeParse({
      ...data,
      due: DateTime.now().toISO(),
    });

    if (parsed.success) {
      createTodoMutate(parsed.data);
    } else {
      setErrors(parsed.error.flatten().fieldErrors);
    }
  };

  return (
    <Form
      className="my-4 max-w-sm grid gap-4"
      onSubmit={handleSubmit}
      validationErrors={errors}
    >
      <Input isRequired label="Name" name="name" />
      <Button className="max-w-max" color="primary" type="submit">
        Submit
      </Button>
    </Form>
  );
};
