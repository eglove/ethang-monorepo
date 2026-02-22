import filter from "lodash/filter.js";
import keys from "lodash/keys.js";
import { describe, expect, it } from "vitest";

import { sonarRules } from "./sonar.ts";

describe("sonar rules", () => {
  it("should have sonar rules", () => {
    expect(keys(sonarRules).length).toBeGreaterThan(0);
  });

  it("should turn off S rules", () => {
    const sRules = filter(keys(sonarRules), (key) => /^sonar\/S\d+/u.test(key));

    for (const key of sRules) {
      expect(sonarRules[key]).toBe("off");
    }
  });
});
