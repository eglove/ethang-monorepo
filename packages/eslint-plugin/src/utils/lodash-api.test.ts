import { describe, expect, it } from "vitest";

import {
  hasNativeArrayAlias,
  isLodashArrayFunction,
  isRuntimeOnlyLodashMethod
} from "./lodash-api.ts";

const RETURNS_FALSE_FOR_NON_LODASH_NAMES = "returns false for non-lodash names";
const UNKNOWN = "nonExistent";

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

  it(RETURNS_FALSE_FOR_NON_LODASH_NAMES, () => {
    expect(hasNativeArrayAlias(UNKNOWN)).toBe(false);
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

  it(RETURNS_FALSE_FOR_NON_LODASH_NAMES, () => {
    expect(isLodashArrayFunction(UNKNOWN)).toBe(false);
  });
});

describe("isRuntimeOnlyLodashMethod", () => {
  it.each(["chain", "runInContext", "toChain", "mixin"])(
    "recognises runtime-only lodash method %s",
    (name) => {
      expect(isRuntimeOnlyLodashMethod(name)).toBe(true);
    }
  );

  it("returns false for normal lodash methods", () => {
    expect(isRuntimeOnlyLodashMethod("map")).toBe(false);
    expect(isRuntimeOnlyLodashMethod("chunk")).toBe(false);
    expect(isRuntimeOnlyLodashMethod("noConflict")).toBe(false);
  });

  it("returns false for non-lodash names", () => {
    expect(isRuntimeOnlyLodashMethod("notALodashMethod")).toBe(false);
    expect(isRuntimeOnlyLodashMethod("")).toBe(false);
  });
});
