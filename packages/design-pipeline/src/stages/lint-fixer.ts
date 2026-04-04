import includes from "lodash/includes.js";
import split from "lodash/split.js";
import startsWith from "lodash/startsWith.js";
import trim from "lodash/trim.js";
import {
  appendFileSync,
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

// Port for dynamically reading ESLint config
export type ConfigReader = {
  // Find the closest eslint.config.ts by walking up from filePath
  findEslintConfig: (filePath: string) => null | string;
  // Resolve the config import to node_modules and read the built rules file
  readBuiltRules: (configPath: string) => null | string;
  // Read the eslint.config.ts content
  readConfig: (configPath: string) => string;
};

// Injectable ESLint runner for testing
export type EslintRunner = {
  fix: (filePath: string) => { clean: boolean; errors: string };
};

// Injectable file I/O port for testing
export type FilePort = {
  read: (filePath: string) => string;
  write: (filePath: string, content: string) => void;
};

// Narrow port for the AI client (same parameter shape as AnthropicClient)
export type LintAiClient = {
  messages: {
    create: (parameters: {
      max_tokens: number;
      messages: { content: string; role: "assistant" | "user" }[];
      model: string;
      system: string;
    }) => Promise<{
      content: readonly { text?: string; type: string }[];
    }>;
  };
};

export type LintFixerConfig = {
  interactive: boolean;
  maxLintPasses: number;
  recipesPath: string;
};

export type LintResult = {
  cleanRuns: number;
  error?: string;
  escalationCount: number;
  success: boolean;
  totalAttempts: number;
};

// Port for user interaction (injectable for testing)
export type LintUserPort = {
  askUser: (prompt: string) => Promise<string>;
};

// Injectable recipes file port for testing
export type RecipesPort = {
  append: (recipesPath: string, content: string) => void;
  load: (recipesPath: string) => string;
};

export const defaultConfigReader: ConfigReader = {
  findEslintConfig(filePath: string): null | string {
    let directory = path.dirname(path.resolve(filePath));
    const root = path.resolve("/");

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      for (const name of ["eslint.config.ts", "eslint.config.js"]) {
        const candidate = path.join(directory, name);

        if (existsSync(candidate)) {
          return candidate;
        }
      }

      if (directory === root) {
        return null;
      }

      directory = path.dirname(directory);
    }
  },

  readBuiltRules(configPath: string): null | string {
    const content = readFileSync(configPath, "utf8");
    // Match import ... from "..." or import ... from '...'
    const importMatch = /import\s+\w+\s+from\s+["']([^"']+)["']/u.exec(content);

    if (null === importMatch) {
      return null;
    }

    const [, specifier] = importMatch;

    if (undefined === specifier || !startsWith(specifier, "@")) {
      return null;
    }

    // Resolve @scope/package/path to node_modules/@scope/package/path
    const configDirectory = path.dirname(configPath);
    const resolvedPath = path.join(configDirectory, "node_modules", specifier);

    if (existsSync(resolvedPath)) {
      return readFileSync(resolvedPath, "utf8");
    }

    return null;
  },

  readConfig(configPath: string): string {
    return readFileSync(configPath, "utf8");
  },
};

export const defaultFilePort: FilePort = {
  read(filePath: string): string {
    return readFileSync(filePath, "utf8");
  },
  write(filePath: string, content: string): void {
    writeFileSync(filePath, content, "utf8");
  },
};

export const defaultRecipesPort: RecipesPort = {
  append(recipesPath: string, content: string): void {
    appendFileSync(recipesPath, `\n${content}\n`, "utf8");
  },
  load(recipesPath: string): string {
    if (existsSync(recipesPath)) {
      return readFileSync(recipesPath, "utf8");
    }

    return "";
  },
};

type LoopState = {
  attempts: number;
  cleanRuns: number;
  escalationCount: number;
};

