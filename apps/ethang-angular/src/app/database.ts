import Dexie, { type Table } from "dexie";

export type RoutineItem = {
  due: Date;
  id: string;
  recurs: number;
  text: string;
};

export class Database extends Dexie {
  public routineItems!: Table<RoutineItem, string>;

  public constructor() {
    super("ethang-database");
    this.version(1).stores({
      routineItems: "++id, due, recurs, text",
    });
  }
}

export const database = new Database();
