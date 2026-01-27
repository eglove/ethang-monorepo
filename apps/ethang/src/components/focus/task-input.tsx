import { Input } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import isNil from "lodash/isNil.js";
import { PlusIcon } from "lucide-react";
import { type SubmitEventHandler, useState } from "react";
import { v7 } from "uuid";

import { dexieDatabase } from "../../dexie/dexie.ts";
import { focusStore } from "../../stores/focus-store.ts";

export const TaskInput = () => {
  const [title, setTitle] = useState("");

  const { isPending, mutate } = useMutation({
    mutationFn: async () => {
      const added = await dexieDatabase.task.add({
        completed: false,
        id: v7(),
        title,
      });

      if (isNil(focusStore.state.selectedTask)) {
        focusStore.setSelectedTask(added);
      }

      return added;
    },
  });

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    mutate();
    setTitle("");
  };

  return (
    <form className="mb-4" onSubmit={handleSubmit}>
      <Input
        isRequired
        value={title}
        variant="bordered"
        disabled={isPending}
        startContent={<PlusIcon />}
        placeholder="Capture an intrusive thought..."
        onValueChange={(value) => {
          setTitle(value);
        }}
      />
    </form>
  );
};
