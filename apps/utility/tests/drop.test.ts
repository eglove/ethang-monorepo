import { drop as esToolkitDrop } from "es-toolkit/array";
import drop from "lodash/drop.js";
import each from "lodash/each.js";
import map from "lodash/map.js";
import { drop as remedaDrop } from "remeda";
import { expect, it } from "vitest";

import { runTests } from "./run-tests.js";
import { falsy } from "./utilities.js";
import { drop as youMightNotNeedLodashDrop } from "./you-might-not-need-lodash.ts";

const array = [1, 2, 3];

const testCases = [
  (method: typeof drop) => {
    it("should drop the first two elements", () => {
      expect(method(array, 2)).toEqual([3]);
    });
  },
  (method: typeof drop) => {
    it("should treat falsy `n` values, except `undefined`, as `0`", () => {
      const expected = map(falsy, (value) =>
        value === undefined ? [2, 3] : array,
      );

      // @ts-expect-error allow for test
      const actual = map(falsy, (n) => method(array, n));

      expect(actual).toEqual(expected);
    });
  },
  (method: typeof drop) => {
    it("should return all elements when `n` < `1`", () => {
      each([0, -1, -Infinity], (n) => {
        expect(method(array, n)).toEqual(array);
      });
    });
  },
  (method: typeof drop) => {
    it("should return an empty array when `n` >= `length`", () => {
      each([3, 4, 2 ** 32, Infinity], (n) => {
        expect(method(array, n)).toEqual([]);
      });
    });
  },
  (method: typeof drop) => {
    it("should coerce `n` to an integer", () => {
      expect(method(array, 1.6)).toEqual([2, 3]);
    });
  },
];

const libraries = [
  { library: "lodash", method: drop },
  { library: "es-toolkit", method: esToolkitDrop },
  { library: "remeda", method: remedaDrop },
  { library: "You Might Not Need Lodash", method: youMightNotNeedLodashDrop },
];

runTests("drop", libraries, testCases);
