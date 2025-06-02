import type {
  JobApplication,
  UpdateJobApplication,
} from "@ethang/schemas/src/dashboard/application-schema.ts";
import type { ZonedDateTime } from "@internationalized/date";
import type { FormEvent } from "react";

import { useUser } from "@clerk/clerk-react";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import filter from "lodash/filter.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import { Trash2Icon } from "lucide-react";
import { DateTime } from "luxon";

import {
  convertDateTimeInputToIso,
  convertIsoToDateTimeInput,
} from "../../../worker/utilities/heroui.ts";
import { queryKeys } from "../../data/queries/queries.ts";
import { modalStore, useModalStore } from "../../global-stores/modal-store.ts";
import { formDateToIso, getFormDate } from "../../utilities/form.ts";

export const UpdateJobApplicationModal = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  const jobApplication = useModalStore((state) => {
    return state.applicationToUpdate;
  });

  const isOpen = useModalStore((state) => {
    return state.updateApplication;
  });

  const handleChange = (key: keyof JobApplication) => (value: string) => {
    if (isNil(jobApplication) || "interviewRounds" === key) {
      return;
    }

    modalStore.setApplicationToUpdate({
      ...jobApplication,
      [key]: value,
    });
  };

  const handleRemoveInterviewRound = (index: number) => {
    if (isNil(jobApplication)) {
      return;
    }

    modalStore.setApplicationToUpdate({
      ...jobApplication,
      interviewRounds: filter(jobApplication.interviewRounds, (_, _index) => {
        return index !== _index;
      }),
    });
  };

  const handleAddInterviewRound = () => {
    if (isNil(jobApplication)) {
      return;
    }

    modalStore.setApplicationToUpdate({
      ...jobApplication,
      interviewRounds: [
        ...jobApplication.interviewRounds,
        { dateTime: DateTime.now().toISO() },
      ],
    });
  };

  const handleInterviewRoundChange =
    (index: number) => (value: null | ZonedDateTime) => {
      if (isNil(jobApplication)) {
        return;
      }

      const isoValue = convertDateTimeInputToIso(value);

      if (isNil(isoValue)) {
        handleRemoveInterviewRound(index);
      } else {
        const updated = produce(jobApplication, (state) => {
          state.interviewRounds[index] = { dateTime: isoValue };
        });

        modalStore.setApplicationToUpdate(updated);
      }
    };

  const { isPending, mutate } = useMutation({
    mutationFn: async (data: UpdateJobApplication) => {
      const response = await fetch("/api/application", {
        body: JSON.stringify({
          ...data,
          applied: formDateToIso(data.applied),
          rejected: isNil(data.rejected) ? null : formDateToIso(data.rejected),
        }),
        method: "PUT",
      });

      if (response.ok) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.allUserApplications(user?.id),
        });
        modalStore.closeModal("updateApplication");
      }
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isNil(jobApplication)) {
      return;
    }

    mutate(jobApplication);
  };

  return (
    <Modal
      onOpenChange={(value) => {
        if (!value) {
          modalStore.setApplicationToUpdate(null);
        }
        modalStore.setIsModalOpen("updateApplication", value);
      }}
      isOpen={isOpen}
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
              value={jobApplication?.title ?? ""}
            />
            <Input
              isRequired
              label="Company"
              name="company"
              onValueChange={handleChange("company")}
              value={jobApplication?.company ?? ""}
            />
            <Input
              isRequired
              label="URL"
              name="url"
              onValueChange={handleChange("url")}
              type="url"
              value={jobApplication?.url ?? ""}
            />
            <Input
              isRequired
              label="Applied"
              name="applied"
              onValueChange={handleChange("applied")}
              type="date"
              value={getFormDate(jobApplication?.applied)}
            />
            <Input
              label="Rejected"
              name="rejected"
              onValueChange={handleChange("rejected")}
              type="date"
              value={getFormDate(jobApplication?.rejected)}
            />
            {map(jobApplication?.interviewRounds, (round, index) => {
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
                modalStore.closeModal("updateApplication");
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
