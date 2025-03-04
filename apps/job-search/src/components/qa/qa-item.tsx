import type { QuestionAnswerSchema } from "@ethang/schemas/src/job-search/question-answer-schema.ts";

import { DeleteQa } from "@/components/qa/delete-qa.tsx";
import { QaCopyButton } from "@/components/qa/qa-copy-button.tsx";
import { TypographyP } from "@/components/typography/typography-p.tsx";
import { updateQa } from "@/data/methods/update-qa.ts";
import { logger } from "@/lib/logger.ts";
import { Button, Form, Input, Textarea } from "@heroui/react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import map from "lodash/map";
import split from "lodash/split";
import { PencilIcon, XIcon } from "lucide-react";
import { type FormEvent, useState } from "react";

type QaItemHeaderProperties = Readonly<{
  qa: QuestionAnswerSchema;
}>;

export const QaItem = ({ qa }: QaItemHeaderProperties) => {
  const answerLines = split(qa.answer, "\n");
  const [isEditing, setIsEditing] = useState(false);
  const updatedQa = useMutation({
    mutationFn: updateQa,
    onSuccess: () => {
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
    <Form onSubmit={handleSubmit}>
      {!isEditing && (
        <div className="max-h-96 overflow-y-auto border-1 p-2">
          {map(answerLines, (line, index) => {
            return <TypographyP key={index}>{line}</TypographyP>;
          })}
        </div>
      )}
      {isEditing && (
        <div className="grid w-full gap-2">
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
        </div>
      )}
      <div className="my-4 flex w-full items-center justify-between gap-2">
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
        <div>
          {isEditing && (
            <Button
              className="self-end"
              color="primary"
              isLoading={updatedQa.isPending}
              type="submit"
            >
              Update
            </Button>
          )}
          {!isEditing && <DeleteQa id={qa.id} />}
        </div>
      </div>
    </Form>
  );
};
