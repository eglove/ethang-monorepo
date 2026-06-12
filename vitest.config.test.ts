import isArray from "lodash/isArray.js";
import { expect, it } from "vitest";

import config from "./vitest.config";

it("should have correct project configurations", () => {
  expect(config).toBeDefined();
  expect(config.test).toBeDefined();
  expect(config.test?.projects).toBeDefined();
  expect(isArray(config.test?.projects)).toBe(true);
  expect(config.test?.projects).toContain("apps/*/vitest.config.{ts,mts}");
  expect(config.test?.projects).toContain("packages/*/vitest.config.ts");
});
