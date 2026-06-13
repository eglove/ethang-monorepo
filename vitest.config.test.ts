import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import isArray from "lodash/isArray.js";
import { describe, expect, it, vi } from "vitest";

import config from "./vitest.config.ts";

vi.mock("@cloudflare/vitest-pool-workers", () => ({
  cloudflareTest: () => ({ name: "mocked-cloudflare-test-plugin" }),
}));

vi.mock("@vitejs/plugin-react", () => ({
  default: () => ({ name: "mocked-react-plugin" }),
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname);

function parseProperties(content: string): Record<string, string> {
  const lines = content.split(/\r?\n/);
  const result: Record<string, string> = {};
  let currentKey = "";
  let currentValue = "";
  let isContinuing = false;

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith("#") || line.startsWith("!")) {
      continue;
    }

    if (isContinuing) {
      if (line.endsWith("\\")) {
        currentValue += line.slice(0, -1).trim();
      } else {
        currentValue += line.trim();
        result[currentKey] = currentValue;
        isContinuing = false;
      }
    } else {
      const eqIdx = line.indexOf("=");
      if (eqIdx === -1) continue;
      const key = line.slice(0, eqIdx).trim();
      let val = line.slice(eqIdx + 1).trim();
      if (val.endsWith("\\")) {
        currentKey = key;
        currentValue = val.slice(0, -1).trim();
        isContinuing = true;
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}

function findConfigs(dir: string): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== ".agents") {
        files.push(...findConfigs(fullPath));
      }
    } else if (entry.name === "vitest.config.ts" || entry.name === "vitest.config.mts") {
      files.push(fullPath);
    }
  }
  return files;
}

it("should have correct project configurations", () => {
  expect(config).toBeDefined();
  expect(config.test).toBeDefined();
  expect(config.test?.projects).toBeDefined();
  expect(isArray(config.test?.projects)).toBe(true);
  expect(config.test?.projects).toContain("apps/*/vitest.config.{ts,mts}");
  expect(config.test?.projects).toContain("packages/*/vitest.config.ts");
});

it("should have correct sonar-project.properties lcov path", () => {
  const sonarPropertiesPath = resolve(rootDir, "sonar-project.properties");
  const content = readFileSync(sonarPropertiesPath, "utf8");
  const properties = parseProperties(content);
  expect(properties["sonar.javascript.lcov.reportPaths"]).toBe("coverage/lcov.info");
});

const appsConfigs = findConfigs(resolve(rootDir, "apps"));
const packagesConfigs = findConfigs(resolve(rootDir, "packages"));
const allConfigs = [...appsConfigs, ...packagesConfigs];

describe("Subproject vitest configurations", () => {
  for (const configPath of allConfigs) {
    const relativePath = configPath.replace(rootDir + "/", "").replace(rootDir + "\\", "");

    it(`should have valid coverage configuration in ${relativePath}`, async () => {
      const fileUrl = pathToFileURL(configPath).href;
      const module = await import(fileUrl);
      const rawConfig = module.default;
      const subConfig = typeof rawConfig === "function" ? await rawConfig({ command: "serve", mode: "test" }) : rawConfig;

      expect(subConfig).toBeDefined();
      expect(subConfig.test).toBeDefined();
      expect(subConfig.test.coverage).toBeDefined();
      expect(subConfig.test.coverage.provider).toBe("v8");
      expect(subConfig.test.coverage.reporter).toContain("lcov");
      expect(subConfig.test.coverage.thresholds).toBeDefined();
      expect(subConfig.test.coverage.thresholds.autoUpdate).toBe(true);

      const thresholds = subConfig.test.coverage.thresholds;
      expect(typeof thresholds.branches).toBe("number");
      expect(typeof thresholds.functions).toBe("number");
      expect(typeof thresholds.lines).toBe("number");
      expect(typeof thresholds.statements).toBe("number");
    });
  }
});
