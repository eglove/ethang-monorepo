import { compact as esToolkitCompact } from "es-toolkit/array";
import compact from "lodash/compact.js";
import { expect, it } from "vitest";

import { runTests } from "./run-tests.js";
import { falsy } from "./utilities.js";
import { compact as youMightNotNeedLodashCompact } from "./you-might-not-need-lodash.ts";

const testCases = [
  (method: typeof compact) => {
    it("should filter falsy values", () => {
      const array = ["0", "1", "2"];

      expect(method([...falsy, ...array])).toStrictEqual(array);
    });
  },
];

const libraries = [
  { library: "lodash", method: compact },
  { library: "es-toolkit", method: esToolkitCompact },
  {
    library: "You Might Not Need Lodash",
    method: youMightNotNeedLodashCompact,
  },
];

runTests("compact", libraries, testCases);
