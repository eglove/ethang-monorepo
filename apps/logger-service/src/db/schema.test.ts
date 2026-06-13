import { getTableConfig } from "drizzle-orm/sqlite-core";
import { describe, expect, it } from "vitest";

import { logs } from "./schema.ts";

describe("schema.ts - Drizzle SQLite Schema", () => {
  it("has functions for id and timestamp default values", () => {
    expect(logs.id.defaultFn).toBeTypeOf("function");
    // @ts-expect-error test double
    expect(logs.id.defaultFn()).toBeTypeOf("string");

    expect(logs.timestamp.defaultFn).toBeTypeOf("function");
    // @ts-expect-error test double
    expect(logs.timestamp.defaultFn()).toBeTypeOf("string");
  });

  it("defines table indexes", () => {
    const config = getTableConfig(logs);

    expect(config.indexes).toHaveLength(4);
  });
});
