import keys from "lodash/keys.js";
import { describe, expect, it } from "vitest";

import { genRules, getNonDeprecatedRules } from "./gen-rules.ts";

describe("gen-rules", () => {
  describe("getNonDeprecatedRules", () => {
    it("should filter out deprecated rules", () => {
      const mockRules = {
        rule1: { meta: { deprecated: false } },
        rule2: { meta: { deprecated: true } },
        rule3: { meta: {} },
      };
      const result = getNonDeprecatedRules(mockRules);
      expect(result).toHaveProperty("rule1");
      expect(result).not.toHaveProperty("rule2");
      expect(result).toHaveProperty("rule3");
    });
  });

  describe("genRules", () => {
    it("should generate rules with prefix and default override", () => {
      const ruleNames = ["rule1", "rule2"];
      const result = genRules(ruleNames, undefined, "my-plugin", "warn");
      expect(result).toEqual({
        "my-plugin/rule1": "warn",
        "my-plugin/rule2": "warn",
      });
    });

    it("should include custom rules", () => {
      const ruleNames = ["rule1", "rule2"];
      const customRules = [
        { name: "rule1", rule: ["error", { option: true }] },
      ];
      const result = genRules(ruleNames, customRules, "prefix");
      expect(result["prefix/rule1"]).toEqual(["error", { option: true }]);
      expect(result["prefix/rule2"]).toBe("error");
    });

    it("should generate rules without prefix", () => {
      const ruleNames = ["rule1"];
      const result = genRules(ruleNames);
      expect(result).toHaveProperty("rule1");
    });

    it("should generate rules without prefix and with custom rules", () => {
      const ruleNames = ["rule1"];
      const customRules = [{ name: "rule1", rule: "warn" }];
      const result = genRules(ruleNames, customRules);
      expect(result["rule1"]).toBe("warn");
    });

    it("should handle defaultOverride as null (falls back to error)", () => {
      const ruleNames = ["rule1"];
      // @ts-expect-error testing null
      const result = genRules(ruleNames, undefined, undefined, null);
      expect(result["rule1"]).toBe("error");
    });

    it("should handle defaultOverride as null with prefix", () => {
      const ruleNames = ["rule1"];
      // @ts-expect-error testing null
      const result = genRules(ruleNames, undefined, "p", null);
      expect(result["p/rule1"]).toBe("error");
    });

    it("should throw error when prefix is undefined in custom rules", () => {
      const ruleNames = ["rule1"];
      const customRules = [{ name: "non-existent", rule: "error" }];
      expect(() => genRules(ruleNames, customRules)).toThrow(
        "non-existent in (unknown prefix) does not exist.",
      );
    });

    it("should throw error if custom rule does not exist in ruleNames", () => {
      const ruleNames = ["rule1"];
      const customRules = [{ name: "non-existent", rule: "error" }];
      expect(() => genRules(ruleNames, customRules, "p")).toThrow(
        "non-existent in p does not exist.",
      );
    });

    it("should return sorted rules", () => {
      const ruleNames = ["b", "a", "c"];
      const result = genRules(ruleNames);
      const ruleKeys = keys(result);
      expect(ruleKeys).toEqual(["a", "b", "c"]);
    });
  });
});
