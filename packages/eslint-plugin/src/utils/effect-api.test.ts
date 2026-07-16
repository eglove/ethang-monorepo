import { describe, expect, it } from "vitest";

import {
  effectApi,
  effectCoreMethods,
  effectDateTimeApi,
  isEffectApiMethod,
  isEffectCoreMethod,
  isEffectDateTimeApiKey
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

describe("isEffectDateTimeApiKey", () => {
  it.each([
    "DateConstructor",
    "DateNow",
    "DateParse",
    "DateUTC",
    "DateReference",
    "getTime",
    "getFullYear",
    "TemporalPlainDate",
    "TemporalZonedDateTime"
  ])("recognises Effect DateTime surface key %s", (key) => {
    expect(isEffectDateTimeApiKey(key)).toBe(true);
  });

  it("returns false for unknown names", () => {
    expect(isEffectDateTimeApiKey("notADateTimeKey")).toBe(false);
  });
});

describe("effectDateTimeApi", () => {
  it("exposes a map entry with import/name shape", () => {
    expect(effectDateTimeApi.DateConstructor.import).toBe("DateTime");
    expect(effectDateTimeApi.DateConstructor.name).toBe("make");
  });

  it("has a non-empty Date.prototype surface", () => {
    expect(Object.keys(effectDateTimeApi).length).toBeGreaterThan(0);
  });
});
