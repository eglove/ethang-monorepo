import { describe, expect, it } from "vitest";

import { Database, DatabaseTransaction, TYPE_MARKER } from "./types.ts";

describe("types", () => {
  it("tYPE_MARKER is exported", () => {
    expect(TYPE_MARKER).toBe("types");
  });

  it("database type is importable", () => {
    const database = {} as unknown as Database;

    expect(database).toBeDefined();
  });

  it("databaseTransaction type is importable", () => {
    const tx = {} as unknown as DatabaseTransaction;

    expect(tx).toBeDefined();
  });
});
