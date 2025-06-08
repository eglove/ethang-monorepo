import type { JobApplication } from "@ethang/schemas/src/dashboard/application-schema.ts";
import type { FormEvent } from "react";

import { useUser } from "@clerk/clerk-react";
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
} from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { produce } from "immer";
import filter from "lodash/filter.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import { Trash2Icon } from "lucide-react";
import { DateTime } from "luxon";

import {
  convertDateTimeInputToIso,
  convertIsoToDateTimeInput,
  type DateInputValue,
} from "../../../worker/utilities/heroui.ts";
import { applicationStore } from "../../stores/application-store.ts";
import { getFormDate } from "../../utilities/form.ts";

export const UpdateJobApplicationModal = () => {
  const { user } = useUser();

  const { applicationToUpdate, isUpdateModalOpen } = useStore(
    applicationStore,
    (state) => {
      return {
        applicationToUpdate: state.applicationToUpdate,
        isUpdateModalOpen: state.isUpdateModalOpen,
      };
    },
  );

  const handleChange = (key: keyof JobApplication) => (value: string) => {
    if (isNil(applicationToUpdate) || "interviewRounds" === key) {
      return;
    }

    applicationStore.setApplicationToUpdate({
      ...applicationToUpdate,
      [key]: value,
    });
  };

  const handleRemoveInterviewRound = (index: number) => {
    if (isNil(applicationToUpdate)) {
      return;
    }

    applicationStore.setApplicationToUpdate({
      ...applicationToUpdate,
      interviewRounds: filter(
        applicationToUpdate.interviewRounds,
        (_, _index) => {
          return index !== _index;
        },
      ),
    });
  };

  const handleAddInterviewRound = () => {
    if (isNil(applicationToUpdate)) {
      return;
    }

    applicationStore.setApplicationToUpdate({
      ...applicationToUpdate,
      interviewRounds: [
        ...applicationToUpdate.interviewRounds,
        { dateTime: DateTime.now().toISO() },
      ],
    });
  };

  const handleInterviewRoundChange =
    (index: number) => (value: DateInputValue) => {
      if (isNil(applicationToUpdate)) {
        return;
      }

      const isoValue = convertDateTimeInputToIso(value);

      if (isNil(isoValue)) {
        handleRemoveInterviewRound(index);
      } else {
        const updated = produce(applicationToUpdate, (state) => {
          state.interviewRounds[index] = { dateTime: isoValue };
        });

        applicationStore.setApplicationToUpdate(updated);
      }
    };

  const { isPending, mutate } = useMutation(
    applicationStore.updateApplication(user?.id),
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isNil(applicationToUpdate)) {
      return;
    }

    mutate(applicationToUpdate);
  };

  return (
    <Modal
      onOpenChange={(value) => {
        if (!value) {
          applicationStore.setApplicationToUpdate(null);
        }
        applicationStore.setIsUpdateModalOpen(value);
      }}
      isOpen={isUpdateModalOpen}
      scrollBehavior="outside"
    >
      <ModalContent>
        <ModalHeader>Update Job Application</ModalHeader>
        <Form className="grid gap-2" onSubmit={handleSubmit}>
          <ModalBody>
            <Input
              isRequired
              label="Title"
              name="title"
              onValueChange={handleChange("title")}
              value={applicationToUpdate?.title ?? ""}
            />
            <Input
              isRequired
              label="Company"
              name="company"
              onValueChange={handleChange("company")}
              value={applicationToUpdate?.company ?? ""}
            />
            <Input
              isRequired
              label="URL"
              name="url"
              onValueChange={handleChange("url")}
              type="url"
              value={applicationToUpdate?.url ?? ""}
            />
            <Input
              isRequired
              label="Applied"
              name="applied"
              onValueChange={handleChange("applied")}
              type="date"
              value={getFormDate(applicationToUpdate?.applied)}
            />
            <Input
              label="Rejected"
              name="rejected"
              onValueChange={handleChange("rejected")}
              type="date"
              value={getFormDate(applicationToUpdate?.rejected)}
            />
            {map(applicationToUpdate?.interviewRounds, (round, index) => {
              return (
                <div className="flex gap-2 items-center" key={index}>
                  <DateInput
                    isRequired
                    label={`Round ${index + 1}`}
                    onChange={handleInterviewRoundChange(index)}
                    value={convertIsoToDateTimeInput(round.dateTime)}
                  />
                  <Button
                    isIconOnly
                    onPress={() => {
                      handleRemoveInterviewRound(index);
                    }}
                    color="danger"
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              );
            })}
            <Button
              color="primary"
              onPress={handleAddInterviewRound}
              variant="flat"
            >
              Add Interview Round
            </Button>
          </ModalBody>
          <ModalFooter>
            <Button
              onPress={() => {
                applicationStore.setIsUpdateModalOpen(false);
              }}
              color="danger"
              variant="light"
            >
              Close
            </Button>
            <Button color="primary" isLoading={isPending} type="submit">
              Update
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
};
