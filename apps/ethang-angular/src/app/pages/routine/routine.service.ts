import { Injectable, signal } from "@angular/core";
import { addMilliseconds } from "date-fns/addMilliseconds";
import { liveQuery } from "dexie";
import find from "lodash/find";
import isNil from "lodash/isNil";
import ms from "ms";
import { v7 } from "uuid";

import { database, type RoutineItem } from "../../database";

type AddRoutineItem = {
  interval: string;
  recurs: number;
  text: string;
};

@Injectable({
  providedIn: "root",
})
export class RoutineService {
  public readonly routineItems = signal<RoutineItem[]>([]);

  // eslint-disable-next-line unicorn/consistent-function-scoping
  private readonly routineItems$ = liveQuery(async () => {
    return database.routineItems.toArray();
  });

  public constructor() {
    this.routineItems$.subscribe((value) => {
      this.routineItems.set(
        value.toSorted((a, b) => {
          return a.due.getTime() - b.due.getTime();
        }),
      );
    });
  }

  public async addRoutineItem(routine: AddRoutineItem) {
    await database.routineItems.add({
      ...routine,
      due: new Date(),
      id: v7(),
      recurs: ms(`${routine.recurs} ${routine.interval}`),
    });
  }

  public async completeRoutineItem(id: string) {
    const previous = await database.routineItems.get(id);

    if (isNil(previous)) {
      return;
    }

    await database.routineItems.update(id, {
      due: addMilliseconds(previous.due, previous.recurs),
    });
  }

  public async deleteRoutineItem(id: string) {
    await database.routineItems.delete(id);
  }

  private findRoutineItem(id: string) {
    return find(this.routineItems(), { id });
  }
}
