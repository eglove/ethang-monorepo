import constant from "lodash/constant.js";
import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  type ConfigReader,
  defaultConfigReader,
  defaultFilePort,
  defaultRecipesPort,
  type EslintRunner,
  type FilePort,
  type LintAiClient,
  type LintFixerConfig,
  type LintUserPort,
  type RecipesPort,
  runLintFixer,
} from "./lint-fixer.ts";

type FixCall = { clean: boolean; errors: string };

const UNUSED_VAR_SOURCE = "const unused = 1;";
const UNUSED_VAR_ERROR = "no-unused-vars";

const AI_FIXED_CONTENT = "fixed content";
const MOCK_ESLINT_CONFIG = `import config from "@ethang/eslint-config/config.main.js";
export default defineConfig(...config);`;
const MOCK_BUILT_RULES = `// built rules content from @ethang/eslint-config
export default [{ rules: { "no-unused-vars": "error" } }];`;

function makeAiClient(): LintAiClient {
  return {
    messages: {
      // eslint-disable-next-line @typescript-eslint/require-await
      async create() {
        return {
          content: [{ text: "fixed file content", type: "text" }],
        };
      },
    },
  };
}

function makeConfig(overrides?: Partial<LintFixerConfig>): LintFixerConfig {
  return {
    interactive: true,
    maxLintPasses: 3,
    recipesPath: path.join(tmpdir(), "test-recipes.md"),
    ...overrides,
  };
}

function makeConfigReader(overrides?: Partial<ConfigReader>): ConfigReader {
  return {
    findEslintConfig: constant("/fake/eslint.config.ts"),
    readBuiltRules: constant(MOCK_BUILT_RULES),
    readConfig: constant(MOCK_ESLINT_CONFIG),
    ...overrides,
  };
}

function makeEslintRunner(sequence: FixCall[]): EslintRunner {
  let index = 0;
  return {
    fix() {
      const result = sequence[index] ?? { clean: true, errors: "" };
      index += 1;
      return result;
    },
  };
}

function makeFilePort(content = DEFAULT_SOURCE): {
  port: FilePort;
  written: string[];
} {
  const written: string[] = [];
  return {
    port: {
      read: constant(content),
      write(_path: string, newContent: string) {
        written.push(newContent);
      },
    },
    written,
  };
}

function makeRecipesPort(
  recipesContent = "",
): { appended: string[] } & RecipesPort {
  const appended: string[] = [];
  return {
    append(_path: string, content: string) {
      appended.push(content);
    },
    appended,
    load: constant(recipesContent),
  };
}

function makeUserPort(responses: string[] = ["user advice"]): LintUserPort {
  let index = 0;
  return {
    // eslint-disable-next-line @typescript-eslint/require-await
    async askUser() {
      const response = responses[index] ?? "default advice";
      index += 1;
      return response;
    },
  };
}

const DEFAULT_SOURCE = "const x = 1;";
const FIX_ADVICE = "fix advice";
const ESLINT_CONFIG_FILENAME = "eslint.config.ts";

function firstCallArgument(spy: ReturnType<typeof vi.fn>) {
  const [first] = spy.mock.calls;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return first?.[0];
}

const CLEAN: FixCall = { clean: true, errors: "" };
const DIRTY: FixCall = { clean: false, errors: `error: ${UNUSED_VAR_ERROR}` };

describe("lint-fixer double-pass convergence", () => {
  it("two consecutive clean runs return success", async () => {
    const runner = makeEslintRunner([CLEAN, CLEAN, CLEAN, CLEAN]);
    const { port } = makeFilePort();
    const result = await runLintFixer(
      "test.ts",
      makeConfig(),
      makeAiClient(),
      makeUserPort(),
      runner,
      makeRecipesPort(),
      port,
      makeConfigReader(),
    );

    expect(result.success).toBe(true);
    expect(result.cleanRuns).toBe(2);
  });

  it("dirty resets counter: clean, dirty, clean, clean succeeds", async () => {
    const runner = makeEslintRunner([
      CLEAN,
      CLEAN,
      DIRTY,
      DIRTY,
      CLEAN,
      CLEAN,
      CLEAN,
      CLEAN,
    ]);
    const { port } = makeFilePort();
    const result = await runLintFixer(
      "test.ts",
      makeConfig(),
      makeAiClient(),
      makeUserPort(),
      runner,
      makeRecipesPort(),
      port,
      makeConfigReader(),
    );

    expect(result.success).toBe(true);
    expect(result.cleanRuns).toBe(2);
  });
});

