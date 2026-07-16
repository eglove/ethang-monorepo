import { describe, expect, it } from "vitest";

import {
  effectApi,
  effectCoreMethods,
  isEffectApiMethod,
  isEffectCoreMethod
} from "./effect-api.ts";

describe("isEffectApiMethod", () => {
  it("returns true for known effect methods", () => {
    expect(isEffectApiMethod("map")).toBe(true);
    expect(isEffectApiMethod("filter")).toBe(true);
  });

  it("returns false for unknown names", () => {
    expect(isEffectApiMethod("notAnEffectMethod")).toBe(false);
  });
});

describe("effectApi", () => {
  it("exposes a map entry with import/name shape", () => {
    expect(effectApi.map.import).toBe("Array");
    expect(effectApi.map.name).toBe("map");
  });
});

describe("isEffectCoreMethod", () => {
  it.each(["succeed", "fail", "flatMap", "tap", "zip", "gen"])(
    "recognises effect core method %s",
    (method) => {
      expect(isEffectCoreMethod(method)).toBe(true);
    }
  );

  it("returns false for non-effect core methods", () => {
    expect(isEffectCoreMethod("notAnEffectMethod")).toBe(false);
  });

  it("has a non-empty set of effect core methods", () => {
    expect(effectCoreMethods.size).toBeGreaterThan(0);
  });
});
