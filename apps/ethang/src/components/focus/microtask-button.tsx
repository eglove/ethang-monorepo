import { Button } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import isNil from "lodash/isNil.js";
import { CheckIcon, CircleIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { dexieDatabase } from "../../dexie/dexie.ts";
import { focusStore } from "../../stores/focus-store.ts";

type MicrotaskButtonProperties = {
  id: string;
};

export const MicrotaskButton = ({
  id,
}: Readonly<MicrotaskButtonProperties>) => {
  const microtask = useLiveQuery(async () => {
    return dexieDatabase.microTask.get(id);
  });

  const { isPending, mutate } = useMutation({
    mutationFn: async () => {
      await focusStore.completeMicrotask(id, microtask?.taskId);
    },
  });

  return (
    <>
      {!isNil(microtask) && (
        <Button
          isLoading={isPending}
          isDisabled={microtask.completed}
          color={microtask.completed ? "success" : "default"}
          onPress={() => {
            mutate();
          }}
          startContent={microtask.completed ? <CheckIcon /> : <CircleIcon />}
          className={twMerge(
            "justify-start border-2 px-2 py-4",
            microtask.completed && "line-through",
          )}
        >
          {microtask.title}
        </Button>
      )}
    </>
  );
};
