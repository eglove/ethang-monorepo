import { differenceWith as esToolkitDifferenceWith } from "es-toolkit/array";
import constant from "lodash/constant.js";
import differenceWith from "lodash/differenceWith.js";
import eq from "lodash/eq.js";
import isEqual from "lodash/isEqual.js";
import map from "lodash/map.js";
import times from "lodash/times.js";
import convertToString from "lodash/toString.js";
import { differenceWith as remedaDifferenceWith } from "remeda";
import { expect, it } from "vitest";

import { runTests } from "./run-tests.ts";
import { LARGE_ARRAY_SIZE, stubOne } from "./utilities.ts";

const testCases = [
  (method: typeof differenceWith) => {
    it("should work with a `comparator`", () => {
      const objects = [
        { x: 1, y: 2 },
        { x: 2, y: 1 },
      ];
      const actual = method(objects, [{ x: 1, y: 2 }], isEqual);

      expect(actual).toEqual([objects[1]]);
    });
  },
  (method: typeof differenceWith) => {
    it("should preserve the sign of `0`", () => {
      const array = [-0, 1];
      const largeArray = times(LARGE_ARRAY_SIZE, stubOne);
      const others = [[1], largeArray];
      const expected = map(others, constant(["-0"]));

      const actual = map(others, (other) =>
        map(method(array, other, eq), convertToString),
      );

      expect(actual).toEqual(expected);
    });
  },
];

const libraries = [
  { library: "lodash", method: differenceWith },
  { library: "es-toolkit", method: esToolkitDifferenceWith },
  { library: "remeda", method: remedaDifferenceWith },
];

// @ts-expect-error allow
runTests("differenceWith", libraries, testCases);
