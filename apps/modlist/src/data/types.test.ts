import { describe, expect, it } from "vitest";

import {
  Database,
  DatabaseTransaction,
  TYPE_MARKER
} from "./types.ts";

describe("types", () => {
  it("TYPE_MARKER is exported", () => {
    expect(TYPE_MARKER).toBe("types");
  });

  it("Database type is importable", () => {
    const db = {} as unknown as Database;
    expect(db).toBeDefined();
  });

  it("DatabaseTransaction type is importable", () => {
    const tx = {} as unknown as DatabaseTransaction;
    expect(tx).toBeDefined();
  });
});
