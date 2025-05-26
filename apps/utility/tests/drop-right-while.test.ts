import { dropRightWhile as esToolkitDropRightWhile } from "es-toolkit/array";
import dropRightWhile from "lodash/dropRightWhile.js";
import { dropLastWhile as remedaDropRightWhile } from "remeda";
import { expect, it } from "vitest";

import { runTests } from "./run-tests.js";
import { slice } from "./utilities.js";

const array = [1, 2, 3, 4];

const objects = [
  { a: 0, b: 0 },
  { a: 1, b: 1 },
  { a: 2, b: 2 },
];

const testCases = [
  (method: typeof dropRightWhile) => {
    it("should drop elements while `predicate` returns truthy", () => {
      const actual = method(array, (n) => 2 < n);

      expect(actual).toEqual([1, 2]);
    });
  },
  (method: typeof dropRightWhile) => {
    it("should provide correct `predicate` arguments", () => {
      let _arguments;

      method(array, function () {
        // eslint-disable-next-line prefer-rest-params,sonar/arguments-usage
        _arguments = slice.call(arguments);
      });

      expect(_arguments).toEqual([4, 3, array]);
    });
  },
  (method: typeof dropRightWhile) => {
    it("should work with `_.matches` shorthands", () => {
      expect(method(objects, { b: 2 })).toEqual(objects.slice(0, 2));
    });
  },
  (method: typeof dropRightWhile) => {
    it("should work with `_.matchesProperty` shorthands", () => {
      expect(method(objects, ["b", 2])).toEqual(objects.slice(0, 2));
    });
  },
  (method: typeof dropRightWhile) => {
    it("should work with `_.property` shorthands", () => {
      expect(method(objects, "b")).toEqual(objects.slice(0, 1));
    });
  },
];

const libraries = [
  { library: "lodash", method: dropRightWhile },
  { library: "es-toolkit", method: esToolkitDropRightWhile },
  { library: "Remeda", method: remedaDropRightWhile },
];

runTests("dropRightWhile", libraries, testCases);
