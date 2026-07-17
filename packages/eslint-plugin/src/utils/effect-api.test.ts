import { describe, expect, it } from "vitest";

import {
  effectApi,
  effectBigIntApi,
  effectDateTimeApi,
  effectDurationApi,
  effectEncodingApi,
  effectNumberApi,
  effectPredicateApi,
  effectRedactedApi,
  effectStringApi,
  isEffectApiMethod,
  isEffectBigIntApiName,
  isEffectDateTimeApiKey,
  isEffectDurationApiName,
  isEffectEncodingApiName,
  isEffectNumberApiName,
  isEffectPredicateApiName,
  isEffectRedactedApiName,
  isEffectStringApiName
} from "./effect-api.ts";

const RETURNS_FALSE_FOR_UNKNOWN = "returns false for unknown names";
const EXPOSES_IMPORT_NAME_FOR_EVERY_ENTRY =
  "exposes import/name for every entry";
const RECOGNISES_EFFECT_EXPORT = (namespace: string) => {
  return `recognises Effect ${namespace} export %s`;
};

describe("isEffectApiMethod", () => {
  const KNOWN_EFFECT_METHODS = ["map", "filter"] as const;
  it("returns true for known effect methods", () => {
    for (const methodName of KNOWN_EFFECT_METHODS) {
      expect(isEffectApiMethod(methodName)).toBe(true);
    }
  });

  it(RETURNS_FALSE_FOR_UNKNOWN, () => {
    expect(isEffectApiMethod("notAnEffectMethod")).toBe(false);
  });
});

