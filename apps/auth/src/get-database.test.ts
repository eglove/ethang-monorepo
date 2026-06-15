import { describe, expect, it } from "vitest";

import { user } from "./db/schema.js";
import { getDatabase } from "./get-database.js";

describe("getDatabase", () => {
  it("should initialize drizzle database with provided context D1 instance", () => {
    const mockDatabase = {} as unknown;
    const mockContext = {
      env: {
        DB: mockDatabase
      }
    };

    // @ts-expect-error for test
    const database = getDatabase(mockContext);
    expect(database).toBeDefined();
  });

  it("should evaluate default function for user id", () => {
    const { defaultFn } = user.id;
    expect(defaultFn).toBeTypeOf("function");

    const id = (defaultFn as () => string)();
    expect(id).toBeTypeOf("string");
  });
});
