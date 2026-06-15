/* eslint-disable unicorn/consistent-function-scoping */
import find from "lodash/find.js";
import { describe, expect, it } from "vitest";

import {
  articlesRelations,
  articlesTable,
  feedsRelations,
  feedsTable,
  subscriptionsRelations,
  subscriptionsTable,
  userItemStatesRelations,
  userItemStatesTable
} from "./schema.ts";

describe("Database Schema Definitions", () => {
  it("generates uuid values on feedsTable.id defaultFn", () => {
    const { defaultFn } = feedsTable.id;
    expect(defaultFn).toBeDefined();
    const id = defaultFn?.();
    expect(id).toBeTypeOf("string");
    // @ts-expect-error for test
    expect(id?.length).toBeGreaterThan(0);
  });

  it("generates createdAt timestamp on subscriptionsTable.createdAt defaultFn", () => {
    const { defaultFn } = subscriptionsTable.createdAt;
    expect(defaultFn).toBeDefined();
    const date = defaultFn?.();
    expect(date).toBeTypeOf("string");
    // @ts-expect-error for test
    expect(date?.length).toBeGreaterThan(0);
  });

  it("evaluates relation callback configurations", () => {
    const mockHelpers = {
      many: (target: unknown) => {
        return {
          withFieldName: () => {
            return target;
          }
        };
      },
      one: (target: unknown, config?: unknown) => {
        return {
          withFieldName: () => {
            return { config, target };
          }
        };
      }
    };

    // @ts-expect-error for test
    expect(feedsRelations.config(mockHelpers)).toBeDefined();
    // @ts-expect-error for test
    expect(articlesRelations.config(mockHelpers)).toBeDefined();
    // @ts-expect-error for test
    expect(subscriptionsRelations.config(mockHelpers)).toBeDefined();
    // @ts-expect-error for test
    expect(userItemStatesRelations.config(mockHelpers)).toBeDefined();
  });

  it("evaluates foreign key reference callbacks", () => {
    const sqliteInlineKeysSymbol = Symbol.for(
      "drizzle:SQLiteInlineForeignKeys"
    );

    const getKeys = (table: unknown) => {
      // @ts-expect-error for test

      return (table[sqliteInlineKeysSymbol] ?? []) as {
        reference: () => unknown;
      }[];
    };

    const articlesKeys = getKeys(articlesTable);
    for (const key of articlesKeys) {
      expect(key.reference()).toBeDefined();
    }

    const subscriptionsKeys = getKeys(subscriptionsTable);
    for (const key of subscriptionsKeys) {
      expect(key.reference()).toBeDefined();
    }

    const userItemStatesKeys = getKeys(userItemStatesTable);
    for (const key of userItemStatesKeys) {
      expect(key.reference()).toBeDefined();
    }
  });

  it("evaluates extra config builder callbacks", () => {
    const getExtraBuilder = (table: unknown) => {
      const sym = find(Object.getOwnPropertySymbols(table), (s) => {
        return "drizzle:ExtraConfigBuilder" === s.description;
      });
      // @ts-expect-error for test
      return sym ? table[sym] : undefined;
    };

    const articlesBuilder = getExtraBuilder(articlesTable);
    expect(articlesBuilder?.(articlesTable)).toBeDefined();

    const subscriptionsBuilder = getExtraBuilder(subscriptionsTable);
    expect(subscriptionsBuilder?.(subscriptionsTable)).toBeDefined();

    const userItemStatesBuilder = getExtraBuilder(userItemStatesTable);
    expect(userItemStatesBuilder?.(userItemStatesTable)).toBeDefined();
  });
});
