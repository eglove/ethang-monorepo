import type { FormEvent } from "react";

import {
  Accordion,
  AccordionItem,
  Button,
  Form,
  Input,
  Textarea,
} from "@heroui/react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { v7 } from "uuid";

import { addQa as addQaFunction } from "@/data/methods/add-qa.ts";
import { logger } from "@/lib/logger.ts";

export const AddQaForm = () => {
  const addQa = useMutation({
    mutationFn: addQaFunction,
    onSuccess: () => {
      form.reset();
    },
  });

  const form = useForm({
    defaultValues: {
      answer: "",
      question: "",
    },
    onSubmit: ({ value }) => {
      addQa.mutate({
        ...value,
        id: v7(),
      });
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit().catch(logger.error);
  };

  return (
    <Accordion isCompact>
      <AccordionItem
        title={
          <div className="underline underline-offset-2">
            Add Application Question / Answer
          </div>
        }
        aria-label="Add Application Question / Answer"
        key="1"
      >
        <Form onSubmit={handleSubmit}>
          <form.Field name="question">
            {(field) => {
              return (
                <Input
                  isRequired
                  id={field.name}
                  label="Question"
                  name={field.name}
                  onBlur={field.handleBlur}
                  onValueChange={field.handleChange}
                  value={field.state.value}
                />
              );
            }}
          </form.Field>
          <form.Field name="answer">
            {(field) => {
              return (
                <Textarea
                  isRequired
                  id={field.name}
                  label="Answer"
                  name={field.name}
                  onBlur={field.handleBlur}
                  onValueChange={field.handleChange}
                  value={field.state.value}
                />
              );
            }}
          </form.Field>
          <Button
            className="self-end"
            color="primary"
            isLoading={addQa.isPending}
            type="submit"
          >
            Add
          </Button>
        </Form>
      </AccordionItem>
    </Accordion>
  );
};
