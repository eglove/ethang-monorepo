import { sql } from "drizzle-orm";
import { SQLiteSyncDialect } from "drizzle-orm/sqlite-core";
import isNil from "lodash/isNil.js";
import { describe, expect, it } from "vitest";

import { combineFilters } from "./combine-filters.ts";

const dialect = new SQLiteSyncDialect();
const first = sql`first`;
const second = sql`second`;

describe("combineFilters", () => {
  it.each([
    { expected: null, first: null, name: "neither filter", second: null },
    { expected: "first", first, name: "only first filter", second: null },
    { expected: "second", first: null, name: "only second filter", second },
    { expected: "(first and second)", first, name: "both filters", second }
  ])("combines $name", ({ expected, first: left, second: right }) => {
    const result = combineFilters(left, right);
    const rendered = isNil(result) ? null : dialect.sqlToQuery(result).sql;
    expect(rendered).toBe(expected);
  });
});
