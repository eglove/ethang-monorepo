import { fill as esToolkitFill } from "es-toolkit/array";
// eslint-disable-next-line lodash/import-scope
import lodash from "lodash";
import constant from "lodash/constant.js";
import each from "lodash/each.js";
import every from "lodash/every.js";
import fill from "lodash/fill.js";
import map from "lodash/map.js";
import { assert, expect, it } from "vitest";

import { runTests } from "./run-tests.js";
import { falsy } from "./utilities.js";
import { fill as youMightNotNeedLodashFill } from "./you-might-not-need-lodash.ts";

const testCases = [
  (method: typeof fill) => {
    it("should use a default `start` of `0` and a default `end` of `length`", () => {
      const array = [1, 2, 3];
      expect(method(array, "a")).toEqual(["a", "a", "a"]);
    });
  },
  (method: typeof fill) => {
    it("should use `undefined` for `value` if not given", () => {
      const array = [1, 2, 3];
      // @ts-expect-error allow
      const actual = method(array);

      expect(actual).toEqual(Array.from({ length: 3 }));
      expect(every(actual, (_, index) => index in actual)).toBe(true);
    });
  },
  (method: typeof fill) => {
    it("should work with a positive `start`", () => {
      const array = [1, 2, 3];
      expect(method(array, "a", 1)).toEqual([1, "a", "a"]);
    });
  },
  (method: typeof fill) => {
    it("should work with a `start` >= `length`", () => {
      each([3, 4, 2 ** 32, Infinity], (start) => {
        const array = [1, 2, 3];
        expect(method(array, "a", start)).toEqual([1, 2, 3]);
      });
    });
  },
  (method: typeof fill) => {
    it("should treat falsy `start` values as `0`", () => {
      const expected = map(falsy, constant(["a", "a", "a"]));

      const actual = map(falsy, (start) => {
        const array = [1, 2, 3];
        // @ts-expect-error allow
        return method(array, "a", start);
      });

      expect(actual).toEqual(expected);
    });
  },
  (method: typeof fill) => {
    it("should work with a negative `start`", () => {
      const array = [1, 2, 3];
      expect(method(array, "a", -1)).toEqual([1, 2, "a"]);
    });
  },
  (method: typeof fill) => {
    it("should work with a negative `start` <= negative `length`", () => {
      each([-3, -4, -Infinity], (start) => {
        const array = [1, 2, 3];
        expect(method(array, "a", start)).toEqual(["a", "a", "a"]);
      });
    });
  },
  (method: typeof fill) => {
    it("should work with `start` >= `end`", () => {
      each([2, 3], (start) => {
        const array = [1, 2, 3];
        expect(method(array, "a", start, 2)).toEqual([1, 2, 3]);
      });
    });
  },
  (method: typeof fill) => {
    it("should work with a positive `end`", () => {
      const array = [1, 2, 3];
      expect(method(array, "a", 0, 1)).toEqual(["a", 2, 3]);
    });
  },
  (method: typeof fill) => {
    it("should work with a `end` >= `length`", () => {
      each([3, 4, 2 ** 32, Infinity], (end) => {
        const array = [1, 2, 3];
        expect(method(array, "a", 0, end)).toEqual(["a", "a", "a"]);
      });
    });
  },
  (method: typeof fill) => {
    it("should treat falsy `end` values, except `undefined`, as `0`", () => {
      const expected = map(falsy, (value) =>
        value === undefined ? ["a", "a", "a"] : [1, 2, 3],
      );

      const actual = map(falsy, (end) => {
        const array = [1, 2, 3];
        // @ts-expect-error allow
        return method(array, "a", 0, end);
      });

      expect(actual).toEqual(expected);
    });
  },
  (method: typeof fill) => {
    it("should work with a negative `end`", () => {
      const array = [1, 2, 3];
      expect(method(array, "a", 0, -1)).toEqual(["a", "a", 3]);
    });
  },
  (method: typeof fill) => {
    it("should work with a negative `end` <= negative `length`", () => {
      each([-3, -4, -Infinity], (end) => {
        const array = [1, 2, 3];
        expect(method(array, "a", 0, end)).toEqual([1, 2, 3]);
      });
    });
  },
  (method: typeof fill) => {
    // eslint-disable-next-line sonar/assertions-in-tests
    it("should coerce `start` and `end` to integers", () => {
      const positions = [
        [0.1, 1.6],
        ["0", 1],
        [0, "1"],
        ["1"],
        [Number.NaN, 1],
        [1, Number.NaN],
      ];

      const actual = map(positions, (pos) => {
        const array = [1, 2, 3];
        // @ts-expect-error allow
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return,unicorn/prefer-spread
        return method.apply(lodash, [array, "a"].concat(pos));
      });

      assert.deepStrictEqual(actual, [
        ["a", 2, 3],
        ["a", 2, 3],
        ["a", 2, 3],
        [1, "a", "a"],
        ["a", 2, 3],
        [1, 2, 3],
      ]);
    });
  },
  (method: typeof fill) => {
    // eslint-disable-next-line sonar/assertions-in-tests
    it("should work as an iteratee for methods like `_.map`", () => {
      const array = [
        [1, 2],
        [3, 4],
      ];
      const actual = map(array, method);

      assert.deepStrictEqual(actual, [
        [0, 0],
        [1, 1],
      ]);
    });
  },
];

const libraries = [
  { library: "lodash", method: fill },
  { library: "es-toolkit", method: esToolkitFill },
  { library: "You Might Not Need Lodash", method: youMightNotNeedLodashFill },
];

// @ts-expect-error allow
runTests("fill", libraries, testCases);
