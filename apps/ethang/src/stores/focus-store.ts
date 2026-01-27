import { BaseStore } from "@ethang/store";
import isNil from "lodash/isNil.js";

import { dexieDatabase } from "../dexie/dexie.ts";

const focusStoreInitialState = {
  selectedTab: "focus",
  selectedTask: null as null | string,
};

class FocusStore extends BaseStore<typeof focusStoreInitialState> {
  public constructor() {
    super(focusStoreInitialState);
    this.setInitialSelectedTask();
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

  private setInitialSelectedTask() {
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
