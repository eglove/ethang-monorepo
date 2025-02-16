import { TypographyH2 } from "@/components/typography/typography-h2.tsx";
import { mutations } from "@/data/mutations.ts";
import { queryKeys } from "@/data/queries.ts";
import { logger } from "@/lib/logger.ts";
import { DATE_FORMAT } from "@/routes/upsert-application.tsx";
import { Button, Form, Input } from "@heroui/react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import filter from "lodash/filter.js";
import get from "lodash/get.js";
import isEmpty from "lodash/isEmpty.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil";
import map from "lodash/map";
import { DateTime } from "luxon";
import { type FormEvent, useState } from "react";
import { v7 } from "uuid";
import { z } from "zod";

export const formSchema = z.object({
  applied: z.string().date(),
  company: z.string(),
  interviewRounds: z
    .array(
      z.object({
        date: z.string(),
      }),
    )
    .optional(),
  rejected: z.string().optional(),
  title: z.string(),
  url: z.string().url(),
});

type AddEditApplicationProperties = Readonly<{
  initialData: z.infer<typeof formSchema>;
}>;

export const AddEditApplication = ({
  initialData,
}: AddEditApplicationProperties) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const routerState = useRouterState();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const id = get(routerState, ["location", "search", "id"]) as
    | string
    | undefined;

  const form = useForm({
    defaultValues: initialData,
    onSubmit: ({ value }) => {
      const appliedDate = DateTime.fromFormat(
        value.applied,
        DATE_FORMAT,
      ).toJSDate();
      const rejectedDate =
        isNil(value.rejected) || Number.isNaN(Date.parse(value.rejected))
          ? null
          : DateTime.fromFormat(value.rejected, DATE_FORMAT).toJSDate();

      // Create
      if (isNil(id)) {
        addApplication.mutate({
          ...value,
          applied: appliedDate.toISOString(),
          id: v7(),
          interviewRounds: [],
          rejected: rejectedDate?.toISOString() ?? undefined,
        });
        // Update
      } else {
        updateApplication.mutate({
          ...value,
          applied: appliedDate.toISOString(),
          id,
          interviewRounds: map(
            filter(value.interviewRounds, (round) => {
              return !Number.isNaN(Date.parse(round.date));
            }),
            (round) => {
              return DateTime.fromFormat(round.date, DATE_FORMAT).toISO() ?? "";
            },
          ),
          rejected: rejectedDate?.toISOString() ?? undefined,
        });
      }
    },
    validators: {
      onSubmit: formSchema,
    },
  });

  const onError = (_error: unknown) => {
    if (isError(_error)) {
      setError(_error.message);
    }
  };

  const onSuccess = async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.applications(),
    });
    await navigate({ to: "/" });
  };

  const addApplication = useMutation({
    ...mutations.addJobApplication(),
    onError,
    onSuccess,
  });

  const updateApplication = useMutation({
    ...mutations.updateJobApplication(),
    onError,
    onSuccess,
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit().catch(logger.error);
  };

  return (
    <div className="m-4 max-w-md">
      <TypographyH2 className="mb-4">
        {isEmpty(id) ? "Add" : "Update"} Application
      </TypographyH2>
      <Form onSubmit={onSubmit}>
        <form.Field name="title">
          {(field) => {
            return (
              <Input
                isRequired
                label="Title"
                name={field.name}
                onBlur={field.handleBlur}
                onValueChange={field.handleChange}
                value={field.state.value}
              />
            );
          }}
        </form.Field>
        <form.Field name="company">
          {(field) => {
            return (
              <Input
                isRequired
                label="Company"
                name={field.name}
                onBlur={field.handleBlur}
                onValueChange={field.handleChange}
                value={field.state.value}
              />
            );
          }}
        </form.Field>
        <form.Field name="url">
          {(field) => {
            return (
              <Input
                isRequired
                label="URL"
                name={field.name}
                onBlur={field.handleBlur}
                onValueChange={field.handleChange}
                value={field.state.value}
              />
            );
          }}
        </form.Field>
        <form.Field name="applied">
          {(field) => {
            return (
              <Input
                isRequired
                label="Applied"
                name={field.name}
                onBlur={field.handleBlur}
                onValueChange={field.handleChange}
                type="date"
                value={field.state.value}
              />
            );
          }}
        </form.Field>
        {!isEmpty(id) && (
          <form.Field name="rejected">
            {(field) => {
              return (
                <Input
                  label="Rejected"
                  name={field.name}
                  onBlur={field.handleBlur}
                  onValueChange={field.handleChange}
                  type="date"
                  value={field.state.value ?? ""}
                />
              );
            }}
          </form.Field>
        )}
        {!isEmpty(id) && (
          <form.Field mode="array" name="interviewRounds">
            {(field) => {
              return (
                <>
                  {map(field.state.value, (_, index) => {
                    return (
                      <form.Field
                        key={index}
                        name={`interviewRounds[${index}].date`}
                      >
                        {(subfield) => {
                          return (
                            <Input
                              label={`Interview Round ${index + 1}`}
                              name={subfield.name}
                              onBlur={subfield.handleBlur}
                              onValueChange={subfield.handleChange}
                              type="date"
                              value={subfield.state.value}
                            />
                          );
                        }}
                      </form.Field>
                    );
                  })}
                  <Button
                    onPress={() => {
                      field.pushValue({ date: "" });
                    }}
                  >
                    Add Interview Round
                  </Button>
                </>
              );
            }}
          </form.Field>
        )}
        {!isEmpty(error) && <div className="text-destructive">{error}</div>}
        <div className="flex w-full justify-end gap-4">
          <Button as={Link} color="primary" to="/">
            Go Back
          </Button>
          <Button color="primary" type="submit">
            {isEmpty(id) ? "Add" : "Update"}
          </Button>
        </div>
      </Form>
    </div>
  );
};
