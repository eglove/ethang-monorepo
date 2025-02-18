import type { QuestionAnswerSchema } from "@ethang/schemas/src/job-search/question-answer-schema.ts";

import { DeleteQa } from "@/components/qa/delete-qa.tsx";
import { QaCopyButton } from "@/components/qa/qa-copy-button.tsx";
import { TypographyP } from "@/components/typography/typography-p.tsx";
import { mutations } from "@/data/mutations.ts";
import { queryKeys } from "@/data/queries";
import { logger } from "@/lib/logger.ts";
import { Button, Form, Input, Textarea } from "@heroui/react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import map from "lodash/map";
import split from "lodash/split";
import { PencilIcon, XIcon } from "lucide-react";
import { type FormEvent, useState } from "react";

type QaItemHeaderProperties = Readonly<{
  qa: QuestionAnswerSchema;
}>;

export const QaItem = ({ qa }: QaItemHeaderProperties) => {
  const queryClient = useQueryClient();
  const answerLines = split(qa.answer, "\n");
  const [isEditing, setIsEditing] = useState(false);
  const updatedQa = useMutation({
    ...mutations.updateQa(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.qas() });
      setIsEditing(false);
    },
  });

  const form = useForm({
    defaultValues: {
      answer: qa.answer,
      question: qa.question,
    },
    onSubmit: ({ value }) => {
      updatedQa.mutate({
        ...value,
        id: qa.id,
      });
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit().catch(logger.error);
  };

  return (
    <>
      <div>
        {!isEditing &&
          map(answerLines, (line, index) => {
            return <TypographyP key={index}>{line}</TypographyP>;
          })}
        {isEditing && (
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
              isLoading={updatedQa.isPending}
              type="submit"
            >
              Update
            </Button>
          </Form>
        )}
      </div>
      <div className="my-4 flex gap-2 justify-between items-center">
        <div className="flex gap-2">
          <QaCopyButton text={qa.answer} />{" "}
          <Button
            endContent={
              isEditing ? (
                <XIcon className="size-5" />
              ) : (
                <PencilIcon className="size-5" />
              )
            }
            onPress={() => {
              setIsEditing((previous) => !previous);
            }}
          >
            {isEditing ? "Cancel Edit" : "Edit"}
          </Button>
        </div>
        <DeleteQa id={qa.id} />
      </div>
    </>
  );
};
