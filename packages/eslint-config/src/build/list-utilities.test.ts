import every from "lodash/every.js";
import { describe, expect, it } from "vitest";

import type { RuleConfig } from "./rule-list.ts";

import {
  getList,
  getListJson,
  getListPlugins,
  getTypeFiles,
  getTypeImportStrings,
  getTypeLanguage,
} from "./list-utilities.ts";

describe("list-utilities", () => {
  describe("getList", () => {
    it("should return a filtered and sorted list by type", () => {
      const coreList = getList("core");
      expect(coreList.length).toBeGreaterThan(0);
      expect(every(coreList, (item) => "core" === item.type)).toBe(true);

      // Check sorting (by order)
      for (let index = 0; index < coreList.length - 1; index += 1) {
        expect(coreList[index]?.order ?? 0).toBeLessThanOrEqual(
          coreList[index + 1]?.order ?? 0,
        );
      }
    });

    it("should return empty array for unknown type", () => {
      expect(getList("non-existent")).toEqual([]);
    });
  });

  describe("getTypeImportStrings", () => {
    it("should return import strings for a given type", () => {
      const coreImports = getTypeImportStrings("core");
      expect(coreImports).toContain(
        'import tseslint from "typescript-eslint";',
      );
      expect(coreImports).not.toContain(undefined);
    });
  });

  describe("getListJson", () => {
    it("should return a stringified version of rules in the list", () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const mockList = [
        { list: { rule1: "error" } },
        { list: { rule2: "warn" } },
      ] as unknown as RuleConfig[];
      const result = getListJson(mockList);
      expect(result).toBe('"rule1":"error","rule2":"warn"');
    });
  });

  describe("getTypeLanguage", () => {
    it("should return correct language for known types", () => {
      expect(getTypeLanguage("css")).toBe("css/css");
      expect(getTypeLanguage("html")).toBe("html/html");
      expect(getTypeLanguage("json")).toBe("json/json");
      expect(getTypeLanguage("json5")).toBe("json/json5");
      expect(getTypeLanguage("jsonc")).toBe("json/jsonc");
    });

    it("should return null for unknown types", () => {
      expect(getTypeLanguage("core")).toBeNull();
    });
  });

  describe("getTypeFiles", () => {
    it("should return correct file patterns", () => {
      expect(getTypeFiles("angular")).toBe("**/*.ts");
      expect(getTypeFiles("angular:template")).toBe("**/*.html");
      expect(getTypeFiles("astro")).toBe("**/*.{astro}");
      expect(getTypeFiles("react")).toBe("**/*.{jsx,tsx}");
      expect(getTypeFiles("solid")).toBe("**/*.{jsx,tsx}");
      expect(getTypeFiles("core")).toBe("**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}");
      expect(getTypeFiles("tailwind")).toBe(
        "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
      );
      expect(getTypeFiles("css")).toBe("**/*.css");
      expect(getTypeFiles("html")).toBe("**/*.html");
      expect(getTypeFiles("json")).toBe("**/*.json");
      expect(getTypeFiles("json5")).toBe("**/*.json5");
      expect(getTypeFiles("jsonc")).toBe("**/*.jsonc");
      expect(getTypeFiles("markdown")).toBe("**/*.md");
      expect(getTypeFiles("storybook")).toBe(
        "**/*.stories.@(ts|tsx|js|jsx|mjs|cjs)",
      );
    });

    it("should return empty string for unknown type", () => {
      expect(getTypeFiles("unknown")).toBe("");
    });
  });

  describe("getListPlugins", () => {
    it("should return formatted plugin string", () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const mockList = [
        { pluginName: "p1", pluginValue: "v1" },
        { pluginName: "p2", pluginValue: "v2" },
        { pluginName: "p3", pluginValue: null },
      ] as RuleConfig[];
      const result = getListPlugins(mockList);
      expect(result).toBe('"p1": v1,"p2": v2,');
    });
  });
});
