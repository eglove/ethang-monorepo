import { Button, Input } from "@heroui/react";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DateTime } from "luxon";

import { createTodo } from "../../data/mutations/add-todo.ts";
import { getTodos } from "../../data/queries/get-todos.ts";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField: Input,
  },
  fieldContext,
  formComponents: {
    SubmitButton: Button,
  },
  formContext,
});

export const CreateTodoForm = () => {
  const queryClient = useQueryClient();

  const { mutate: createTodoMutate } = useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries(getTodos()).catch(globalThis.console.error);
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: "",
    },
    onSubmit: ({ value }) => {
      createTodoMutate({ due: DateTime.now().toISO(), name: value.name });
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit().catch(globalThis.console.error);
      }}
      className="my-4 max-w-sm grid gap-4"
    >
      <form.AppField name="name">
        {(field) => {
          return (
            <field.TextField
              label="Name"
              onValueChange={field.setValue}
              value={form.getFieldValue("name")}
            />
          );
        }}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton className="max-w-max" color="primary" type="submit">
          Submit
        </form.SubmitButton>
      </form.AppForm>
    </form>
  );
};