export async function runLintFixer(
  filePath: string,
  config: LintFixerConfig,
  aiClient: LintAiClient,
  userPort: LintUserPort,
  eslintRunner: EslintRunner,
  recipesPort: RecipesPort = defaultRecipesPort,
  filePort: FilePort = defaultFilePort,
  configReader: ConfigReader = defaultConfigReader,
): Promise<LintResult> {
  const state: LoopState = { attempts: 0, cleanRuns: 0, escalationCount: 0 };

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    // Step a: run eslint --fix
    eslintRunner.fix(filePath);

    // Step b: check if clean
    const checkResult = eslintRunner.fix(filePath);

    if (checkResult.clean) {
      state.cleanRuns += 1;
      const done = handleCleanRun(
        state.cleanRuns,
        state.escalationCount,
        state.attempts,
      );

      if (done) {
        return done;
      }

      // eslint-disable-next-line no-continue
      continue;
    }

    // Step d: dirty run — delegate to helper to keep complexity low
    // eslint-disable-next-line no-await-in-loop
    const result = await handleDirtyRun(
      state,
      checkResult.errors,
      filePath,
      config,
      aiClient,
      userPort,
      eslintRunner,
      recipesPort,
      filePort,
      configReader,
    );

    if (undefined !== result) {
      return result;
    }
  }
}

function buildSystemPrompt(
  configReader: ConfigReader,
  filePath: string,
  recipes: string,
): string {
  const eslintConfigPath = configReader.findEslintConfig(filePath);

  let eslintConfigContent = "(no eslint config found)";
  let builtRulesContent = "(could not resolve)";

  if (null !== eslintConfigPath) {
    eslintConfigContent = configReader.readConfig(eslintConfigPath);
    const builtRules = configReader.readBuiltRules(eslintConfigPath);

    if (null !== builtRules) {
      builtRulesContent = builtRules;
    }
  }

  return `You are a lint-fixer agent. Below is the project's ESLint configuration and the actual rules enabled.

ESLint config (eslint.config.ts):
${eslintConfigContent}

Built rules from the config package:
${builtRulesContent}

Check the recipes below first — if a similar error pattern was solved before, apply that solution.

Previously learned recipes (patterns that worked before):
${recipes || "(none yet)"}

CRITICAL: You must NEVER use eslint-disable comments. If you cannot fix an issue structurally, say "NEEDS_USER_HELP: <rule-name>: <description of the conflict>" and I will ask the user.
Exhaust ALL structural fixes first.

Return ONLY the complete fixed file content. No markdown fences, no explanation.`;
}

async function escalateToUser(
  config: LintFixerConfig,
  userPort: LintUserPort,
  recipesPort: RecipesPort,
  filePort: FilePort,
  filePath: string,
  attempts: number,
  errors: string,
): Promise<void> {
  const fileContent = filePort.read(filePath);

  // Parse rule names from ESLint error output (e.g., "@typescript-eslint/no-unused-vars")
  const ruleNames = parseRuleNames(errors);

  const prompt = `I'm stuck on these ESLint errors after ${String(attempts)} attempts.

Rules involved: ${ruleNames}

File: ${filePath}

ESLint errors:
${errors}

Current file content:
\`\`\`
${fileContent}
\`\`\`

Can you advise on how to resolve this?
Your response will be saved as a recipe for future reference.`;

  const userResponse = await userPort.askUser(prompt);

  recipesPort.append(
    config.recipesPath,
    `## Recipe: ${new Date().toISOString()}\n\nFile: ${filePath}\nErrors: ${errors}\n\nSolution: ${userResponse}`,
  );
}

function extractRuleToken(line: string): null | string {
  // Look for tokens matching rule patterns like "sonar/slow-regex"
  // or "@typescript-eslint/no-unused-vars" by splitting on whitespace
  const words = split(trim(line), /\s+/u);

  for (const word of words) {
    if (includes(word, "/") && !includes(word, "://")) {
      return word;
    }
  }

  return null;
}

async function handleAiFix(
  state: LoopState,
  errors: string,
  filePath: string,
  config: LintFixerConfig,
  aiClient: LintAiClient,
  userPort: LintUserPort,
  recipesPort: RecipesPort,
  filePort: FilePort,
  configReader: ConfigReader,
): Promise<undefined> {
  const aiResult = await requestAiFix(
    aiClient,
    recipesPort,
    filePort,
    configReader,
    config,
    filePath,
    errors,
  );

  if ("needs_user_help" === aiResult && config.interactive) {
    // AI flagged rules it cannot fix structurally — escalate immediately

    await escalateToUser(
      config,
      userPort,
      recipesPort,
      filePort,
      filePath,
      state.attempts,
      errors,
    );
    state.escalationCount += 1;
  }

  return undefined;
}

