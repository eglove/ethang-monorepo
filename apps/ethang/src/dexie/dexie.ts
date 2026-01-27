import Dexie, { type EntityTable } from "dexie";

type MedicationLog = {
  date: Date;
  id: string;
};

type MicroTask = {
  taskId: string;
} & Task;

type Task = {
  completed: boolean;
  id: string;
  title: string;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
export const dexieDatabase = new Dexie("task-database") as {
  medicationLog: EntityTable<MedicationLog, "id">;
  microTask: EntityTable<MicroTask, "taskId">;
  task: EntityTable<Task, "id">;
} & Dexie;

dexieDatabase.version(1).stores({
  medicationLog: "++id, date",
  microTask: "++id, taskId, completed, title",
  task: "++id, completed, title",
});
