import { createTodoSchema } from "@ethang/schemas/dashboard/todo-schema.ts";
import { useStore } from "@ethang/store/use-store";
import {
  Button,
  DateInput,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  NumberInput,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString";
import map from "lodash/map.js";
import ms, { type Unit } from "ms";
import { type FormEvent, useState } from "react";
import { z } from "zod";

import {
  convertDateTimeInputToIso,
  type DateInputValue,
  getDateTimeInputNow,
} from "../../../worker/utilities/heroui.ts";
import { todoStore } from "../../stores/todo-store.ts";
import { timeIntervals } from "./time-intervals.ts";

const createTodoFormSchema = createTodoSchema
  .omit({
    dueDate: true,
    recurs: true,
  })
  .extend({
    every: z.string().optional(),
    repeats: z.string().optional(),
  });

export const CreateTodoModal = () => {
  const { isOpen } = useStore(todoStore, (state) => {
    return {
      isOpen: state.isCreateModalOpen,
    };
  });

  const [dueDate, setDueDate] = useState<DateInputValue>(() =>
    getDateTimeInputNow(),
  );

  const { isPending, mutate } = useMutation(todoStore.createModal());

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = createTodoFormSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    const correctDueDate = convertDateTimeInputToIso(dueDate);

    if (!parsed.success || isNil(correctDueDate)) {
      return;
    }

    let recurs: null | number = null;
    if (isString(parsed.data.repeats) && !isEmpty(parsed.data.every)) {
      recurs = ms(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        `${Number(parsed.data.repeats)} ${parsed.data.every as Unit}`,
      );
    }

    mutate({
      description: parsed.data.description,
      dueDate: correctDueDate,
      recurs,
      title: parsed.data.title,
    });
  };

  return (
    <Modal
      onOpenChange={(value) => {
        todoStore.setIsCreateModalOpen(value);
      }}
      isOpen={isOpen}
      scrollBehavior="outside"
    >
      <ModalContent>
        <ModalHeader>Add Todo</ModalHeader>
        <Form className="grid gap-2" onSubmit={handleSubmit}>
          <ModalBody>
            <Input isRequired label="Title" name="title" />
            <DateInput
              defaultValue={getDateTimeInputNow()}
              granularity="minute"
              label="Due Date"
              name="dueDate"
              onChange={setDueDate}
              value={dueDate}
            />
            <div className="flex gap-2">
              <NumberInput label="Repeats" name="repeats" />
              <Select disallowEmptySelection label="Every" name="every">
                {map(timeIntervals, ({ key, label }) => {
                  return <SelectItem key={key}>{label}</SelectItem>;
                })}
              </Select>
            </div>
            <Textarea label="Description" name="description" />
          </ModalBody>
          <ModalFooter>
            <Button
              onPress={() => {
                todoStore.setIsCreateModalOpen(false);
              }}
              color="danger"
              variant="light"
            >
              Close
            </Button>
            <Button color="primary" isLoading={isPending} type="submit">
              Create
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
};
