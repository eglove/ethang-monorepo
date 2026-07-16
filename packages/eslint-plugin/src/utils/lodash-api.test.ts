import { describe, expect, it } from "vitest";

import { hasNativeArrayAlias, isLodashArrayFunction } from "./lodash-api.ts";

describe("hasNativeArrayAlias", () => {
  it("returns true for collection methods with native aliases", () => {
    expect(hasNativeArrayAlias("map")).toBe(true);
    expect(hasNativeArrayAlias("filter")).toBe(true);
    expect(hasNativeArrayAlias("find")).toBe(true);
    expect(hasNativeArrayAlias("includes")).toBe(true);
  });

  it("returns false for collection methods without native aliases", () => {
    expect(hasNativeArrayAlias("groupBy")).toBe(false);
    expect(hasNativeArrayAlias("keyBy")).toBe(false);
    expect(hasNativeArrayAlias("countBy")).toBe(false);
    expect(hasNativeArrayAlias("orderBy")).toBe(false);
  });

  it("returns false for non-lodash names", () => {
    expect(hasNativeArrayAlias("nonExistent")).toBe(false);
    expect(hasNativeArrayAlias("")).toBe(false);
  });
});

describe("isLodashArrayFunction", () => {
  it("returns true for array category methods", () => {
    expect(isLodashArrayFunction("chunk")).toBe(true);
    expect(isLodashArrayFunction("compact")).toBe(true);
  });

  it("returns true for collection category methods", () => {
    expect(isLodashArrayFunction("map")).toBe(true);
    expect(isLodashArrayFunction("groupBy")).toBe(true);
  });

  it("returns false for non-lodash names", () => {
    expect(isLodashArrayFunction("nonExistent")).toBe(false);
  });
});