describe("effectApi", () => {
  it("exposes a map entry with import/name shape", () => {
    expect(effectApi.map.import).toBe("Array");
    expect(effectApi.map.name).toBe("map");
  });

  it("includes the extended Array surface", () => {
    const NAMES = [
      "intersperse",
      "scan",
      "scanRight",
      "allocate",
      "reverse",
      "sort",
      "zipWith",
      "unzip"
    ] as const;
    for (const methodName of NAMES) {
      const entry = effectApi[methodName];
      expect(entry.name).toBe(methodName);
      expect(entry.import).toBe("Array");
    }
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

  it(RETURNS_FALSE_FOR_UNKNOWN, () => {
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

describe("isEffectPredicateApiName", () => {
  it.each([
    "isBigInt",
    "isSymbol",
    "isUndefined",
    "isNull",
    "isNotNullable",
    "isString",
    "isNumber",
    "isBoolean"
  ])(RECOGNISES_EFFECT_EXPORT("Predicate"), (name) => {
    expect(isEffectPredicateApiName(name)).toBe(true);
  });

  it(RETURNS_FALSE_FOR_UNKNOWN, () => {
    expect(isEffectPredicateApiName("notAPredicate")).toBe(false);
  });

  it(EXPOSES_IMPORT_NAME_FOR_EVERY_ENTRY, () => {
    const ENTRIES = Object.entries(effectPredicateApi);
    expect(ENTRIES.length).toBeGreaterThan(0);
    for (const [key, entry] of ENTRIES) {
      expect(entry.import).toBe("Predicate");
      expect(entry.name).toBe(key);
    }
  });
});

describe("isEffectStringApiName", () => {
  it.each([
    "trim",
    "trimStart",
    "trimEnd",
    "toLowerCase",
    "toUpperCase",
    "startsWith",
    "endsWith",
    "includes",
    "split"
  ])(RECOGNISES_EFFECT_EXPORT("String"), (name) => {
    expect(isEffectStringApiName(name)).toBe(true);
  });

  it(RETURNS_FALSE_FOR_UNKNOWN, () => {
    expect(isEffectStringApiName("notAStringExport")).toBe(false);
  });

  it(EXPOSES_IMPORT_NAME_FOR_EVERY_ENTRY, () => {
    const ENTRIES = Object.entries(effectStringApi);
    expect(ENTRIES.length).toBeGreaterThan(0);
    for (const [key, entry] of ENTRIES) {
      expect(entry.import).toBe("String");
      expect(entry.name).toBe(key);
    }
  });
});

describe("isEffectNumberApiName", () => {
  it.each([
    "parse",
    "unsafeFromString",
    "isFinite",
    "isInteger",
    "isNaN",
    "isSafeInteger",
    "clamp"
  ])(RECOGNISES_EFFECT_EXPORT("Number"), (name) => {
    expect(isEffectNumberApiName(name)).toBe(true);
  });

  it(RETURNS_FALSE_FOR_UNKNOWN, () => {
    expect(isEffectNumberApiName("notANumberExport")).toBe(false);
  });

  it(EXPOSES_IMPORT_NAME_FOR_EVERY_ENTRY, () => {
    const ENTRIES = Object.entries(effectNumberApi);
    expect(ENTRIES.length).toBeGreaterThan(0);
    for (const [key, entry] of ENTRIES) {
      expect(entry.import).toBe("Number");
      expect(entry.name).toBe(key);
    }
  });
});

describe("isEffectBigIntApiName", () => {
  it.each(["clamp", "fromString", "unsafeFromString", "make", "sign"])(
    RECOGNISES_EFFECT_EXPORT("BigInt"),
    (name) => {
      expect(isEffectBigIntApiName(name)).toBe(true);
    }
  );

  it(RETURNS_FALSE_FOR_UNKNOWN, () => {
    expect(isEffectBigIntApiName("notABigIntExport")).toBe(false);
  });

  it(EXPOSES_IMPORT_NAME_FOR_EVERY_ENTRY, () => {
    const ENTRIES = Object.entries(effectBigIntApi);
    expect(ENTRIES.length).toBeGreaterThan(0);
    for (const [key, entry] of ENTRIES) {
      expect(entry.import).toBe("BigInt");
      expect(entry.name).toBe(key);
    }
  });
});

describe("isEffectEncodingApiName", () => {
  it.each([
    "encodeBase64",
    "decodeBase64",
    "encodeHex",
    "decodeHex",
    "encodeUrl",
    "decodeUrl",
    "encodeBase64Url"
  ])(RECOGNISES_EFFECT_EXPORT("Encoding"), (name) => {
    expect(isEffectEncodingApiName(name)).toBe(true);
  });

  it(RETURNS_FALSE_FOR_UNKNOWN, () => {
    expect(isEffectEncodingApiName("notAnEncodingExport")).toBe(false);
  });

  it(EXPOSES_IMPORT_NAME_FOR_EVERY_ENTRY, () => {
    const ENTRIES = Object.entries(effectEncodingApi);
    expect(ENTRIES.length).toBeGreaterThan(0);
    for (const [key, entry] of ENTRIES) {
      expect(entry.import).toBe("Encoding");
      expect(entry.name).toBe(key);
    }
  });
});

describe("isEffectDurationApiName", () => {
  it.each([
    "millis",
    "seconds",
    "minutes",
    "hours",
    "days",
    "fromMillis",
    "fromSeconds",
    "toMillis",
    "toSeconds"
  ])(RECOGNISES_EFFECT_EXPORT("Duration"), (name) => {
    expect(isEffectDurationApiName(name)).toBe(true);
  });

  it(RETURNS_FALSE_FOR_UNKNOWN, () => {
    expect(isEffectDurationApiName("notADurationExport")).toBe(false);
  });

  it(EXPOSES_IMPORT_NAME_FOR_EVERY_ENTRY, () => {
    const ENTRIES = Object.entries(effectDurationApi);
    expect(ENTRIES.length).toBeGreaterThan(0);
    for (const [key, entry] of ENTRIES) {
      expect(entry.import).toBe("Duration");
      expect(entry.name).toBe(key);
    }
  });
});

describe("isEffectRedactedApiName", () => {
  it.each(["make", "value"])(RECOGNISES_EFFECT_EXPORT("Redacted"), (name) => {
    expect(isEffectRedactedApiName(name)).toBe(true);
  });

  it(RETURNS_FALSE_FOR_UNKNOWN, () => {
    expect(isEffectRedactedApiName("notARedactedExport")).toBe(false);
  });

  it(EXPOSES_IMPORT_NAME_FOR_EVERY_ENTRY, () => {
    const ENTRIES = Object.entries(effectRedactedApi);
    expect(ENTRIES.length).toBeGreaterThan(0);
    for (const [key, entry] of ENTRIES) {
      expect(entry.import).toBe("Redacted");
      expect(entry.name).toBe(key);
    }
  });
});
