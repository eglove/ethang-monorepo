/* eslint-disable lodash/prefer-lodash-method */
import { mutations } from "@/data/mutations.ts";
import { queries, queryKeys } from "@/data/queries.ts";
import { logger } from "@/lib/logger.ts";
import {
  Button,
  type ButtonProps,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import filter from "lodash/filter.js";
import isEmpty from "lodash/isEmpty.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil";
import map from "lodash/map";
import { DateTime } from "luxon";
import { type FormEvent, type PropsWithChildren, useState } from "react";
import { v7 } from "uuid";
import { z } from "zod";

export const DATE_FORMAT = "yyyy-MM-dd";

export const formSchema = z.object({
  applied: z.string().trim().date(),
  company: z.string().trim(),
  interviewRounds: z
    .array(
      z.object({
        date: z.string().trim(),
      }),
    )
    .optional(),
  rejected: z.string().trim().optional(),
  title: z.string().trim(),
  url: z.string().trim().url(),
});

type AddEditApplicationProperties = Readonly<
  PropsWithChildren<{
    id?: string;
    triggerProperties?: ButtonProps;
  }>
>;

export const AddEditApplication = ({
  children,
  id,
  triggerProperties,
}: AddEditApplicationProperties) => {
  const { isOpen, onClose, onOpen, onOpenChange } = useDisclosure();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");

  const query = useQuery(queries.getApplicationById(id));

  const initialData: z.infer<typeof formSchema> = isNil(query.data)
    ? {
        applied: DateTime.now().toFormat(DATE_FORMAT),
        company: "",
        interviewRounds: [],
        rejected: "",
        title: "",
        url: "",
      }
    : {
        ...query.data,
        applied: DateTime.fromJSDate(new Date(query.data.applied)).toFormat(
          DATE_FORMAT,
        ),
        interviewRounds: map(query.data.interviewRounds, (round) => {
          return {
            date: DateTime.fromJSDate(new Date(round)).toFormat(DATE_FORMAT),
          };
        }),
        rejected: isNil(query.data.rejected)
          ? ""
          : DateTime.fromJSDate(new Date(query.data.rejected)).toFormat(
              DATE_FORMAT,
            ),
      };

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
    await queryClient
      .invalidateQueries({
        queryKey: queryKeys.applications(),
      })
      .then(() => {
        form.reset();
        setError("");
        onClose();
      });
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
    <>
      <Button color="primary" onPress={onOpen} size="sm" {...triggerProperties}>
        {children}
      </Button>
      <Modal
        onOpenChange={() => {
          form.reset();
          setError("");
          onOpenChange();
        }}
        isOpen={isOpen}
      >
        <ModalContent>
          {(_onClose) => {
            return (
              <>
                <ModalHeader>
                  {isEmpty(id) ? "Add" : "Update"} Application
                </ModalHeader>
                <Form onSubmit={onSubmit}>
                  <ModalBody className="w-full">
                    <form.Field name="title">
                      {(field) => {
                        return (
                          <Input
                            isRequired
                            className="w-full"
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
                                    {/* eslint-disable-next-line sonar/no-nested-functions */}
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
                    {!isEmpty(error) && (
                      <div className="text-destructive">{error}</div>
                    )}
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" onPress={_onClose}>
                      Go Back
                    </Button>
                    <Button color="primary" type="submit">
                      {isEmpty(id) ? "Add" : "Update"}
                    </Button>
                  </ModalFooter>
                </Form>
              </>
            );
          }}
        </ModalContent>
      </Modal>
    </>
  );
};
