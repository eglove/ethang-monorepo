import each from "lodash/each.js";
import { describe } from "vitest";

export type Library = {
  library: string;
  method: (properties: unknown) => void;
};

export type TestCases = TestMethod[];
type TestMethod = (...properties: unknown[]) => void;

export const runTests = (
  methodName: string,
  libraries: Library[],
  testCases: TestCases,
) => {
  describe(methodName, () => {
    each(libraries, ({ library, method }) => {
      describe(library, () => {
        // eslint-disable-next-line sonar/no-nested-functions
        each(testCases, (testCase) => {
          testCase(method);
        });
      });
    });
  });
};
