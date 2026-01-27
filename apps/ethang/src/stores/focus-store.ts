import { BaseStore } from "@ethang/store";
import attempt from "lodash/attempt.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import reject from "lodash/reject.js";
import { DateTime } from "luxon";
import { v7 } from "uuid";
import { z } from "zod";

import { dexieDatabase } from "../dexie/dexie.ts";

const focusStoreInitialState = {
  selectedTab: "focus",
  selectedTask: null as null | string,
};

class FocusStore extends BaseStore<typeof focusStoreInitialState> {
  public constructor() {
    super(focusStoreInitialState);
    this.setSelectedTaskToFirst();
  }

  public async addTask(title: string) {
    const added = await dexieDatabase.task.add({
      completed: false,
      id: v7(),
      title,
    });

    if (isNil(this.state.selectedTask)) {
      this.setSelectedTask(added);
    }
  }

  public async completeMicrotask(id: string, taskId: string | undefined) {
    await dexieDatabase.microTask.update(id, { completed: true });

    if (isNil(taskId)) {
      return;
    }

    const microTasks = await dexieDatabase.microTask
      .where({ taskId })
      .toArray();

    const incompleteMicroTasks = reject(microTasks, ["completed"]);

    if (0 === incompleteMicroTasks.length) {
      await this.deleteTask(taskId);
    }
  }

  public async deleteTask(id: string) {
    await Promise.all([
      dexieDatabase.task.delete(id),
      dexieDatabase.microTask.where({ taskId: id }).delete(),
    ]);
    this.setSelectedTaskToFirst();
  }

  public async setMicroTasks(taskId?: string, prompt?: string) {
    if (isNil(prompt) || isNil(taskId)) {
      return;
    }

    const response = await fetch(`/api/ai-microtask?prompt=${prompt}`);
    const data = await response.json<AiTextGenerationOutput>();
    const text = data.response;

    if (isNil(text)) {
      return;
    }

    const parsed = attempt(() => {
      return JSON.parse(text) as unknown;
    });
    const parsedTasks = z.array(z.string()).safeParse(parsed);

    const newMicroTasks = map(parsedTasks.data, (microtask) => {
      return {
        completed: false,
        id: v7(),
        taskId,
        title: microtask,
      };
    });
    await dexieDatabase.microTask.bulkPut(newMicroTasks);
  }

  public setSelectedTab(tab: string) {
    this.update((draft) => {
      draft.selectedTab = tab;
    });
  }

  public setSelectedTask(id: null | string) {
    this.update((draft) => {
      draft.selectedTask = id;
    });
  }

  public async updateMedicationLog() {
    await dexieDatabase.medicationLog.put({
      date: DateTime.now().toJSDate(),
      id: "id",
    });
  }

  private setSelectedTaskToFirst() {
    if (isNil(this.state.selectedTask)) {
      dexieDatabase.task
        .toCollection()
        .and((task) => !task.completed)
        .first()
        .then((task) => {
          if (!isNil(task)) {
            this.update((draft) => {
              draft.selectedTask = task.id;
            });
          }
        })
        .catch(globalThis.console.error);
    }
  }
}

export const focusStore = new FocusStore();
