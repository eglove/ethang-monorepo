import find from "lodash/find.js";
import { describe, expect, it } from "vitest";

import { GLOBAL_RULES } from "./global.ts";

describe("GLOBAL_RULES lint rule", () => {
  it("has a rule with filename 'lint' and trigger 'model_decision'", () => {
    const lintRule = find(GLOBAL_RULES, (rule) => {
      return "lint" === rule.filename;
    });

    expect(lintRule).toBeDefined();
    expect(lintRule?.trigger).toBe("model_decision");
  });

  it("contains the ESLint troubleshooting sections and learned linting lessons", () => {
    const lintRule = find(GLOBAL_RULES, (rule) => {
      return "lint" === rule.filename;
    });

    expect(lintRule).toBeDefined();
    const content = lintRule?.content ?? "";

    expect(content).toContain("ESLint Troubleshooting & User Collaboration");
    expect(content).toContain("ESLint Auto-Fix Cycle Deadlock");
    expect(content).toContain("Lodash Imports Must Be Individual");
    expect(content).toContain("Explicit Returns in attempt/attemptAsync");
    expect(content).toContain("Lodash isNil for Nullable Checks");
    expect(content).toContain("ESLint and Lodash Compliance");
    expect(content).toContain("Strict TypeScript/ESLint checks");
  });

  it("requires agents to load and follow the eslint-fixer skill", () => {
    const lintRule = find(GLOBAL_RULES, (rule) => {
      return "lint" === rule.filename;
    });

    expect(lintRule).toBeDefined();
    const content = lintRule?.content ?? "";

    expect(content).toContain("eslint-fixer");
  });
});

describe("GLOBAL_RULES esCli rule", () => {
  it("contains the Everything Search CLI fallback guideline in 'es-cli'", () => {
    const esCliRule = find(GLOBAL_RULES, (rule) => {
      return "es-cli" === rule.filename;
    });

    expect(esCliRule).toBeDefined();
    const content = esCliRule?.content ?? "";
    expect(content).toContain("Everything Search CLI (es) Fallback");
  });
});

describe("GLOBAL_RULES webstormMcp rule", () => {
  it("contains the WebStorm MCP guidelines in 'webstorm-mcp'", () => {
    const webstormMcpRule = find(GLOBAL_RULES, (rule) => {
      return "webstorm-mcp" === rule.filename;
    });

    expect(webstormMcpRule).toBeDefined();
    const content = webstormMcpRule?.content ?? "";
    expect(content).toContain("WebStorm MCP Argument Nesting");
    expect(content).toContain("WebStorm MCP replace_text_in_file Parameter");
    expect(content).toContain("WebStorm Text Search");
    expect(content).toContain("IDE Write Synchronization");
  });
});
