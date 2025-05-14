import { get as esToolkitGet } from "es-toolkit/compat";
import each from "lodash/each.js";
import get from "lodash/get.js";
import map from "lodash/map.js";
import { describe, expect, it } from "vitest";

import { empties } from "./utilities.js";
import { get as youMightNotNeedLodashGet } from "./you-might-not-need-lodash.ts";

const testCases = [
  (method: typeof get) => {
    it("should get string keyed property values", () => {
      const object = { a: 1 };

      each(["a", ["a"]], (path) => {
        expect(method(object, path)).toBe(1);
      });
    });
  },
  (method: typeof get) => {
    it("should preserve the sign of 0", () => {
      const object = { "-0": "a", 0: "b" };
      const properties = [-0, new Object(-0), 0, new Object(0)];

      const actual = map(properties, (key) => {
        // @ts-expect-error allow
        return method(object, key);
      });

      expect(actual).toEqual(["a", "a", "b", "b"]);
    });
  },
  (method: typeof get) => {
    it("should get symbol keyed property values", () => {
      const symbol = Symbol("a");
      const object: Record<symbol, number> = {
        [symbol]: 1,
      };

      expect(method(object, symbol)).toBe(1);
    });
  },
  (method: typeof get) => {
    it("should get deep property values", () => {
      const object = { a: { b: 2 } };

      each(["a.b", ["a", "b"]], (path) => {
        expect(method(object, path)).toBe(2);
      });
    });
  },
  (method: typeof get) => {
    it("should get a key over a path", () => {
      const object = { a: { b: { c: 4 } }, "a,b,c": 3 };

      expect(method(object, ["a", "b", "c"])).toBe(4);
    });
  },
  (method: typeof get) => {
    it("should not coerce array paths to strings", () => {
      const object = { a: { b: { c: 4 } }, "a,b,c": 3 };

      expect(method(object, ["a", "b", "c"])).toBe(4);
    });
  },
  (method: typeof get) => {
    it("should not ignore empty brackets", () => {
      const object = { a: { "": 1 } };

      expect(method(object, "a[]")).toBe(1);
    });
  },
  (method: typeof get) => {
    it("should handle empty paths", () => {
      each(
        [
          ["", ""],
          [[], [""]],
        ],
        (pair) => {
          // @ts-expect-error ignore for test
          expect(method({}, pair[0])).toBe(undefined);
          // @ts-expect-error ignore for test
          expect(method({ "": 3 }, pair[1])).toBe(3);
        },
      );
    });
  },
  (method: typeof get) => {
    it("should handle complex paths", () => {
      const object = {
        a: {
          "-1.23": {
            '["b"]': { c: { "['d']": { "\ne\n": { f: { g: 8 } } } } },
          },
        },
      };

      const paths = [
        "a[-1.23][\"[\\\"b\\\"]\"].c['[\\'d\\']'][\ne\n][f].g",
        ["a", "-1.23", '["b"]', "c", "['d']", "\ne\n", "f", "g"],
      ];

      each(paths, (path) => {
        expect(method(object, path)).toBe(8);
      });
    });
  },
  (method: typeof get) => {
    it("should return undefined when object is nullish", () => {
      each(["constructor", ["constructor"]], (path) => {
        // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
        expect(method(null, path)).toBe(undefined);
        // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
        expect(method(undefined, path)).toBe(undefined);
      });
    });
  },
  (method: typeof get) => {
    it("should return undefined if parts of path are missing", () => {
      // eslint-disable-next-line no-sparse-arrays
      const object = { a: [, null] };

      each(["a[1].b.c", ["a", "1", "b", "c"]], (path) => {
        expect(method(object, path)).toBe(undefined);
      });
    });
  },
  (method: typeof get) => {
    it("should be able to return null values", () => {
      const object = { a: { b: null } };

      each(["a.b", ["a", "b"]], (path) => {
        expect(method(object, path)).toBe(null);
      });
    });
  },
  (method: typeof get) => {
    it("should follow path over non-plain objects", () => {
      const paths = ["a.b", ["a", "b"]];
      const numberProto = Number.prototype;

      each(paths, (path) => {
        // @ts-expect-error ignore for test
        numberProto.a = { b: 2 };
        expect(method(0, path)).toBe(2);
        // @ts-expect-error ignore for test
        delete numberProto.a;
      });
    });
  },
  (method: typeof get) => {
    it("should return the default value of undefined values", () => {
      const object = { a: {} };
      const values = [...empties, true, new Date(), 1, /x/u, "a"];
      const expected = map(values, (value) => [value, value]);

      each(["a.b", ["a", "b"]], (path) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        const actual = map(values, (value) => [
          method(object, path, value),
          method(null, path, value),
        ]);

        expect(actual).toEqual(expected);
      });
    });
  },
  (method: typeof get) => {
    it("should return the default value when path is empty", () => {
      expect(method({}, [], "a")).toBe("a");
    });
  },
];

describe("get", () => {
  describe("lodash", () => {
    each(testCases, (testCase) => {
      testCase(get);
    });
  });

  describe("es-toolkit", () => {
    each(testCases, (testCase) => {
      testCase(esToolkitGet);
    });
  });

  describe("You Might Not Need Lodash", () => {
    each(testCases, (testCase) => {
      // @ts-expect-error ignore types
      testCase(youMightNotNeedLodashGet);
    });
  });
});
