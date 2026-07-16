import { describe, expect, it } from "vitest";

import { isBarrelFilename, isInsideNodeModules } from "./file.ts";

describe("isBarrelFilename", () => {
  it.each([
    ["index.ts", true],
    ["index.tsx", true],
    ["index.js", true],
    ["index.jsx", true],
    ["index.mjs", true],
    ["index.mts", true],
    ["index.cjs", true],
    ["index.cts", true],
    ["index.d.ts", true],
    ["src/index.ts", true],
    [String.raw`src\index.ts`, true],
    ["not-index.ts", false],
    ["", false],
    ["", false],
    ["\0", false],
    ["index", false]
  ])("returns %s for %s", (filename, expected) => {
    expect(isBarrelFilename(filename)).toBe(expected);
  });
});

describe("isInsideNodeModules", () => {
  it.each([
    ["/node_modules/lodash/index.js", true],
    [String.raw`src\node_modules\lodash\index.js`, true],
    ["node_modules", false],
    ["src/foo.ts", false]
  ])("returns %s for %s", (filename, expected) => {
    expect(isInsideNodeModules(filename)).toBe(expected);
  });
});