function handleCleanRun(
  cleanRuns: number,
  escalationCount: number,
  attempts: number,
): LintResult | undefined {
  if (2 <= cleanRuns) {
    return {
      cleanRuns,
      escalationCount,
      success: true,
      totalAttempts: attempts,
    };
  }

  return undefined;
}

async function handleDirtyRun(
  state: LoopState,
  errors: string,
  filePath: string,
  config: LintFixerConfig,
  aiClient: LintAiClient,
  userPort: LintUserPort,
  _eslintRunner: EslintRunner,
  recipesPort: RecipesPort,
  filePort: FilePort,
  configReader: ConfigReader,
): Promise<LintResult | undefined> {
  state.cleanRuns = 0;
  state.attempts += 1;

  if (state.attempts >= config.maxLintPasses) {
    return handleExhaustedDirtyRun(
      state,
      errors,
      filePath,
      config,
      userPort,
      recipesPort,
      filePort,
    );
  }

  return handleAiFix(
    state,
    errors,
    filePath,
    config,
    aiClient,
    userPort,
    recipesPort,
    filePort,
    configReader,
  );
}

async function handleExhaustedAttempts(
  config: LintFixerConfig,
  userPort: LintUserPort,
  recipesPort: RecipesPort,
  filePort: FilePort,
  filePath: string,
  cleanRuns: number,
  attempts: number,
  escalationCount: number,
  errors: string,
): Promise<
  | { escalationCount: number; reset: true }
  | { reset: false; result: LintResult }
> {
  if (config.interactive) {
    await escalateToUser(
      config,
      userPort,
      recipesPort,
      filePort,
      filePath,
      attempts,
      errors,
    );

    return { escalationCount: escalationCount + 1, reset: true };
  }

  // Gap #8: non-interactive mode returns failure
  return {
    reset: false,
    result: {
      cleanRuns,
      error: "lint_exhausted",
      escalationCount,
      success: false,
      totalAttempts: attempts,
    },
  };
}

async function handleExhaustedDirtyRun(
  state: LoopState,
  errors: string,
  filePath: string,
  config: LintFixerConfig,
  userPort: LintUserPort,
  recipesPort: RecipesPort,
  filePort: FilePort,
): Promise<LintResult | undefined> {
  const outcome = await handleExhaustedAttempts(
    config,
    userPort,
    recipesPort,
    filePort,
    filePath,
    state.cleanRuns,
    state.attempts,
    state.escalationCount,
    errors,
  );

  if (outcome.reset) {
    // TLA+ review fix #1: reset BOTH cleanRuns AND attempts
    // eslint-disable-next-line require-atomic-updates
    state.attempts = 0;
    // eslint-disable-next-line require-atomic-updates
    state.escalationCount = outcome.escalationCount;
    return undefined;
  }

  return outcome.result;
}

function parseRuleNames(errors: string): string {
  const lines = split(errors, "\n");
  const rules = new Set<string>();

  for (const line of lines) {
    const token = extractRuleToken(line);

    if (null !== token) {
      rules.add(token);
    }
  }

  return 0 < rules.size ? [...rules].join(", ") : "(unknown rules)";
}

async function requestAiFix(
  aiClient: LintAiClient,
  recipesPort: RecipesPort,
  filePort: FilePort,
  configReader: ConfigReader,
  config: LintFixerConfig,
  filePath: string,
  errors: string,
): Promise<"applied" | "needs_user_help"> {
  const recipes = recipesPort.load(config.recipesPath);
  const fileContent = filePort.read(filePath);

  const systemPrompt = buildSystemPrompt(configReader, filePath, recipes);

  const response = await aiClient.messages.create({
    max_tokens: 8192,
    messages: [
      {
        content: `Fix the ESLint errors in this file.

File: ${filePath}

Current content:
\`\`\`
${fileContent}
\`\`\`

ESLint errors:
${errors}

Return ONLY the complete fixed file content with no wrapping markdown fences,
no explanation, and no commentary.`,
        role: "user",
      },
    ],
    model: "claude-sonnet-4-20250514",
    system: systemPrompt,
  });

  const fixedContent = response.content[0]?.text;

  if (
    undefined !== fixedContent &&
    includes(fixedContent, "NEEDS_USER_HELP:")
  ) {
    return "needs_user_help";
  }

  if (undefined !== fixedContent && "" !== fixedContent) {
    filePort.write(filePath, fixedContent);
  }

  return "applied";
}
