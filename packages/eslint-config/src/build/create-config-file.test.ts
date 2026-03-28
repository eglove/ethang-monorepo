import { writeFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createConfigFile } from "./create-config-file.ts";
import { OutputConfig } from "./output-config.ts";
import { Plugin } from "./plugin.ts";

vi.mock(import("node:fs"));
vi.mock(import("./get-react-version.ts"), () => ({
  getLatestReact: vi.fn().mockResolvedValue({ version: "19.0.0" }),
}));

const TEST_FILE_NAME = "config.test.js";
const TEST_PLUGIN_IMPORT = 'import testPlugin from "test-plugin";';

const makePlugin = (
  overrides: Partial<ConstructorParameters<typeof Plugin>[0]> = {},
) => {
  return new Plugin({
    files: "**/*.ts",
    importString: TEST_PLUGIN_IMPORT,
    name: "test-plugin",
    pluginName: "test",
    pluginValue: "testPlugin",
    rules: { "test-rule": "error" },
    url: "https://example.com",
    ...overrides,
  });
};

const getMockCalls = () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return (writeFileSync as unknown as { mock: { calls: unknown[][] } }).mock
    .calls;
};

const getWrittenContent = () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return getMockCalls().at(-1)?.[1] as string;
};

const getWrittenPath = () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return getMockCalls().at(-1)?.[0] as string;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe(createConfigFile, () => {
  describe("file output", () => {
    it("writes to the correct path", async () => {
      const output = new OutputConfig({
        fileName: TEST_FILE_NAME,
        plugins: [makePlugin()],
      });

      await createConfigFile(output);

      const expectedPath = path.join(import.meta.dirname, "../config.test.js");
      expect(getWrittenPath()).toBe(expectedPath);
    });

    it("generates file with ts-nocheck header, imports, and defineConfig", async () => {
      const output = new OutputConfig({
        fileName: TEST_FILE_NAME,
        plugins: [makePlugin()],
      });

      await createConfigFile(output);

      const content = getWrittenContent();
      expect(content).toContain("// @ts-nocheck");
      expect(content).toContain(
        'import { defineConfig, globalIgnores } from "eslint/config";',
      );
      expect(content).toContain(TEST_PLUGIN_IMPORT);
      expect(content).toContain('files: ["**/*.ts"]');
      expect(content).toContain('"test": testPlugin');
      expect(content).toContain('"test-rule": "error"');
      expect(content).toContain("export default defineConfig(");
    });

    it("wraps output in a function when functionParameters is set", async () => {
      const output = new OutputConfig({
        fileName: TEST_FILE_NAME,
        functionParameters: "pathToConfig",
        plugins: [makePlugin()],
      });

      await createConfigFile(output);

      const content = getWrittenContent();
      expect(content).toContain("const config = (pathToConfig) => {");
      expect(content).toContain("export default config;");
      expect(content).not.toContain("export default defineConfig(");
    });

    it("appends extraConfigEntries and their imports", async () => {
      const output = new OutputConfig({
        extraConfigEntries: ["eslintConfigPrettier"],
        extraImports: [
          'import eslintConfigPrettier from "eslint-config-prettier";',
        ],
        fileName: TEST_FILE_NAME,
        plugins: [makePlugin()],
      });

      await createConfigFile(output);

      const content = getWrittenContent();
      expect(content).toContain("eslintConfigPrettier");
      expect(content).toContain(
        'import eslintConfigPrettier from "eslint-config-prettier";',
      );
    });
  });

  describe("plugin grouping", () => {
    it("merges plugins with same files into one config block", async () => {
      const p1 = makePlugin({
        importString: 'import p1 from "p1";',
        pluginName: "p1",
        pluginValue: "plugin1",
        rules: { "rule-a": "error" },
      });
      const p2 = makePlugin({
        importString: 'import p2 from "p2";',
        pluginName: "p2",
        pluginValue: "plugin2",
        rules: { "rule-b": "warn" },
      });
      const output = new OutputConfig({
        fileName: TEST_FILE_NAME,
        plugins: [p1, p2],
      });

      await createConfigFile(output);

      const content = getWrittenContent();
      const fileMatches = content.match(/files: \["\*\*\/\*\.ts"\]/gu);
      expect(fileMatches).toHaveLength(1);
      expect(content).toContain('"p1": plugin1');
      expect(content).toContain('"p2": plugin2');
      expect(content).toContain('"rule-a": "error"');
      expect(content).toContain('"rule-b": "warn"');
    });

    it("creates separate blocks for plugins with different files", async () => {
      const tsPlugin = makePlugin({ files: "**/*.ts" });
      const mdPlugin = makePlugin({
        files: "**/*.md",
        importString: 'import md from "md";',
        pluginName: "md",
        pluginValue: "markdown",
      });
      const output = new OutputConfig({
        fileName: TEST_FILE_NAME,
        plugins: [tsPlugin, mdPlugin],
      });

      await createConfigFile(output);

      const content = getWrittenContent();
      expect(content).toContain('files: ["**/*.ts"]');
      expect(content).toContain('files: ["**/*.md"]');
    });

    it("deduplicates imports that appear in multiple plugins", async () => {
      const p1 = makePlugin({
        importString:
          'import { fixupPluginRules } from "@eslint/compat";\nimport p1 from "p1";',
        pluginName: "p1",
        pluginValue: "fixupPluginRules(p1)",
      });
      const p2 = makePlugin({
        files: "**/*.md",
        importString:
          'import { fixupPluginRules } from "@eslint/compat";\nimport p2 from "p2";',
        pluginName: "p2",
        pluginValue: "fixupPluginRules(p2)",
      });
      const output = new OutputConfig({
        fileName: TEST_FILE_NAME,
        plugins: [p1, p2],
      });

      await createConfigFile(output);

      const content = getWrittenContent();
      const fixupMatches = content.match(
        /import \{ fixupPluginRules \} from "@eslint\/compat";/gu,
      );
      expect(fixupMatches).toHaveLength(1);
    });
  });
});

