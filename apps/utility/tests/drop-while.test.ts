import { dropWhile as esToolkitDropWhile } from "es-toolkit/array";
import dropWhile from "lodash/dropWhile.js";
import { dropWhile as remedaDropWhile } from "remeda";
import { expect, it } from "vitest";

import { runTests } from "./run-tests.js";
import { slice } from "./utilities.ts";

const array = [1, 2, 3, 4];

const objects = [
  { a: 2, b: 2 },
  { a: 1, b: 1 },
  { a: 0, b: 0 },
];

const testCases = [
  (method: typeof dropWhile) => {
    it("should drop elements while `predicate` returns truthy", () => {
      const actual = method(array, (n) => 3 > n);

      expect(actual).toEqual([3, 4]);
    });
  },
  (method: typeof dropWhile) => {
    it("should provide correct `predicate` arguments", () => {
      let _arguments;

      method(array, function () {
        // eslint-disable-next-line sonar/arguments-usage,prefer-rest-params
        _arguments = slice.call(arguments);
      });

      expect(_arguments).toEqual([1, 0, array]);
    });
  },
  (method: typeof dropWhile) => {
    it("should work with `_.matches` shorthands", () => {
      expect(method(objects, { b: 2 })).toEqual(objects.slice(1));
    });
  },
  (method: typeof dropWhile) => {
    it("should work with `_.matchesProperty` shorthands", () => {
      expect(method(objects, ["b", 2])).toEqual(objects.slice(1));
    });
  },
  (method: typeof dropWhile) => {
    it("should work with `_.property` shorthands", () => {
      expect(method(objects, "b")).toEqual(objects.slice(2));
    });
  },
];

const libraries = [
  { library: "lodash", method: dropWhile },
  { library: "es-toolkit", method: esToolkitDropWhile },
  { library: "Remeda", method: remedaDropWhile },
];

runTests("dropWhile", libraries, testCases);
