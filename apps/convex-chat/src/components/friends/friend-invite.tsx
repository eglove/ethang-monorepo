import { useConvexMutation } from "@convex-dev/react-query";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { zodValidator } from "@tanstack/zod-form-adapter";
import isError from "lodash/isError";
import isNil from "lodash/isNil";
import { toast } from "react-toastify";
import { z } from "zod";

import { api } from "../../../convex/_generated/api";

const inviteSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const FriendInvite = () => {
  const { isPending, mutate } = useMutation({
    mutationFn: useConvexMutation(api.request.create),
    onError: (error: { data?: string }) => {
      if (!isNil(error.data)) {
        toast.error(error.data);
      }
    },
    onSuccess: () => {
      toast.success("Request sent!");
    },
  });

  const form = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: ({ value }) => {
      mutate(value);
      form.reset();
    },
    validatorAdapter: zodValidator(),
    validators: {
      onSubmit: inviteSchema,
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit().catch((_error: unknown) => {
          if (isError(_error)) {
            console.error(_error);
          }
        });
      }}
      className="mx-auto grid max-w-lg gap-1"
    >

      <div className="flex justify-center gap-4">
        <form.Field
          children={(fieldApi) => {
            return (
              <Input
                onChange={(event) => {
                  fieldApi.handleChange(event.target.value);
                }}
                className="max-w-sm"
                errorMessage={fieldApi.state.meta.errors[0]}
                id={fieldApi.name}
                isInvalid={0 < fieldApi.state.meta.errors.length}
                label="Email"
                name={fieldApi.name}
                onBlur={fieldApi.handleBlur}
                size="sm"
                value={fieldApi.state.value}
              />
            );
          }}
          name="email"
        />
        <form.Subscribe
          children={(formState) => {
            return (
              <Button
                color="primary"
                disabled={!formState.canSubmit}
                isLoading={formState.isSubmitting || isPending}
                size="lg"
                type="submit"
              >
                Add
              </Button>
            );
          }}
        />
      </div>
    </form>
  );
};
