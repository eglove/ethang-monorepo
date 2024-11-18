import type { FormEvent } from "react";

import { useConvexMutation } from "@convex-dev/react-query";
import { Button } from "@nextui-org/button";
import { Textarea } from "@nextui-org/input";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { zodValidator } from "@tanstack/zod-form-adapter";
import isError from "lodash/isError";
import isNil from "lodash/isNil.js";
import { SendHorizonal } from "lucide-react";
import { toast } from "react-toastify";
import { z } from "zod";

import { api } from "../../../convex/_generated/api";
import { currentConversation } from "./conversation-list.tsx";

const messageSchema = z.object({
  content: z.string().min(1),
});

export const ConversationInput = () => {
  const { isPending, mutate } = useMutation({
    mutationFn: useConvexMutation(api.message.create),
    onError: (error: { data?: string }) => {
      if (!isNil(error.data)) {
        toast.error(error.data);
      }
    },
  });

  const form = useForm({
    defaultValues: { content: "" },
    onSubmit: ({ value }) => {
      const conversationId = currentConversation.get();

      if (isNil(conversationId)) {
        return;
      }

      mutate({
        content: [value.content],
        conversationId,
        type: "",
      });
    },
    validatorAdapter: zodValidator(),
    validators: {
      onSubmit: messageSchema,
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit().catch((_error: unknown) => {
      if (isError(_error)) {
        console.error(_error);
      }
    })
      .finally(() => {
        form.reset();
      });
  };

  return (
    <form
      className="flex h-full"
      onSubmit={handleSubmit}
    >
      <form.Field
        children={(fieldApi) => {
          return (
            <Textarea
              onKeyDown={(event) => {
                if (event.ctrlKey && "Enter" === event.key) {
                  handleSubmit(event);
                }
              }}
              onValueChange={(value) => {
                fieldApi.handleChange(value);
              }}
              classNames={{ inputWrapper: "rounded-none" }}
              id={fieldApi.name}
              isDisabled={isPending}
              isInvalid={0 < fieldApi.state.meta.errors.length}
              maxRows={3}
              minRows={1}
              name={fieldApi.name}
              onBlur={fieldApi.handleBlur}
              placeholder="Enter message"
              value={fieldApi.state.value}
            />
          );
        }}
        name="content"
      />
      <form.Subscribe
        children={(formState) => {
          return (
            <Button
              isIconOnly
              aria-label="Send"
              className="h-full rounded-none"
              color="primary"
              disabled={!formState.canSubmit}
              isLoading={formState.isSubmitting || isPending}
              type="submit"
            >
              <SendHorizonal />
            </Button>
          );
        }}
      />
    </form>
  );
};