describe(`${createConfigFile.name} — ignore and language options`, () => {
  it("prepends globalIgnores(ignores) when includeIgnores is true", async () => {
    const output = new OutputConfig({
      fileName: TEST_FILE_NAME,
      includeIgnores: true,
      plugins: [makePlugin()],
    });

    await createConfigFile(output);

    const content = getWrittenContent();
    expect(content).toContain("globalIgnores(ignores)");
    expect(content).toContain("ignores");
  });

  it("prepends specific globalIgnores when globalIgnores is set", async () => {
    const output = new OutputConfig({
      fileName: TEST_FILE_NAME,
      globalIgnores: ["**/*.spec.ts"],
      plugins: [makePlugin()],
    });

    await createConfigFile(output);

    const content = getWrittenContent();
    expect(content).toContain('globalIgnores(["**/*.spec.ts"])');
  });

  it("adds languageOptions when includeLanguageOptions is true", async () => {
    const output = new OutputConfig({
      fileName: TEST_FILE_NAME,
      includeLanguageOptions: true,
      plugins: [makePlugin()],
    });

    await createConfigFile(output);

    expect(getWrittenContent()).toContain("languageOptions,");
  });

  it("uses angularLanguageOptions when plugin has includeAngularLanguageOptions", async () => {
    const output = new OutputConfig({
      fileName: TEST_FILE_NAME,
      plugins: [makePlugin({ includeAngularLanguageOptions: true })],
    });

    await createConfigFile(output);

    const content = getWrittenContent();
    expect(content).toContain("languageOptions: angularLanguageOptions,");
    expect(content).toContain(
      'import { angularLanguageOptions } from "./constants.js";',
    );
  });
});

describe(`${createConfigFile.name} — plugin-specific config block fields`, () => {
  it("includes react version settings when includeReactVersion is true", async () => {
    const output = new OutputConfig({
      fileName: TEST_FILE_NAME,
      includeReactVersion: true,
      plugins: [makePlugin()],
    });

    await createConfigFile(output);

    const content = getWrittenContent();
    expect(content).toContain("settings:");
    expect(content).toContain('"version":"19.0.0"');
  });

  it("adds language when plugin has language set", async () => {
    const output = new OutputConfig({
      fileName: TEST_FILE_NAME,
      plugins: [makePlugin({ files: "**/*.css", language: "css/css" })],
    });

    await createConfigFile(output);

    expect(getWrittenContent()).toContain('language: "css/css"');
  });

  it("adds processor when plugin has processor set", async () => {
    const output = new OutputConfig({
      fileName: TEST_FILE_NAME,
      plugins: [makePlugin({ processor: "angular.processInlineTemplates" })],
    });

    await createConfigFile(output);

    expect(getWrittenContent()).toContain(
      "processor: angular.processInlineTemplates,",
    );
  });

  it("handles auxiliaryImport for processor references", async () => {
    const output = new OutputConfig({
      fileName: TEST_FILE_NAME,
      plugins: [
        makePlugin({
          auxiliaryImport: 'import angular from "angular-eslint";',
          processor: "angular.processInlineTemplates",
        }),
      ],
    });

    await createConfigFile(output);

    expect(getWrittenContent()).toContain(
      'import angular from "angular-eslint";',
    );
  });

  it("includes extraOptions from plugins in config block", async () => {
    const output = new OutputConfig({
      fileName: "config.test.js",
      plugins: [
        makePlugin({
          extraOptions: "settings: { tailwindcss: { config: pathToConfig } },",
        }),
      ],
    });

    await createConfigFile(output);

    expect(getWrittenContent()).toContain(
      "settings: { tailwindcss: { config: pathToConfig } },",
    );
  });

  it("skips import line when plugin has no importString", async () => {
    const output = new OutputConfig({
      fileName: TEST_FILE_NAME,
      plugins: [makePlugin({ importString: undefined })],
    });

    await createConfigFile(output);

    const content = getWrittenContent();
    expect(content).toContain("// @ts-nocheck");
    expect(content).not.toContain(TEST_PLUGIN_IMPORT);
  });

  it("skips plugin entry when pluginName is not set", async () => {
    const output = new OutputConfig({
      fileName: TEST_FILE_NAME,
      plugins: [makePlugin({ pluginName: undefined, pluginValue: undefined })],
    });

    await createConfigFile(output);

    const content = getWrittenContent();
    expect(content).toContain("plugins:");
    expect(content).not.toContain('"test":');
  });

  it("merges extraRules into the config block rules", async () => {
    const output = new OutputConfig({
      fileName: TEST_FILE_NAME,
      plugins: [
        makePlugin({
          extraRules: { "extra-rule": "warn" },
          rules: { "base-rule": "error" },
        }),
      ],
    });

    await createConfigFile(output);

    const content = getWrittenContent();
    expect(content).toContain('"base-rule": "error"');
    expect(content).toContain('"extra-rule": "warn"');
  });
});
