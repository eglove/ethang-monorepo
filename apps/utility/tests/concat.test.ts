import { concat as esToolkitConcat } from "es-toolkit/compat";
import concat from "lodash/concat.js";
import map from "lodash/map.js";
import { concat as remedaConcat } from "remeda";
import { assert, expect, it } from "vitest";

import { runTests } from "./run-tests.js";
import { concat as youMightNotNeedLodashConcat } from "./you-might-not-need-lodash.ts";

const testCases = [
  (method: typeof concat) => {
    it("should shallow clone array", () => {
      const array = [1, 2, 3];
      const actual = method(array);

      expect(actual).toEqual(array);
      assert.notStrictEqual(actual, array);
    });
  },
  (method: typeof concat) => {
    it("should concat arrays and values", () => {
      const array = [1];
      // @ts-expect-error ignore for test
      const actual = method(array, 2, [3], [[4]]);

      expect(actual).toEqual([1, 2, 3, [4]]);
      expect(array).toEqual([1]);
    });
  },
  (method: typeof concat) => {
    it("should cast non-array `array` values to arrays", () => {
      // eslint-disable-next-line no-sparse-arrays
      const values = [, null, undefined, false, true, 1, Number.NaN, "a"];

      let expected = map(values, (value, index) => (index ? [value] : []));
      let actual = map(values, (value, index) =>
        index ? method(value) : method(),
      );
      expect(actual).toEqual(expected);

      // @ts-expect-error allow for test
      expected = map(values, (value) => [value, 2, [3]]);
      // @ts-expect-error allow for test
      actual = map(values, (value) => method(value, [2], [[3]]));
      expect(actual).toEqual(expected);
    });
  },
  (method: typeof concat) => {
    it("should treat sparse arrays as dense", () => {
      const expected = [];
      const actual = method(
        Array.from({ length: 1 }),
        Array.from({ length: 1 }),
      );

      expected.push(undefined, undefined);

      // eslint-disable-next-line sonar/no-in-misuse
      expect("0" in actual).toBeTruthy();
      // eslint-disable-next-line sonar/no-in-misuse
      expect("1" in actual).toBeTruthy();
      expect(actual).toEqual(expected);
    });
  },
];

const libraries = [
  { library: "lodash", method: concat },
  { library: "es-toolkit", method: esToolkitConcat },
  { library: "Remeda", method: remedaConcat },
  { library: "You Might Not Need Lodash", method: youMightNotNeedLodashConcat },
];

runTests("concat", libraries, testCases);
