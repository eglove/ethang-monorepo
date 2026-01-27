import { Button } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react";

import { focusStore } from "../../stores/focus-store.ts";

type CompleteTaskButtonProperties = {
  id: string;
};

export const CompleteTaskButton = ({
  id,
}: Readonly<CompleteTaskButtonProperties>) => {
  const { isPending, mutate } = useMutation({
    mutationFn: async () => {
      await focusStore.deleteTask(id);
    },
  });

  return (
    <Button
      isLoading={isPending}
      onPress={() => {
        mutate();
      }}
      startContent={
        <CheckIcon className="size-5 rounded-full border-2 p-0.5" />
      }
    >
      Complete
    </Button>
  );
};
