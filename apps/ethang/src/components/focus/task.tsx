import { Button } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import isNil from "lodash/isNil.js";
import { CheckIcon, CircleIcon, Trash2Icon, ZapIcon } from "lucide-react";
import { Activity } from "react";

import { dexieDatabase } from "../../dexie/dexie.ts";
import { focusStore } from "../../stores/focus-store.ts";

type TaskProperties = {
  id: string;
};

export const Task = ({ id }: Readonly<TaskProperties>) => {
  const task = useLiveQuery(async () => {
    return dexieDatabase.task.get(id);
  });

  const { isPending: isCompletePending, mutate: completeTask } = useMutation({
    mutationFn: async () => {
      if (isNil(task)) {
        return null;
      }

      const updated = await dexieDatabase.task.update(id, { completed: true });
      focusStore.setSelectedTask(null);
      return updated;
    },
  });

  const { isPending: isDeletePending, mutate: deleteTask } = useMutation({
    mutationFn: async () => {
      await dexieDatabase.task.delete(id);
      await dexieDatabase.microTask.where({ taskId: id }).delete();
    },
  });

  const isLoading = isCompletePending || isDeletePending;
  const isCompleted = true === task?.completed;

  return (
    <div className="my-4 flex items-center justify-between rounded-xl border-2 px-2 py-4">
      <div className="flex items-center gap-2">
        <Button
          isIconOnly
          variant="ghost"
          className="border-0"
          isLoading={isLoading}
          isDisabled={isCompleted}
          onPress={() => {
            completeTask();
          }}
        >
          <Activity mode={isCompleted ? "hidden" : "visible"}>
            <CircleIcon />
          </Activity>
          <Activity mode={isCompleted ? "visible" : "hidden"}>
            <CheckIcon />
          </Activity>
        </Button>
        <div className="font-bold">{task?.title}</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          isIconOnly
          variant="ghost"
          isLoading={isLoading}
          isDisabled={isCompleted}
          onPress={() => {
            if (!isNil(task) && !task.completed) {
              focusStore.setSelectedTask(task.id);
              focusStore.setSelectedTab("focus");
            }
          }}
        >
          <ZapIcon />
        </Button>
        <Button
          isIconOnly
          variant="ghost"
          className="border-0"
          isLoading={isLoading}
          onPress={() => {
            deleteTask();
          }}
        >
          <Trash2Icon />
        </Button>
      </div>
    </div>
  );
};
