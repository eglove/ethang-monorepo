import { differenceBy as esToolkitDifferenceBy } from "es-toolkit/array";
import differenceBy from "lodash/differenceBy.js";
import { expect, it } from "vitest";

import { runTests } from "./run-tests.ts";
import { slice } from "./utilities.ts";
import { differenceBy as youMightNotNeedLodashDifferenceBy } from "./you-might-not-need-lodash.ts";

const testCases = [
  (method: typeof differenceBy) => {
    it("should accept an `iteratee`", () => {
      let actual = method([2.1, 1.2], [2.3, 3.4], Math.floor);
      expect(actual).toEqual([1.2]);

      // @ts-expect-error accept for test
      actual = method([{ x: 2 }, { x: 1 }], [{ x: 1 }], "x");
      expect(actual).toEqual([{ x: 2 }]);
    });
  },
  (method: typeof differenceBy) => {
    it("should provide correct `iteratee` arguments", () => {
      let _arguments;

      method([2.1, 1.2], [2.3, 3.4], function () {
        // eslint-disable-next-line sonar/arguments-usage,prefer-rest-params
        _arguments ||= slice.call(arguments);
      });

      expect(_arguments).toEqual([2.3]);
    });
  },
];

const libraries = [
  { library: "lodash", method: differenceBy },
  {
    library: "es-toolkit",
    method: esToolkitDifferenceBy,
  },
  {
    library: "You Might Not Need Lodash",
    method: youMightNotNeedLodashDifferenceBy,
  },
];

// @ts-expect-error allow
runTests("differenceBy", libraries, testCases);
