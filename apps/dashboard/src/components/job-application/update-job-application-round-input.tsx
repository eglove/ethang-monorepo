import { Button, Input } from "@heroui/react";
import filter from "lodash/filter.js";
import isNil from "lodash/isNil";
import set from "lodash/set";
import { CheckIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { modalStore, useModalStore } from "../../global-stores/modal-store.ts";
import { getFormDate } from "../../utilities/form.ts";

type UpdateJobApplicationRoundInputProperties = {
  index: number;
  round: null | string | undefined;
};

export const UpdateJobApplicationRoundInput = ({
  index,
  round,
}: Readonly<UpdateJobApplicationRoundInputProperties>) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const jobApplication = useModalStore((state) => {
    return state.applicationToUpdate;
  });

  const handleDelete = () => {
    if (isNil(jobApplication)) {
      return;
    }

    const rounds = filter(jobApplication.interviewRounds, (_, _index) => {
      return index !== _index;
    });

    modalStore.setApplicationToUpdate({
      ...jobApplication,
      interviewRounds: rounds,
    });

    setIsDeleting(false);
  };

  return (
    <div className="flex gap-2 items-center">
      <Input
        onValueChange={(value) => {
          if (isNil(jobApplication)) {
            return;
          }

          const rounds = isNil(jobApplication.interviewRounds)
            ? []
            : [...jobApplication.interviewRounds];
          set(rounds, index, value);

          modalStore.setApplicationToUpdate({
            ...jobApplication,
            interviewRounds: rounds,
          });
        }}
        key={`${round}-${index}`}
        label={`Round ${index + 1}`}
        name={`round-${index + 1}`}
        type="date"
        value={getFormDate(round)}
      />
      {!isDeleting && (
        <Button
          isIconOnly
          onPress={() => {
            setIsDeleting(true);
          }}
          color="danger"
          size="lg"
        >
          <Trash2Icon />
        </Button>
      )}
      {isDeleting && (
        <Button isIconOnly color="primary" onPress={handleDelete} size="lg">
          <CheckIcon />
        </Button>
      )}
    </div>
  );
};
