import { useLiveQuery } from "dexie-react-hooks";
import isEmpty from "lodash/isEmpty";
import map from "lodash/map";
import { Activity } from "react";

import { dexieDatabase } from "../../dexie/dexie.ts";
import { TypographyP } from "../typography/typography-p.tsx";
import { TaskInput } from "./task-input.tsx";
import { Task } from "./task.tsx";

export const InventoryTab = () => {
  const tasks = useLiveQuery(async () => {
    return dexieDatabase.task.toArray();
  });

  return (
    <>
      <TaskInput />
      <Activity mode={isEmpty(tasks) ? "visible" : "hidden"}>
        <div className="grid h-36 place-items-center">
          <TypographyP>No pending tasks found.</TypographyP>
        </div>
      </Activity>
      <Activity mode={isEmpty(tasks) ? "hidden" : "visible"}>
        {map(tasks, (task) => {
          return <Task id={task.id} key={task.id} />;
        })}
      </Activity>
    </>
  );
};
