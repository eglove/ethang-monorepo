import keys from "lodash/keys.js";
import { describe, expect, it } from "vitest";

import { OutputConfig } from "./output-config.ts";
import { Plugin } from "./plugin.ts";

const TEST_FILE_NAME = "config.test.js";

const makePlugin = (files: string, rules: Record<string, string> = {}) => {
  return new Plugin({ files, name: "test", rules, url: "https://example.com" });
};

describe(OutputConfig, () => {
  it("stores all provided options as readonly properties", () => {
    const plugin = makePlugin("**/*.ts");
    const readmeImport = `import testConfig from "@ethang/eslint-config/${TEST_FILE_NAME}";`;
    const config = new OutputConfig({
      extraConfigEntries: ["extra: true,"],
      extraImports: ['import foo from "foo";'],
      fileName: TEST_FILE_NAME,
      functionParameters: "/** @type {string} */ path",
      globalIgnores: ["**/*.spec.ts"],
      includeIgnores: true,
      includeLanguageOptions: true,
      includeReactVersion: true,
      plugins: [plugin],
      readmeImport,
      readmeLabel: "Test",
    });

    expect(config.fileName).toBe(TEST_FILE_NAME);
    expect(config.plugins).toHaveLength(1);
    expect(config.includeIgnores).toBe(true);
    expect(config.includeLanguageOptions).toBe(true);
    expect(config.extraConfigEntries).toEqual(["extra: true,"]);
    expect(config.extraImports).toEqual(['import foo from "foo";']);
    expect(config.functionParameters).toBe("/** @type {string} */ path");
    expect(config.globalIgnores).toEqual(["**/*.spec.ts"]);
    expect(config.includeReactVersion).toBe(true);
    expect(config.readmeImport).toBe(readmeImport);
    expect(config.readmeLabel).toBe("Test");
  });

  describe("ruleCount", () => {
    it("returns sum of all plugin ruleCounts", () => {
      const p1 = makePlugin("**/*.ts", { "rule-a": "error", "rule-b": "off" });
      const p2 = makePlugin("**/*.ts", { "rule-c": "warn" });
      const config = new OutputConfig({
        fileName: TEST_FILE_NAME,
        plugins: [p1, p2],
      });

      expect(config.ruleCount).toBe(2);
    });
  });

  describe("pluginsByFiles", () => {
    it("groups plugins by files value", () => {
      const ts1 = makePlugin("**/*.ts", { "rule-a": "error" });
      const ts2 = makePlugin("**/*.ts", { "rule-b": "warn" });
      const md = makePlugin("**/*.md", { "rule-c": "error" });
      const config = new OutputConfig({
        fileName: TEST_FILE_NAME,
        plugins: [ts1, ts2, md],
      });

      expect(keys(config.pluginsByFiles)).toHaveLength(2);
      expect(config.pluginsByFiles["**/*.ts"]).toHaveLength(2);
      expect(config.pluginsByFiles["**/*.md"]).toHaveLength(1);
    });
  });
});
