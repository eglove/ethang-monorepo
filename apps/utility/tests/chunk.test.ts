import { chunk as esToolkitChunk } from "es-toolkit/array";
import chunk from "lodash/chunk.js";
import each from "lodash/each.js";
import isUndefined from "lodash/isUndefined.js";
import map from "lodash/map.js";
import reject from "lodash/reject.js";
import { chunk as remedaChunk } from "remeda";
import { describe, expect, it } from "vitest";

import { falsy, stubArray } from "./utilities.js";

const array = [0, 1, 2, 3, 4, 5];

const testCases = [
  (method: typeof chunk) => {
    it("should return chunked arrays", () => {
      const actual = method(array, 3);
      expect(actual).toEqual([
        [0, 1, 2],
        [3, 4, 5],
      ]);
    });
  },
  (method: typeof chunk) => {
    it("should return the last chunk as remaining elements", () => {
      const actual = method(array, 4);
      expect(actual).toEqual([
        [0, 1, 2, 3],
        [4, 5],
      ]);
    });
  },
  (method: typeof chunk) => {
    it("should treat falsy `size` values, except `undefined`, as `0`", () => {
      const expected = map(falsy, (value) =>
        value === undefined ? [[0], [1], [2], [3], [4], [5]] : [],
      );

      const actual = map(falsy, (size, index) =>
        // @ts-expect-error ignore for test
        index ? method(array, size) : method(array),
      );

      expect(actual).toEqual(expected);
    });
  },
  (method: typeof chunk) => {
    it("should ensure the minimum `size` is `0`", () => {
      const values = [...reject(falsy, isUndefined), -1, -Infinity];
      const expected = map(values, stubArray);

      // @ts-expect-error ignore for test
      const actual = map(values, (n) => method(array, n));

      expect(actual).toEqual(expected);
    });
  },
  (method: typeof chunk) => {
    it("should coerce `size` to an integer", () => {
      expect(method(array, array.length / 4)).toEqual([
        [0],
        [1],
        [2],
        [3],
        [4],
        [5],
      ]);
    });
  },
];

describe("chunk", () => {
  describe("lodash", () => {
    each(testCases, (testCase) => {
      testCase(chunk);
    });
  });

  describe("es-toolkit", () => {
    each(testCases, (testCase) => {
      testCase(esToolkitChunk);
    });
  });

  describe("Remeda", () => {
    each(testCases, (testCase) => {
      testCase(remedaChunk);
    });
  });
});
