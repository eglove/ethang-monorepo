import { useStore } from "@ethang/store/use-store";
import { Button, Chip } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import isEmpty from "lodash/isEmpty";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import { CoffeeIcon, SparklesIcon, ZapIcon } from "lucide-react";
import { Activity } from "react";

import { dexieDatabase } from "../../dexie/dexie.ts";
import { focusStore } from "../../stores/focus-store.ts";
import { TypographyH1 } from "../typography/typography-h1.tsx";
import { TypographyH2 } from "../typography/typography-h2.tsx";
import { TypographyP } from "../typography/typography-p.tsx";
import { CompleteTaskButton } from "./complete-task-button.tsx";
import { MicrotaskButton } from "./microtask-button.tsx";
import { TaskInput } from "./task-input.tsx";

export const FocusTab = () => {
  const selectedTask = useStore(focusStore, (state) => {
    return state.selectedTask;
  });

  const task = useLiveQuery(async () => {
    if (isNil(selectedTask)) {
      return null;
    }

    return dexieDatabase.task.get(selectedTask);
  }, [selectedTask]);

  const microTasks = useLiveQuery(async () => {
    if (isNil(selectedTask)) {
      return null;
    }

    return dexieDatabase.microTask.where({ taskId: selectedTask }).toArray();
  }, [selectedTask]);

  const { isPending, mutate } = useMutation({
    mutationFn: async (prompt?: string) => {
      await focusStore.setMicroTasks(task?.id, prompt);
    },
  });

  return (
    <>
      <TaskInput />
      <Activity mode={isNil(task) ? "visible" : "hidden"}>
        <div className="flex min-h-96 flex-col items-center justify-center gap-8 border-2 border-dotted">
          <div>
            <CoffeeIcon className="size-16" />
          </div>
          <div className="text-center">
            <TypographyH2 className="border-none pb-0 font-bold">
              SYSTEM QUIET
            </TypographyH2>
            <TypographyP className="not-first:mt-2">
              Perfect time to disconnect and recharge.
            </TypographyP>
          </div>
        </div>
      </Activity>
      <Activity mode={isNil(task) ? "hidden" : "visible"}>
        <div className="flex min-h-96 flex-col items-center justify-center gap-8 border-2 px-2 py-4">
          <Chip startContent={<ZapIcon className="size-4" />}>
            Active Session
          </Chip>
          <TypographyH1>{task?.title}</TypographyH1>
          <div className="grid grid-cols-2 gap-4">
            {!isNil(task?.id) && <CompleteTaskButton id={task.id} />}
            <Button
              variant="flat"
              isLoading={isPending}
              isDisabled={!isEmpty(microTasks)}
              startContent={<SparklesIcon className="size-5" />}
              onPress={() => {
                mutate(task?.title);
              }}
            >
              AI Decomposition
            </Button>
          </div>
          <Activity mode={isEmpty(microTasks) ? "hidden" : "visible"}>
            <div className="my-4 grid gap-4">
              {map(microTasks, (microtask) => {
                return <MicrotaskButton id={microtask.id} key={microtask.id} />;
              })}
            </div>
          </Activity>
        </div>
      </Activity>
    </>
  );
};
