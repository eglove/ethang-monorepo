import { difference as esToolkitDifference } from "es-toolkit/array";
import constant from "lodash/constant.js";
import difference from "lodash/difference.js";
import each from "lodash/each.js";
import map from "lodash/map.js";
import range from "lodash/range.js";
import times from "lodash/times.js";
// eslint-disable-next-line sonar/no-built-in-override
import toString from "lodash/toString.js";
import { difference as remedaDifference } from "remeda";
import { describe, expect, it } from "vitest";

import { _arguments, LARGE_ARRAY_SIZE, stubNaN, stubOne } from "./utilities.js";
import { difference as youMightNotNeedLodashDifference } from "./you-might-not-need-lodash.ts";

const testCases = [
  (method: typeof difference) => {
    it("should return the difference of two arrays", () => {
      const actual = method([2, 1], [2, 3]);
      expect(actual).toEqual([1]);
    });
  },
  (method: typeof difference) => {
    it("should return the difference of multiple arrays", () => {
      const actual = method([2, 1, 2, 3], [3, 4], [3, 2]);
      expect(actual).toEqual([1]);
    });
  },
  (method: typeof difference) => {
    it(`should treat \`-0\` as \`0\``, () => {
      const array = [-0, 0];

      let actual = map(array, (value) => method(array, [value]));

      expect(actual).toEqual([[], []]);

      // @ts-expect-error allow for test
      actual = map(method([-0, 1], [1]), toString);
      expect(actual).toEqual(["0"]);
    });
  },
  (method: typeof difference) => {
    it(`should match \`NaN\``, () => {
      expect(method([1, Number.NaN, 3], [Number.NaN, 5, Number.NaN])).toEqual([
        1, 3,
      ]);
    });
  },
  (method: typeof difference) => {
    it(`should work with large arrays`, () => {
      const array1 = range(LARGE_ARRAY_SIZE + 1);
      const array2 = range(LARGE_ARRAY_SIZE);
      const a = {};
      const b = {};
      const c = {};

      // @ts-expect-error allow for test
      array1.push(a, b, c);
      // @ts-expect-error allow for test
      array2.push(b, c, a);

      expect(method(array1, array2)).toEqual([LARGE_ARRAY_SIZE]);
    });
  },
  (method: typeof difference) => {
    it(`should work with large arrays of \`-0\` as \`0\``, () => {
      const array = [-0, 0];

      let actual = map(array, (value) => {
        const largeArray = times(LARGE_ARRAY_SIZE, constant(value));
        return method(array, largeArray);
      });

      expect(actual).toEqual([[], []]);

      const largeArray = times(LARGE_ARRAY_SIZE, stubOne);
      // @ts-expect-error allow for test
      actual = map(method([-0, 1], largeArray), toString);
      expect(actual).toEqual(["0"]);
    });
  },
  (method: typeof difference) => {
    it(`should work with large arrays of \`NaN\``, () => {
      const largeArray = times(LARGE_ARRAY_SIZE, stubNaN);
      expect(method([1, Number.NaN, 3], largeArray)).toEqual([1, 3]);
    });
  },
  (method: typeof difference) => {
    it(`should work with large arrays of objects`, () => {
      const object1 = {};
      const object2 = {};
      const largeArray = times(LARGE_ARRAY_SIZE, constant(object1));

      expect(method([object1, object2], largeArray)).toEqual([object2]);
    });
  },
  (method: typeof difference) => {
    it(`should ignore values that are not array-like`, () => {
      const array = [1, null, 3];

      // @ts-expect-error allow for test
      expect(method(_arguments, 3, { 0: 1 })).toEqual([1, 2, 3]);
      expect(method(null, array)).toEqual([]);
      expect(method(array, _arguments)).toEqual([null]);
    });
  },
];

describe("difference", () => {
  describe("lodash", () => {
    each(testCases, (testCase) => {
      testCase(difference);
    });
  });

  describe("es-toolkit", () => {
    each(testCases, (testCase) => {
      testCase(esToolkitDifference);
    });
  });

  describe("Remeda", () => {
    each(testCases, (testCase) => {
      testCase(remedaDifference);
    });
  });

  describe("You Might Not Need Lodash", () => {
    each(testCases, (testCase) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      testCase(youMightNotNeedLodashDifference);
    });
  });
});
