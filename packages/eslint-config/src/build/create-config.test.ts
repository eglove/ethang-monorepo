import { describe, expect, it, vi } from "vitest";

import { createConfig } from "./create-config.ts";

describe("createConfig", () => {
  it("should create a basic config", async () => {
    const configs = await createConfig("core");
    const config = configs.join("\n");
    expect(config).toContain('files: ["**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}"]');
    expect(config).toContain('"compat": compat,');
  });

  it("should include global ignores", async () => {
    const configs = await createConfig("core", {
      globalIgnores: ["dist", "node_modules"],
    });
    const config = configs.join("\n");
    expect(config).toContain('globalIgnores(["dist", "node_modules"])');
  });

  it("should include extra rules", async () => {
    const configs = await createConfig("core", {
      extraRules: { "no-console": "off" },
    });
    const config = configs.join("\n");
    expect(config).toContain('"no-console":"off"');
  });

  it("should include react version when requested", async () => {
    vi.mock("./get-react-version.ts", () => ({
      getLatestReact: vi.fn().mockResolvedValue({ version: "18.3.0" }),
    }));
    const configs = await createConfig("react", { includeReactVersion: true });
    const config = configs.join("\n");
    expect(config).toContain("settings: {");
    expect(config).toContain('"react":{"version":"18.3.0"}');
  });

  it("should include optional sections", async () => {
    const configs = await createConfig("core", {
      includeIgnores: true,
      includeLanguageOptions: true,
      processor: "my-processor",
    });
    const config = configs.join("\n");
    expect(config).toContain("globalIgnores(ignores)");
    expect(config).toContain("languageOptions,");
    expect(config).toContain("processor: my-processor,");
  });

  it("should include angular language options", async () => {
    const configs = await createConfig("core", {
      includeAngularLanguageOptions: true,
      includeLanguageOptions: true,
    });
    const config = configs.join("\n");
    expect(config).toContain("languageOptions: angularLanguageOptions,");
    // eslint-disable-next-line sonar/slow-regex
    expect(config).not.toMatch(/^\s*languageOptions,$/mu);
  });

  it("should include language for specific types", async () => {
    const configs = await createConfig("css");
    const config = configs.join("\n");
    expect(config).toContain('language: "css/css"');
  });

  it("should include extra options", async () => {
    const configs = await createConfig("core", {
      extraOptions: "custom: true,",
    });
    const config = configs.join("\n");
    expect(config).toContain("custom: true,");
  });
});
