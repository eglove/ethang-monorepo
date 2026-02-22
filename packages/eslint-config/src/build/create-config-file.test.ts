import some from "lodash/some.js";
import split from "lodash/split.js";
import trim from "lodash/trim.js";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createConfigFile } from "./create-config-file.ts";

vi.mock("node:fs");

describe("createConfigFile", () => {
  const testConfig = "test.config.js";
  const eslintConfig = "eslint.config.js";
  const prettierString = "eslintConfigPrettier,";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a config file with imports and configs", async () => {
    const listConfigs = [
      {
        name: "core",
        options: { extraImports: ['import extra from "extra";'] },
      },
    ];

    await createConfigFile(listConfigs, testConfig);

    const expectedPath = path.join(import.meta.dirname, `../${testConfig}`);
    expect(writeFileSync).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion,@typescript-eslint/prefer-destructuring
    const call = (writeFileSync as unknown as { mock: { calls: string[][] } })
      .mock.calls[0];
    const calledPath = call?.[0];
    const content = call?.[1];

    expect(calledPath).toBe(expectedPath);
    expect(content).toContain("// @ts-nocheck");
    expect(content).toContain('import extra from "extra";');
    expect(content).toContain(
      'import { ignores, languageOptions } from "./constants.js";',
    );
    expect(content).toContain("export default defineConfig(");
  });

  it("should create a config file with function parameters", async () => {
    const listConfigs = [{ name: "core" }];
    const parameters = "options";

    await createConfigFile(listConfigs, testConfig, parameters);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion,@typescript-eslint/prefer-destructuring
    const call = (writeFileSync as unknown as { mock: { calls: string[][] } })
      .mock.calls[0];
    const content = call?.[1];
    expect(content).toContain("const config = (options) => {");
    expect(content).not.toContain(prettierString);
    expect(content).toContain("export default config;");
  });

  it("should handle function parameters and main file correctly", async () => {
    const listConfigs = [{ name: "core" }];
    const parameters = "options";

    await createConfigFile(listConfigs, eslintConfig, parameters);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion,@typescript-eslint/prefer-destructuring
    const call = (writeFileSync as unknown as { mock: { calls: string[][] } })
      .mock.calls[0];
    const content = call?.[1];
    expect(content).toContain("const config = (options) => {");
    expect(content).toContain(prettierString);
    expect(content).toContain("eslintPluginPrettierRecommended,");
    expect(content).toContain("export default config;");
  });

  it("should handle empty extra imports correctly", async () => {
    const listConfigs = [
      {
        name: "core",
        options: { extraImports: [] },
      },
    ];

    await createConfigFile(listConfigs, testConfig);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion,@typescript-eslint/prefer-destructuring
    const call = (writeFileSync as unknown as { mock: { calls: string[][] } })
      .mock.calls[0];
    const content = call?.[1];
    const lines = split(String(content), "\n");
    const hasUndefinedLine = some(lines, (l) => "undefined" === trim(l));
    expect(hasUndefinedLine).toBe(false);
  });

  it("should include prettier configs if fileName is mainFile", async () => {
    const listConfigs = [{ name: "core" }];

    await createConfigFile(listConfigs, eslintConfig);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion,@typescript-eslint/prefer-destructuring
    const call = (writeFileSync as unknown as { mock: { calls: string[][] } })
      .mock.calls[0];
    const content = call?.[1];
    expect(content).toContain(prettierString);
    expect(content).toContain("eslintPluginPrettierRecommended,");
  });
});
