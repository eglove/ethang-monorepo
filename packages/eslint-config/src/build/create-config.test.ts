import { describe, expect, it, vi } from "vitest";

import { createConfig } from "./create-config.ts";

describe("createConfig", () => {
  it("should create a basic config", async () => {
    const config = await createConfig("core");
    expect(config).toContain('files: ["**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}"]');
    expect(config).toContain('"compat": compat,');
  });

  it("should include global ignores", async () => {
    const config = await createConfig("core", {
      globalIgnores: ["dist", "node_modules"],
    });
    expect(config).toContain('ignores: ["dist", "node_modules"]');
  });

  it("should include extra rules", async () => {
    const config = await createConfig("core", {
      extraRules: { "no-console": "off" },
    });
    expect(config).toContain('"no-console":"off"');
  });

  it("should include react version when requested", async () => {
    vi.mock("./get-react-version.ts", () => ({
      getLatestReact: vi.fn().mockResolvedValue({ version: "18.3.0" }),
    }));
    const config = await createConfig("react", { includeReactVersion: true });
    expect(config).toContain("settings: {");
    expect(config).toContain('"react":{"version":"18.3.0"}');
  });

  it("should include optional sections", async () => {
    const config = await createConfig("core", {
      includeIgnores: true,
      includeLanguageOptions: true,
      processor: "my-processor",
    });
    expect(config).toContain("ignores,");
    expect(config).toContain("languageOptions,");
    expect(config).toContain("processor: my-processor,");
  });

  it("should include angular language options", async () => {
    const config = await createConfig("angular", {
      includeAngularLanguageOptions: true,
      includeLanguageOptions: true,
    });
    expect(config).toContain("languageOptions: angularLanguageOptions,");
    // eslint-disable-next-line sonar/slow-regex
    expect(config).not.toMatch(/^\s*languageOptions,$/mu);
  });

  it("should include language for specific types", async () => {
    const config = await createConfig("css");
    expect(config).toContain('language: "css/css"');
  });

  it("should include extra options", async () => {
    const config = await createConfig("core", {
      extraOptions: "custom: true,",
    });
    expect(config).toContain("custom: true,");
  });
});
