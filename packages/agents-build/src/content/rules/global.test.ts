import { generateMarkdown } from "@ethang/markdown-generator/markdown-generator.js";
import isArray from "lodash/isArray.js";
import isString from "lodash/isString.js";
import startsWith from "lodash/startsWith.js";
import trim from "lodash/trim.js";
import { describe, expect, it } from "vitest";

import { GLOBAL_RULES } from "./global.ts";

describe("GLOBAL_RULES schema verification", () => {
  it("should have GLOBAL_RULES defined as an array", () => {
    expect(isArray(GLOBAL_RULES)).toBe(true);
  });

  it.each(GLOBAL_RULES)(
    "verifies schema and structure for rule: $filename",
    (rule) => {
      // 1. Filename must be defined and kebab-case format
      expect(rule.filename).toBeDefined();
      expect(typeof rule.filename).toBe("string");
      expect(rule.filename.length).toBeGreaterThan(0);
      expect(rule.filename).toMatch(/^[a-z0-9-]+$/u);

      // 2. Trigger must be valid
      expect(["always_on", "model_decision"]).toContain(rule.trigger);

      // 3. Description must be non-empty string when trigger is "model_decision"
      if ("model_decision" === rule.trigger) {
        expect(rule.description).toBeDefined();
        expect(isString(rule.description)).toBe(true);
        expect(rule.description?.length).toBeGreaterThan(0);
      }

      // 4. Content must be non-empty and start with Markdown title
      expect(rule.content).toBeDefined();
      const contentString = isString(rule.content)
        ? rule.content
        : generateMarkdown({ blocks: rule.content });

      expect(contentString.length).toBeGreaterThan(0);
      expect(startsWith(trim(contentString), "#")).toBe(true);
    }
  );
});
