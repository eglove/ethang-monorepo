/* eslint-disable @typescript-eslint/no-misused-promises */
import { FormInput } from "@/components/form/form-input.tsx";
import { TypographyH2 } from "@/components/typography/typography-h2.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Form } from "@/components/ui/form.tsx";
import { mutations } from "@/data/mutations.ts";
import { queryKeys } from "@/data/queries.ts";
import { DATE_FORMAT } from "@/routes/upsert-application.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { QueryClient, useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import get from "lodash/get.js";
import isDate from "lodash/isDate.js";
import isEmpty from "lodash/isEmpty.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil";
import map from "lodash/map.js";
import { DateTime } from "luxon";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { InterviewRounds } from "./interview-rounds";

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
  const queryClient = new QueryClient();
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const routerState = useRouterState();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const id = get(routerState, ["location", "search", "id"]) as
    | string
    | undefined;

  const addApplication = useMutation({
    ...mutations.addJobApplication(),
    onError: (_error: unknown) => {
      if (isError(_error)) {
        setError(_error.message);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.applications(),
      });
      await navigate({ to: "/" });
    },
  });

  const updateApplication = useMutation({
    ...mutations.updateJobApplication(),
    onError: (_error: unknown) => {
      if (isError(_error)) {
        setError(_error.message);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.applications(),
      });
      await navigate({ to: "/" });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: initialData,
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const appliedDate = DateTime.fromFormat(
      values.applied,
      DATE_FORMAT,
    ).toJSDate();
    const rejectedDate =
      isNil(values.rejected) || !isDate(values.rejected)
        ? null
        : DateTime.fromFormat(values.rejected, DATE_FORMAT).toJSDate();

    // Create
    if (isNil(id)) {
      addApplication.mutate({
        ...values,
        applied: appliedDate,
        interviewRounds: [],
        rejected: rejectedDate,
      });
      // Update
    } else {
      updateApplication.mutate({
        ...values,
        applied: appliedDate,
        id,
        interviewRounds: map(values.interviewRounds, (round) => {
          return DateTime.fromFormat(round.date, DATE_FORMAT).toJSDate();
        }),
        rejected: rejectedDate,
      });
    }
  };

  return (
    <div className="m-4 max-w-md">
      <TypographyH2>{isEmpty(id) ? "Add" : "Update"} Application</TypographyH2>
      <Form {...form}>
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormInput required form={form} label="Title" name="title" />
          <FormInput required form={form} label="Company" name="company" />
          <FormInput required form={form} label="URL" name="url" />
          <FormInput
            required
            form={form}
            label="Applied"
            name="applied"
            type="date"
          />
          {!isEmpty(id) && <InterviewRounds form={form} />}
          {!isEmpty(id) && (
            <FormInput
              form={form}
              label="Rejected"
              name="rejected"
              type="date"
            />
          )}
          {!isEmpty(error) && <div className="text-destructive">{error}</div>}
          <div className="flex justify-end gap-4">
            <Button asChild size="sm" variant="secondary">
              <Link to="/">Go Back</Link>
            </Button>
            <Button size="sm" type="submit">
              {isEmpty(id) ? "Add" : "Update"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
