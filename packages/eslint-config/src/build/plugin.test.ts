import { describe, expect, it } from "vitest";

import { Plugin } from "./plugin.ts";

const base = {
  files: "**/*.ts",
  name: "test-plugin",
  rules: {},
  url: "https://example.com",
};

describe(Plugin, () => {
  it("stores all provided options as readonly properties", () => {
    const plugin = new Plugin({
      ...base,
      importString: 'import foo from "foo";',
      order: 3,
      pluginName: "foo",
      pluginValue: "foo",
    });

    expect(plugin.name).toBe("test-plugin");
    expect(plugin.files).toBe("**/*.ts");
    expect(plugin.importString).toBe('import foo from "foo";');
    expect(plugin.pluginName).toBe("foo");
    expect(plugin.order).toBe(3);
  });

  describe("ruleCount", () => {
    it("returns 0 for empty rules", () => {
      expect(new Plugin({ ...base, rules: {} }).ruleCount).toBe(0);
    });

    it("counts only non-off rules", () => {
      const plugin = new Plugin({
        ...base,
        rules: { "rule-a": "error", "rule-b": "warn", "rule-c": "off" },
      });

      expect(plugin.ruleCount).toBe(2);
    });

    it("counts rules with array config as non-off", () => {
      const plugin = new Plugin({
        ...base,
        rules: { "rule-a": ["error", { option: true }], "rule-b": "off" },
      });

      expect(plugin.ruleCount).toBe(1);
    });

    it("does not count array-config off rules", () => {
      const plugin = new Plugin({
        ...base,
        rules: { "rule-a": ["off", { option: true }], "rule-b": "error" },
      });

      expect(plugin.ruleCount).toBe(1);
    });
  });
});