describe("lint-fixer escalation behavior", () => {
  it("resets cleanRuns AND attempts (TLA+ fix #1)", async () => {
    const sequence: FixCall[] = [
      DIRTY,
      DIRTY,
      DIRTY,
      DIRTY,
      DIRTY,
      DIRTY,
      CLEAN,
      CLEAN,
      CLEAN,
      CLEAN,
    ];
    const runner = makeEslintRunner(sequence);
    const { port } = makeFilePort();
    const result = await runLintFixer(
      "test.ts",
      makeConfig({ maxLintPasses: 3 }),
      makeAiClient(),
      makeUserPort(["recipe from user"]),
      runner,
      makeRecipesPort(),
      port,
      makeConfigReader(),
    );

    expect(result.success).toBe(true);
    expect(result.escalationCount).toBe(1);
    expect(result.cleanRuns).toBe(2);
    expect(result.totalAttempts).toBe(0);
  });

  it("after escalation, two clean runs succeed", async () => {
    const sequence: FixCall[] = [
      DIRTY,
      DIRTY,
      DIRTY,
      DIRTY,
      CLEAN,
      CLEAN,
      CLEAN,
      CLEAN,
    ];
    const runner = makeEslintRunner(sequence);
    const { port } = makeFilePort();
    const result = await runLintFixer(
      "test.ts",
      makeConfig({ maxLintPasses: 2 }),
      makeAiClient(),
      makeUserPort([FIX_ADVICE]),
      runner,
      makeRecipesPort(),
      port,
      makeConfigReader(),
    );

    expect(result.success).toBe(true);
    expect(result.escalationCount).toBe(1);
  });

  it("user response is appended as a structured recipe", async () => {
    const sequence: FixCall[] = [
      DIRTY,
      DIRTY,
      DIRTY,
      DIRTY,
      CLEAN,
      CLEAN,
      CLEAN,
      CLEAN,
    ];
    const runner = makeEslintRunner(sequence);
    const recipesPort = makeRecipesPort();
    const { port } = makeFilePort();
    const result = await runLintFixer(
      "test.ts",
      makeConfig({ maxLintPasses: 2 }),
      makeAiClient(),
      makeUserPort(["my lint recipe"]),
      runner,
      recipesPort,
      port,
      makeConfigReader(),
    );

    expect(result.success).toBe(true);
    expect(recipesPort.appended).toHaveLength(1);
    expect(recipesPort.appended[0]).toContain("Recipe:");
    expect(recipesPort.appended[0]).toContain("my lint recipe");
    expect(recipesPort.appended[0]).toContain(UNUSED_VAR_ERROR);
  });

  it("escalation prompt shows rule names and file content", async () => {
    const sequence: FixCall[] = [
      DIRTY,
      DIRTY,
      DIRTY,
      DIRTY,
      CLEAN,
      CLEAN,
      CLEAN,
      CLEAN,
    ];
    const runner = makeEslintRunner(sequence);
    const askUserSpy = vi.fn().mockResolvedValue("add underscore prefix");
    const { port } = makeFilePort("const bad = 1;");
    const result = await runLintFixer(
      "test.ts",
      makeConfig({ maxLintPasses: 2 }),
      makeAiClient(),
      { askUser: askUserSpy },
      runner,
      makeRecipesPort(),
      port,
      makeConfigReader(),
    );

    expect(result.success).toBe(true);
    expect(askUserSpy).toHaveBeenCalledTimes(1);

    const prompt = String(firstCallArgument(askUserSpy));
    expect(prompt).toContain("const bad = 1;");
    expect(prompt).toContain(UNUSED_VAR_ERROR);
    expect(prompt).toContain("2 attempts");
  });
});

