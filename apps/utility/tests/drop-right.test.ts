import { dropRight as esToolkitDropRight } from "es-toolkit/array";
import dropRight from "lodash/dropRight.js";
import each from "lodash/each.js";
import map from "lodash/map.js";
import { dropLast as remedaDropRight } from "remeda";
import { expect, it } from "vitest";

import { runTests } from "./run-tests.js";
import { falsy } from "./utilities.js";
import { dropRight as youMightNotNeedLodashDropRight } from "./you-might-not-need-lodash.ts";

const array = [1, 2, 3];

const testCases = [
  (method: typeof dropRight) => {
    it("should drop the last two elements", () => {
      expect(method(array, 2)).toEqual([1]);
    });
  },
  (method: typeof dropRight) => {
    it("should treat falsy `n` values, except `undefined`, as `0`", () => {
      const expected = map(falsy, (value) =>
        value === undefined ? [1, 2] : array,
      );

      // @ts-expect-error allow for test
      const actual = map(falsy, (n) => method(array, n));

      expect(actual).toEqual(expected);
    });
  },
  (method: typeof dropRight) => {
    it("should return all elements when `n` < `1`", () => {
      each([0, -1, -Infinity], (n) => {
        expect(method(array, n)).toEqual(array);
      });
    });
  },
  (method: typeof dropRight) => {
    it("should return an empty array when `n` >= `length`", () => {
      each([3, 4, 2 ** 32, Infinity], (n) => {
        expect(method(array, n)).toEqual([]);
      });
    });
  },
  (method: typeof dropRight) => {
    it("should coerce `n` to an integer", () => {
      expect(method(array, 1.6)).toEqual([1, 2]);
    });
  },
];

const libraries = [
  { library: "lodash", method: dropRight },
  { library: "es-toolkit", method: esToolkitDropRight },
  { library: "Remeda", method: remedaDropRight },
  {
    library: "You Might Not Need Lodash",
    method: youMightNotNeedLodashDropRight,
  },
];

runTests("dropRight", libraries, testCases);
