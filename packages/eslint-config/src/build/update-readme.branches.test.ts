import { writeFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import { OutputConfig } from "./output-config.ts";
import { Plugin } from "./plugin.ts";

vi.mock(import("node:fs"));

const testOutputConfigs: OutputConfig[] = [];

vi.mock(import("./output-config.ts"), async (importOriginal) => {
  const importedModule = await importOriginal();
  return {
    ...importedModule,
    get outputConfigs() {
      return testOutputConfigs;
    },
  };
});

// Must be imported AFTER mocks are registered
const { updateReadme } = await import("./update-readme.ts");

const makePlugin = (
  overrides: Partial<ConstructorParameters<typeof Plugin>[0]> = {},
) => {
  return new Plugin({
    files: "**/*.ts",
    importString: 'import p from "p";',
    name: "test-plugin",
    pluginName: "test",
    pluginValue: "testPlugin",
    rules: { "rule-a": "error", "rule-b": "warn" },
    url: "https://example.com",
    ...overrides,
  });
};

describe("updateReadme — mainConfig undefined branches", () => {
  it("handles empty outputConfigs without throwing", () => {
    testOutputConfigs.length = 0;
    vi.clearAllMocks();
    // testOutputConfigs is empty → mainConfig is undefined
    updateReadme();

    expect(writeFileSync).toHaveBeenCalledTimes(1);

    const content = (
      writeFileSync as unknown as { mock: { calls: string[][] } }
    ).mock.calls[0]?.[1];

    expect(content).toContain("# Relentless. Unapologetic.");
    expect(content).toContain("0 rules.");
  });
});

describe("updateReadme — featured config branches", () => {
  it("uses singular 'rule' when a plugin has exactly one active rule", () => {
    testOutputConfigs.length = 0;
    vi.clearAllMocks();
    const singleRulePlugin = makePlugin({
      rules: { "only-rule": "error" },
    });

    testOutputConfigs.push(
      new OutputConfig({
        fileName: "config.test.js",
        plugins: [singleRulePlugin],
        readmeImport:
          'import testConfig from "@ethang/eslint-config/config.test.js";',
        readmeLabel: "Test",
      }),
    );

    updateReadme();

    const content = (
      writeFileSync as unknown as { mock: { calls: string[][] } }
    ).mock.calls[0]?.[1];

    expect(content).toContain("1 rule from");
  });

  it("outputs empty string for readmeImport when not set", () => {
    testOutputConfigs.length = 0;
    vi.clearAllMocks();
    testOutputConfigs.push(
      new OutputConfig({
        fileName: "config.test.js",
        plugins: [makePlugin()],
        readmeLabel: "Test",
        // readmeImport intentionally omitted
      }),
    );

    updateReadme();

    expect(writeFileSync).toHaveBeenCalledTimes(1);
  });
});
