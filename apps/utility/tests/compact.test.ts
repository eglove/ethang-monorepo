import { compact as esToolkitCompact } from "es-toolkit/array";
import compact from "lodash/compact.js";
import each from "lodash/each.js";
import { describe, expect, it } from "vitest";

import { falsy } from "./utilities.js";
import { compact as youMightNotNeedLodashCompact } from "./you-might-not-need-lodash.ts";

const testCases = [
  (method: typeof compact) => {
    it("should filter falsy values", () => {
      const array = ["0", "1", "2"];

      expect(method([...falsy, ...array])).toStrictEqual(array);
    });
  },
];

describe("compact", () => {
  describe("lodash", () => {
    each(testCases, (testCase) => {
      testCase(compact);
    });
  });

  describe("es-toolkit", () => {
    each(testCases, (testCase) => {
      testCase(esToolkitCompact);
    });
  });

  describe("You Might Not Need Lodash", () => {
    each(testCases, (testCase) => {
      testCase(youMightNotNeedLodashCompact);
    });
  });
});
