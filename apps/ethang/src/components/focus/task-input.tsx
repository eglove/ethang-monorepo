import { Input } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { type SubmitEventHandler, useState } from "react";

import { focusStore } from "../../stores/focus-store.ts";

export const TaskInput = () => {
  const [title, setTitle] = useState("");

  const { isPending, mutate } = useMutation({
    mutationFn: async () => {
      await focusStore.addTask(title);
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
