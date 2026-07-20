import { describe, expect, it } from "vitest";

import { isObjectFromEntriesCall } from "./prefer-lodash-from-pairs.ts";
import { findCall } from "./.fixture.ts";

describe("prefer-lodash-from-pairs", () => {
  describe("isObjectFromEntriesCall", () => {
    it("returns true for Object.fromEntries(pairs)", () => {
      const { call } = findCall("Object.fromEntries(pairs)");
      expect(isObjectFromEntriesCall(call)).toBe(true);
    });

    it("returns false for Object.keys(obj)", () => {
      const { call } = findCall("Object.keys(obj)");
      expect(isObjectFromEntriesCall(call)).toBe(false);
    });

    it("returns false for Object.entries(obj)", () => {
      const { call } = findCall("Object.entries(obj)");
      expect(isObjectFromEntriesCall(call)).toBe(false);
    });

    it("returns false for fn(pairs)", () => {
      const { call } = findCall("fn(pairs)");
      expect(isObjectFromEntriesCall(call)).toBe(false);
    });

    it("returns false for Object.fromEntries() with no args", () => {
      const { call } = findCall("Object.fromEntries()");
      expect(isObjectFromEntriesCall(call)).toBe(false);
    });

    it("returns false for Object.fromEntries(a, b) with two args", () => {
      const { call } = findCall("Object.fromEntries(a, b)");
      expect(isObjectFromEntriesCall(call)).toBe(false);
    });
  });
});