describe("lint-fixer non-interactive mode", () => {
  it("returns LintFailed with lint_exhausted (TLA+ fix #2)", async () => {
    const sequence: FixCall[] = [DIRTY, DIRTY, DIRTY, DIRTY];
    const runner = makeEslintRunner(sequence);
    const { port } = makeFilePort();
    const result = await runLintFixer(
      "test.ts",
      makeConfig({ interactive: false, maxLintPasses: 2 }),
      makeAiClient(),
      makeUserPort(),
      runner,
      makeRecipesPort(),
      port,
      makeConfigReader(),
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("lint_exhausted");
  });

  it("returns failure immediately without escalation (Gap #8)", async () => {
    const sequence: FixCall[] = [DIRTY, DIRTY, DIRTY, DIRTY, DIRTY, DIRTY];
    const runner = makeEslintRunner(sequence);
    const askUser = vi.fn().mockResolvedValue("should not be called");
    const { port } = makeFilePort();
    const result = await runLintFixer(
      "test.ts",
      makeConfig({ interactive: false, maxLintPasses: 3 }),
      makeAiClient(),
      { askUser },
      runner,
      makeRecipesPort(),
      port,
      makeConfigReader(),
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("lint_exhausted");
    expect(result.escalationCount).toBe(0);
    expect(askUser).not.toHaveBeenCalled();
  });
});

describe("lint-fixer AI-assisted fixing with dynamic config", () => {
  it("system prompt includes dynamic ESLint config content (not hardcoded)", async () => {
    const createSpy = vi.fn().mockResolvedValue({
      content: [{ text: AI_FIXED_CONTENT, type: "text" }],
    });
    const aiClient: LintAiClient = {
      messages: { create: createSpy },
    };

    const sequence: FixCall[] = [DIRTY, DIRTY, CLEAN, CLEAN, CLEAN, CLEAN];
    const runner = makeEslintRunner(sequence);
    const { port } = makeFilePort(UNUSED_VAR_SOURCE);
    const result = await runLintFixer(
      "test.ts",
      makeConfig({ maxLintPasses: 3 }),
      aiClient,
      makeUserPort(),
      runner,
      makeRecipesPort(),
      port,
      makeConfigReader(),
    );

    expect(result.success).toBe(true);
    expect(createSpy).toHaveBeenCalledTimes(1);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const callArguments = firstCallArgument(createSpy);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const systemPrompt: string = callArguments.system;

    // Should contain the dynamic config content, not the old hardcoded summary
    expect(systemPrompt).toContain(MOCK_ESLINT_CONFIG);
    expect(systemPrompt).toContain(MOCK_BUILT_RULES);
    expect(systemPrompt).toContain("lint-fixer agent");
    expect(systemPrompt).toContain("NEEDS_USER_HELP");
    expect(systemPrompt).toContain("NEVER use eslint-disable");

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(callArguments.messages[0].content).toContain(UNUSED_VAR_SOURCE);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(callArguments.messages[0].content).toContain(UNUSED_VAR_ERROR);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(callArguments.max_tokens).toBe(8192);
  });

  it("system prompt includes recipes content", async () => {
    const createSpy = vi.fn().mockResolvedValue({
      content: [{ text: AI_FIXED_CONTENT, type: "text" }],
    });
    const aiClient: LintAiClient = {
      messages: { create: createSpy },
    };

    const sequence: FixCall[] = [DIRTY, DIRTY, CLEAN, CLEAN, CLEAN, CLEAN];
    const runner = makeEslintRunner(sequence);
    const { port } = makeFilePort(UNUSED_VAR_SOURCE);
    const recipesContent = "## Recipe: prefix unused vars with _";
    const result = await runLintFixer(
      "test.ts",
      makeConfig({ maxLintPasses: 3 }),
      aiClient,
      makeUserPort(),
      runner,
      makeRecipesPort(recipesContent),
      port,
      makeConfigReader(),
    );

    expect(result.success).toBe(true);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const callArguments = firstCallArgument(createSpy);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const systemPrompt: string = callArguments.system;
    expect(systemPrompt).toContain(recipesContent);
    expect(systemPrompt).toContain("Check the recipes below first");
  });

  it("system prompt shows fallback when no eslint config found", async () => {
    const createSpy = vi.fn().mockResolvedValue({
      content: [{ text: AI_FIXED_CONTENT, type: "text" }],
    });
    const aiClient: LintAiClient = {
      messages: { create: createSpy },
    };

    const sequence: FixCall[] = [DIRTY, DIRTY, CLEAN, CLEAN, CLEAN, CLEAN];
    const runner = makeEslintRunner(sequence);
    const { port } = makeFilePort(UNUSED_VAR_SOURCE);
    const result = await runLintFixer(
      "test.ts",
      makeConfig({ maxLintPasses: 3 }),
      aiClient,
      makeUserPort(),
      runner,
      makeRecipesPort(),
      port,
      makeConfigReader({ findEslintConfig: constant(null) }),
    );

    expect(result.success).toBe(true);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const callArguments = firstCallArgument(createSpy);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const systemPrompt: string = callArguments.system;
    expect(systemPrompt).toContain("(no eslint config found)");
    expect(systemPrompt).toContain("(could not resolve)");
  });

  it("system prompt shows fallback when built rules cannot be resolved", async () => {
    const createSpy = vi.fn().mockResolvedValue({
      content: [{ text: AI_FIXED_CONTENT, type: "text" }],
    });
    const aiClient: LintAiClient = {
      messages: { create: createSpy },
    };

    const sequence: FixCall[] = [DIRTY, DIRTY, CLEAN, CLEAN, CLEAN, CLEAN];
    const runner = makeEslintRunner(sequence);
    const { port } = makeFilePort(UNUSED_VAR_SOURCE);
    const result = await runLintFixer(
      "test.ts",
      makeConfig({ maxLintPasses: 3 }),
      aiClient,
      makeUserPort(),
      runner,
      makeRecipesPort(),
      port,
      makeConfigReader({ readBuiltRules: constant(null) }),
    );

    expect(result.success).toBe(true);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const callArguments = firstCallArgument(createSpy);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const systemPrompt: string = callArguments.system;
    expect(systemPrompt).toContain(MOCK_ESLINT_CONFIG);
    expect(systemPrompt).toContain("(could not resolve)");
  });

  it("response is written back to the file via filePort", async () => {
    const createSpy = vi.fn().mockResolvedValue({
      content: [{ text: "const _unused = 1;", type: "text" }],
    });
    const aiClient: LintAiClient = {
      messages: { create: createSpy },
    };

    const sequence: FixCall[] = [DIRTY, DIRTY, CLEAN, CLEAN, CLEAN, CLEAN];
    const runner = makeEslintRunner(sequence);
    const { port, written } = makeFilePort(UNUSED_VAR_SOURCE);
    const result = await runLintFixer(
      "test.ts",
      makeConfig({ maxLintPasses: 3 }),
      aiClient,
      makeUserPort(),
      runner,
      makeRecipesPort(),
      port,
      makeConfigReader(),
    );

    expect(result.success).toBe(true);
    expect(written).toHaveLength(1);
    expect(written[0]).toBe("const _unused = 1;");
  });

  it("empty AI response does not write to file", async () => {
    const createSpy = vi.fn().mockResolvedValue({
      content: [],
    });
    const aiClient: LintAiClient = {
      messages: { create: createSpy },
    };

    const sequence: FixCall[] = [DIRTY, DIRTY, CLEAN, CLEAN, CLEAN, CLEAN];
    const runner = makeEslintRunner(sequence);
    const { port, written } = makeFilePort();
    const result = await runLintFixer(
      "test.ts",
      makeConfig({ maxLintPasses: 3 }),
      aiClient,
      makeUserPort(),
      runner,
      makeRecipesPort(),
      port,
      makeConfigReader(),
    );

    expect(result.success).toBe(true);
    expect(written).toHaveLength(0);
  });
});

describe("lint-fixer NEEDS_USER_HELP escalation", () => {
  it("does not write file when AI returns NEEDS_USER_HELP", async () => {
    const createSpy = vi.fn().mockResolvedValue({
      content: [
        {
          text: "NEEDS_USER_HELP: @typescript-eslint/no-unused-vars: cannot rename exported symbol",
          type: "text",
        },
      ],
    });
    const aiClient: LintAiClient = {
      messages: { create: createSpy },
    };

    const sequence: FixCall[] = [DIRTY, DIRTY, CLEAN, CLEAN, CLEAN, CLEAN];
    const runner = makeEslintRunner(sequence);
    const { port, written } = makeFilePort(UNUSED_VAR_SOURCE);
    const result = await runLintFixer(
      "test.ts",
      makeConfig({ interactive: true, maxLintPasses: 3 }),
      aiClient,
      makeUserPort(["prefix with underscore"]),
      runner,
      makeRecipesPort(),
      port,
      makeConfigReader(),
    );

    expect(result.success).toBe(true);
    // AI response should NOT be written to the file
    expect(written).toHaveLength(0);
    // Should have escalated
    expect(result.escalationCount).toBe(1);
  });

  it("escalates to user and saves recipe on NEEDS_USER_HELP", async () => {
    const createSpy = vi.fn().mockResolvedValue({
      content: [
        {
          text: "NEEDS_USER_HELP: sonar/nested-control-flow: too deeply nested",
          type: "text",
        },
      ],
    });
    const aiClient: LintAiClient = {
      messages: { create: createSpy },
    };

    const sequence: FixCall[] = [DIRTY, DIRTY, CLEAN, CLEAN, CLEAN, CLEAN];
    const runner = makeEslintRunner(sequence);
    const { port } = makeFilePort();
    const askUserSpy = vi.fn().mockResolvedValue("extract to helper function");
    const recipesPort = makeRecipesPort();

    const result = await runLintFixer(
      "test.ts",
      makeConfig({ interactive: true, maxLintPasses: 3 }),
      aiClient,
      { askUser: askUserSpy },
      runner,
      recipesPort,
      port,
      makeConfigReader(),
    );

    expect(result.success).toBe(true);
    expect(askUserSpy).toHaveBeenCalledTimes(1);
    expect(recipesPort.appended).toHaveLength(1);
    expect(recipesPort.appended[0]).toContain("extract to helper function");
  });

  it("does not escalate NEEDS_USER_HELP in non-interactive mode", async () => {
    const createSpy = vi.fn().mockResolvedValue({
      content: [
        {
          text: "NEEDS_USER_HELP: some-rule: conflict",
          type: "text",
        },
      ],
    });
    const aiClient: LintAiClient = {
      messages: { create: createSpy },
    };

    // After AI returns NEEDS_USER_HELP in non-interactive mode, it should
    // not escalate — the loop continues and eventually exhausts attempts
    const sequence: FixCall[] = [DIRTY, DIRTY, DIRTY, DIRTY, DIRTY, DIRTY];
    const runner = makeEslintRunner(sequence);
    const askUserSpy = vi.fn().mockResolvedValue("should not be called");
    const { port } = makeFilePort();

    const result = await runLintFixer(
      "test.ts",
      makeConfig({ interactive: false, maxLintPasses: 3 }),
      aiClient,
      { askUser: askUserSpy },
      runner,
      makeRecipesPort(),
      port,
      makeConfigReader(),
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("lint_exhausted");
    expect(askUserSpy).not.toHaveBeenCalled();
  });
});

describe("defaultRecipesPort", () => {
  const testPath = path.join(
    tmpdir(),
    `lint-fixer-test-${String(Date.now())}.md`,
  );

  it("load returns empty string for non-existent file", () => {
    const result = defaultRecipesPort.load(
      path.join(tmpdir(), "does-not-exist-lint-fixer.md"),
    );
    expect(result).toBe("");
  });

  it("append writes content and load reads it back", () => {
    try {
      writeFileSync(testPath, "# Recipes\n", "utf8");
      defaultRecipesPort.append(testPath, "new recipe");
      const content = defaultRecipesPort.load(testPath);
      expect(content).toContain("new recipe");
    } finally {
      if (existsSync(testPath)) {
        unlinkSync(testPath);
      }
    }
  });
});

describe("defaultFilePort", () => {
  const testPath = path.join(
    tmpdir(),
    `lint-fixer-file-test-${String(Date.now())}.ts`,
  );

  it("write creates a file and read returns its content", () => {
    try {
      defaultFilePort.write(testPath, "const x = 42;");
      const content = defaultFilePort.read(testPath);
      expect(content).toBe("const x = 42;");
    } finally {
      if (existsSync(testPath)) {
        unlinkSync(testPath);
      }
    }
  });
});

describe("defaultConfigReader", () => {
  it("findEslintConfig returns config path when eslint.config.ts exists", async () => {
    const directory = path.join(
      tmpdir(),
      `lint-fixer-cfg-${String(Date.now())}`,
    );
    const configPath = path.join(directory, ESLINT_CONFIG_FILENAME);

    try {
      const { mkdirSync } = await import("node:fs");
      mkdirSync(directory, { recursive: true });
      writeFileSync(configPath, "export default [];", "utf8");

      const filePath = path.join(directory, "src", "index.ts");
      const result = defaultConfigReader.findEslintConfig(filePath);
      expect(result).toBe(configPath);
    } finally {
      if (existsSync(configPath)) {
        unlinkSync(configPath);
      }
    }
  });

  it("findEslintConfig returns null when no config exists up to root", () => {
    // Use a path deep in tmp that won't have an eslint config
    const fakePath = path.join(
      tmpdir(),
      `no-eslint-cfg-${String(Date.now())}`,
      "deep",
      "nested",
      "file.ts",
    );
    const result = defaultConfigReader.findEslintConfig(fakePath);
    expect(result).toBeNull();
  });

  it("readConfig reads file content", () => {
    const filePath = path.join(
      tmpdir(),
      `lint-fixer-readConfig-${String(Date.now())}.ts`,
    );

    try {
      writeFileSync(filePath, "export default config;", "utf8");
      const content = defaultConfigReader.readConfig(filePath);
      expect(content).toBe("export default config;");
    } finally {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    }
  });

  it("readBuiltRules returns null when no import match found", () => {
    const filePath = path.join(
      tmpdir(),
      `lint-fixer-noRules-${String(Date.now())}.ts`,
    );

    try {
      writeFileSync(filePath, "export default [];", "utf8");
      const result = defaultConfigReader.readBuiltRules(filePath);
      expect(result).toBeNull();
    } finally {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    }
  });

  it("readBuiltRules returns null when import specifier does not start with @", () => {
    const filePath = path.join(
      tmpdir(),
      `lint-fixer-noAtPrefix-${String(Date.now())}.ts`,
    );

    try {
      writeFileSync(
        filePath,
        'import config from "local-package/config.js";\nexport default config;',
        "utf8",
      );
      const result = defaultConfigReader.readBuiltRules(filePath);
      expect(result).toBeNull();
    } finally {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    }
  });

  it("readBuiltRules returns null when resolved path does not exist", async () => {
    const directory = path.join(
      tmpdir(),
      `lint-fixer-noResolve-${String(Date.now())}`,
    );
    const filePath = path.join(directory, ESLINT_CONFIG_FILENAME);

    try {
      const { mkdirSync } = await import("node:fs");
      mkdirSync(directory, { recursive: true });
      writeFileSync(
        filePath,
        'import config from "@fake-scope/nonexistent-pkg/rules.js";\nexport default config;',
        "utf8",
      );
      const result = defaultConfigReader.readBuiltRules(filePath);
      expect(result).toBeNull();
    } finally {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    }
  });

  it("readBuiltRules returns file content when resolved path exists", async () => {
    const directory = path.join(
      tmpdir(),
      `lint-fixer-resolve-${String(Date.now())}`,
    );
    const configPath = path.join(directory, ESLINT_CONFIG_FILENAME);
    const nodeModulesPath = path.join(
      directory,
      "node_modules",
      "@test-scope",
      "eslint-config",
      "rules.js",
    );

    try {
      const { mkdirSync } = await import("node:fs");
      mkdirSync(path.dirname(nodeModulesPath), { recursive: true });
      writeFileSync(
        configPath,
        'import config from "@test-scope/eslint-config/rules.js";\nexport default config;',
        "utf8",
      );
      writeFileSync(
        nodeModulesPath,
        'export default [{ rules: { "no-var": "error" } }];',
        "utf8",
      );

      const result = defaultConfigReader.readBuiltRules(configPath);
      expect(result).toContain("no-var");
    } finally {
      const { rmSync } = await import("node:fs");
      if (existsSync(directory)) {
        rmSync(directory, { force: true, recursive: true });
      }
    }
  });
});

describe("parseRuleNames via escalation with slash-containing rules", () => {
  it("extracts rule names containing / from error output", async () => {
    const dirtyWithRules: FixCall = {
      clean: false,
      errors:
        "1:1 error Unexpected var @typescript-eslint/no-unused-vars\n2:1 error Too complex sonar/cognitive-complexity",
    };
    const sequence: FixCall[] = [
      dirtyWithRules,
      dirtyWithRules,
      dirtyWithRules,
      dirtyWithRules,
      CLEAN,
      CLEAN,
      CLEAN,
      CLEAN,
    ];
    const runner = makeEslintRunner(sequence);
    const askUserSpy = vi.fn().mockResolvedValue(FIX_ADVICE);
    const { port } = makeFilePort(DEFAULT_SOURCE);

    const result = await runLintFixer(
      "test.ts",
      makeConfig({ interactive: true, maxLintPasses: 2 }),
      makeAiClient(),
      { askUser: askUserSpy },
      runner,
      makeRecipesPort(),
      port,
      makeConfigReader(),
    );

    expect(result.success).toBe(true);
    expect(askUserSpy).toHaveBeenCalledTimes(1);

    const prompt = String(firstCallArgument(askUserSpy));
    // parseRuleNames should have extracted both slash-containing rules
    expect(prompt).toContain("@typescript-eslint/no-unused-vars");
    expect(prompt).toContain("sonar/cognitive-complexity");
  });

  it("shows (unknown rules) when errors have no slash-containing tokens", async () => {
    const dirtyNoSlash: FixCall = {
      clean: false,
      errors: "some error without rule identifiers",
    };
    const sequence: FixCall[] = [
      dirtyNoSlash,
      dirtyNoSlash,
      dirtyNoSlash,
      dirtyNoSlash,
      CLEAN,
      CLEAN,
      CLEAN,
      CLEAN,
    ];
    const runner = makeEslintRunner(sequence);
    const askUserSpy = vi.fn().mockResolvedValue(FIX_ADVICE);
    const { port } = makeFilePort(DEFAULT_SOURCE);

    const result = await runLintFixer(
      "test.ts",
      makeConfig({ interactive: true, maxLintPasses: 2 }),
      makeAiClient(),
      { askUser: askUserSpy },
      runner,
      makeRecipesPort(),
      port,
      makeConfigReader(),
    );

    expect(result.success).toBe(true);
    const prompt = String(firstCallArgument(askUserSpy));
    expect(prompt).toContain("(unknown rules)");
  });
});
