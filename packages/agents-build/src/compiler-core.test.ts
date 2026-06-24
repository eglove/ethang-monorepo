import includes from "lodash/includes.js";
import isArray from "lodash/isArray.js";
import isError from "lodash/isError.js";
import repeat from "lodash/repeat.js";
import trim from "lodash/trim.js";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  compile,
  CompileError,
  type CompilerConfig,
  validationHelpers
} from "./compiler-core.ts";
import {
  BAD_FRONTMATTER_SKILL,
  COMMAND_CONTENT,
  COMMAND_DESCRIPTION,
  SKILL_CONTENT,
  SKILL_DESCRIPTION,
  TEST_COMMAND_NAME,
  TEST_SKILL_NAME
} from "./test-constants.ts";

const manifestFileName = ".manifest.json";

const utf8Encoding = "utf8";
const rulesDirectoryName = "rules";
const alwaysOnTrigger = "always_on";
const testDirectoryPrefix = "compiler-core-test-";

describe("compilation", () => {
  let temporaryDirectory = "";

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(path.join(tmpdir(), testDirectoryPrefix));
  });

  afterEach(() => {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  });

  it("creates generated command files", () => {
    const commandsDirectory = path.join(temporaryDirectory, "commands");
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);

    const config: CompilerConfig = {
      commands: [
        {
          content: COMMAND_CONTENT,
          description: COMMAND_DESCRIPTION,
          name: TEST_COMMAND_NAME
        }
      ],
      commandsDir: commandsDirectory,
      rootDir: temporaryDirectory,
      rules: [],
      rulesDir: rulesDirectory
    };

    compile(config);

    expect(
      existsSync(path.join(commandsDirectory, `${TEST_COMMAND_NAME}.md`))
    ).toBe(true);
    const content = readFileSync(
      path.join(commandsDirectory, `${TEST_COMMAND_NAME}.md`),
      utf8Encoding
    );
    expect(content).toContain(`description: ${COMMAND_DESCRIPTION}`);
    expect(content).toContain(COMMAND_CONTENT);
  });

  it("creates generated rule files", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);

    const config: CompilerConfig = {
      rootDir: temporaryDirectory,
      rules: [
        {
          content: repeat("a", 10_500),
          filename: "rule-a",
          trigger: alwaysOnTrigger
        }
      ],
      rulesDir: rulesDirectory
    };

    compile(config);

    expect(existsSync(path.join(rulesDirectory, "rule-a.md"))).toBe(true);
  });
});

describe("validation failures and warnings", () => {
  let temporaryDirectory = "";

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(path.join(tmpdir(), testDirectoryPrefix));
  });

  afterEach(() => {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  });

  it("throws CompileError when validation fails, handles warnings, and unresolved tokens", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);

    const config: CompilerConfig = {
      rootDir: temporaryDirectory,
      rules: [
        {
          content: `rule content containing forbidden word Jira and unresolved {{sections}} ${repeat(
            "a",
            10_500
          )}`,
          filename: "rule-bad-content",
          trigger: alwaysOnTrigger
        },
        {
          content: repeat("a", 10_500),
          filename: "rule-duplicate",
          trigger: alwaysOnTrigger
        },
        {
          content: repeat("a", 12_001),
          filename: "rule-duplicate",
          trigger: alwaysOnTrigger
        },
        {
          content: repeat("a", 10_500),
          filename: "rule-warn",
          trigger: alwaysOnTrigger
        }
      ],
      rulesDir: rulesDirectory
    };

    const originValidateFrontmatter = validationHelpers.isValidFrontmatterBlock;

    vi.spyOn(validationHelpers, "isValidFrontmatterBlock").mockImplementation(
      (markdown) => {
        if (includes(markdown, "Jira")) {
          return false;
        }
        return originValidateFrontmatter(markdown);
      }
    );

    let thrownError: unknown;
    try {
      compile(config);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(isError(thrownError)).toBe(true);

    if (thrownError instanceof CompileError) {
      expect(thrownError.name).toBe("CompileError");
    }

    vi.restoreAllMocks();
  });

  it("skips directory scan if the rules directory does not exist", () => {
    const rulesDirectory = path.join(
      temporaryDirectory,
      "non-existent-rules-dir"
    );

    const config: CompilerConfig = {
      rootDir: temporaryDirectory,
      rules: [],
      rulesDir: rulesDirectory
    };

    expect(() => {
      compile(config);
    }).not.toThrow();
  });
});

describe("skills compilation and validation", () => {
  let temporaryDirectory = "";

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(path.join(tmpdir(), testDirectoryPrefix));
  });

  afterEach(() => {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  });

  it("compiles skills", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);
    const skillsDirectory = path.join(temporaryDirectory, "skills");

    const config: CompilerConfig = {
      rootDir: temporaryDirectory,
      rules: [],
      rulesDir: rulesDirectory,
      skills: [
        {
          content: SKILL_CONTENT,
          description: SKILL_DESCRIPTION,
          name: TEST_SKILL_NAME
        }
      ],
      skillsDir: skillsDirectory
    };

    compile(config);

    const skillFilePath = path.join(
      skillsDirectory,
      TEST_SKILL_NAME,
      "SKILL.md"
    );
    expect(existsSync(skillFilePath)).toBe(true);

    const content = readFileSync(skillFilePath, utf8Encoding);
    expect(content).toContain(`name: ${TEST_SKILL_NAME}`);
    expect(content).toContain(SKILL_CONTENT);
  });

  it("compiles skills with resources", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);
    const skillsDirectory = path.join(temporaryDirectory, "skills");

    const config: CompilerConfig = {
      rootDir: temporaryDirectory,
      rules: [],
      rulesDir: rulesDirectory,
      skills: [
        {
          content: SKILL_CONTENT,
          description: SKILL_DESCRIPTION,
          name: TEST_SKILL_NAME,
          resources: [
            {
              content: [
                { text: "test resource content", type: "text" as const }
              ],
              filename: "res1.md"
            },
            {
              content: "another test resource content",
              filename: "res2.md"
            }
          ]
        }
      ],
      skillsDir: skillsDirectory
    };

    compile(config);

    const skillFilePath = path.join(
      skillsDirectory,
      TEST_SKILL_NAME,
      "SKILL.md"
    );
    const resourceFilePath = path.join(
      skillsDirectory,
      TEST_SKILL_NAME,
      "resources",
      "res1.md"
    );
    const resourceFilePath2 = path.join(
      skillsDirectory,
      TEST_SKILL_NAME,
      "resources",
      "res2.md"
    );
    expect(existsSync(skillFilePath)).toBe(true);
    expect(existsSync(resourceFilePath)).toBe(true);
    expect(existsSync(resourceFilePath2)).toBe(true);

    const resourceContentRead = readFileSync(resourceFilePath, utf8Encoding);
    expect(trim(resourceContentRead)).toBe("test resource content");

    const resourceContentRead2 = readFileSync(resourceFilePath2, utf8Encoding);
    expect(resourceContentRead2).toBe("another test resource content");
  });

  it("generates MCP config at the expected path", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);
    const skillsDirectory = path.join(temporaryDirectory, "skills");
    const mcpConfigPath = path.join(temporaryDirectory, "mcp", "mcp.json");
    const manifestPath = path.join(
      temporaryDirectory,
      rulesDirectoryName,
      manifestFileName
    );

    const config: CompilerConfig = {
      manifestPath,
      mcpConfigPath,
      rootDir: temporaryDirectory,
      rules: [],
      rulesDir: rulesDirectory,
      skills: [],
      skillsDir: skillsDirectory
    };

    compile(config);

    expect(existsSync(mcpConfigPath)).toBe(true);

    const parsed = JSON.parse(
      readFileSync(mcpConfigPath, utf8Encoding)
    ) as Record<string, unknown>;
    expect(parsed["mcpServers"]).toBeDefined();
    const mcpServers = parsed["mcpServers"] as Record<string, unknown>;
    expect(mcpServers["JetBrains IDE"]).toBeDefined();
  });

  it("writes a manifest with generated file paths", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);
    const skillsDirectory = path.join(temporaryDirectory, "skills");
    const manifestPath = path.join(
      temporaryDirectory,
      rulesDirectoryName,
      manifestFileName
    );

    const config: CompilerConfig = {
      manifestPath,
      rootDir: temporaryDirectory,
      rules: [
        {
          content: repeat("a", 10_500),
          filename: "rule-a",
          trigger: alwaysOnTrigger
        }
      ],
      rulesDir: rulesDirectory,
      skills: [
        {
          content: SKILL_CONTENT,
          description: SKILL_DESCRIPTION,
          name: TEST_SKILL_NAME
        }
      ],
      skillsDir: skillsDirectory
    };

    compile(config);

    expect(existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(
      readFileSync(manifestPath, utf8Encoding)
    ) as Record<string, unknown>;
    expect(isArray(manifest["files"])).toBe(true);
    const files = manifest["files"] as string[];

    expect(files).toContain(
      path
        .relative(temporaryDirectory, path.join(rulesDirectory, "rule-a.md"))
        .replaceAll("\\", "/")
    );
    expect(files).toContain(
      path
        .relative(
          temporaryDirectory,
          path.join(skillsDirectory, TEST_SKILL_NAME, "SKILL.md")
        )
        .replaceAll("\\", "/")
    );
  });
});

describe("file lifecycle", () => {
  let temporaryDirectory = "";

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(path.join(tmpdir(), testDirectoryPrefix));
  });

  afterEach(() => {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  });

  it("cleans up previously manifest-tracked files before rebuilding", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);
    const skillsDirectory = path.join(temporaryDirectory, "skills");
    const manifestPath = path.join(temporaryDirectory, manifestFileName);
    const staleRulePath = path.join(rulesDirectory, "stale-rule.md");
    const staleSkillName = "stale-skill";
    const staleResourcePath = path.join(
      skillsDirectory,
      staleSkillName,
      "resources",
      "stale-res.md"
    );

    const config1: CompilerConfig = {
      manifestPath,
      rootDir: temporaryDirectory,
      rules: [
        {
          content: repeat("a", 10_500),
          filename: "stale-rule",
          trigger: alwaysOnTrigger
        }
      ],
      rulesDir: rulesDirectory,
      skills: [
        {
          content: SKILL_CONTENT,
          description: SKILL_DESCRIPTION,
          name: staleSkillName,
          resources: [
            {
              content: "stale resource",
              filename: "stale-res.md"
            }
          ]
        }
      ],
      skillsDir: skillsDirectory
    };

    compile(config1);
    expect(existsSync(staleRulePath)).toBe(true);
    expect(existsSync(staleResourcePath)).toBe(true);

    const config2: CompilerConfig = {
      manifestPath,
      rootDir: temporaryDirectory,
      rules: [
        {
          content: repeat("a", 10_500),
          filename: "new-rule",
          trigger: alwaysOnTrigger
        }
      ],
      rulesDir: rulesDirectory,
      skills: [],
      skillsDir: skillsDirectory
    };

    compile(config2);

    expect(existsSync(staleRulePath)).toBe(false);
    expect(existsSync(staleResourcePath)).toBe(false);
    expect(
      existsSync(path.join(skillsDirectory, staleSkillName, "resources"))
    ).toBe(false);
    expect(existsSync(path.join(skillsDirectory, staleSkillName))).toBe(false);
    expect(existsSync(path.join(rulesDirectory, "new-rule.md"))).toBe(true);
  });

  it("cleans up previously manifest-tracked command files before rebuilding", () => {
    const commandsDirectory = path.join(temporaryDirectory, "commands");
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);
    const manifestPath = path.join(temporaryDirectory, manifestFileName);
    const staleCommandPath = path.join(commandsDirectory, "stale-command.md");

    const config1: CompilerConfig = {
      commands: [
        {
          content: "stale command",
          description: "stale command",
          name: "stale-command"
        }
      ],
      commandsDir: commandsDirectory,
      manifestPath,
      rootDir: temporaryDirectory,
      rules: [],
      rulesDir: rulesDirectory
    };

    compile(config1);
    expect(existsSync(staleCommandPath)).toBe(true);

    const config2: CompilerConfig = {
      commands: [],
      commandsDir: commandsDirectory,
      manifestPath,
      rootDir: temporaryDirectory,
      rules: [],
      rulesDir: rulesDirectory
    };

    compile(config2);

    expect(existsSync(staleCommandPath)).toBe(false);
  });
});

describe("error handling", () => {
  let temporaryDirectory = "";

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(path.join(tmpdir(), testDirectoryPrefix));
  });

  afterEach(() => {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  });

  it("handles readdirSync error during parent directory cleanup gracefully", () => {
    const manifestPath = path.join(temporaryDirectory, manifestFileName);
    const manifestDirectory = path.dirname(manifestPath);

    mkdirSync(manifestDirectory, { recursive: true });
    const relativeFilePath = path
      .relative(
        temporaryDirectory,
        path.join(temporaryDirectory, "nonexistent", "deep", "file.md")
      )
      .replaceAll("\\", "/");
    writeFileSync(
      manifestPath,
      JSON.stringify({ files: [relativeFilePath] }),
      "utf8"
    );

    const config: CompilerConfig = {
      manifestPath,
      rootDir: temporaryDirectory,
      rules: [],
      rulesDir: path.join(temporaryDirectory, "rules"),
      skills: [],
      skillsDir: path.join(temporaryDirectory, "skills")
    };

    expect(() => {
      compile(config);
    }).not.toThrow();
  });

  it("records a failure if a skill has a malformed frontmatter block", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);
    const skillsDirectory = path.join(temporaryDirectory, "skills");

    const config: CompilerConfig = {
      rootDir: temporaryDirectory,
      rules: [],
      rulesDir: rulesDirectory,
      skills: [
        {
          content: SKILL_CONTENT,
          description: SKILL_DESCRIPTION,
          name: BAD_FRONTMATTER_SKILL
        }
      ],
      skillsDir: skillsDirectory
    };

    vi.spyOn(validationHelpers, "isValidFrontmatterBlock").mockReturnValue(
      false
    );

    let thrownError: unknown;
    try {
      compile(config);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(CompileError);
    if (thrownError instanceof CompileError) {
      expect(thrownError.failures).toContain(
        `skills/${BAD_FRONTMATTER_SKILL}/SKILL.md: malformed frontmatter block`
      );
    }

    vi.restoreAllMocks();
  });

  it("records a failure if a command has a malformed frontmatter block", () => {
    const commandsDirectory = path.join(temporaryDirectory, "commands");
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);

    const config: CompilerConfig = {
      commands: [
        {
          content: COMMAND_CONTENT,
          description: COMMAND_DESCRIPTION,
          name: TEST_COMMAND_NAME
        }
      ],
      commandsDir: commandsDirectory,
      rootDir: temporaryDirectory,
      rules: [],
      rulesDir: rulesDirectory
    };

    vi.spyOn(validationHelpers, "isValidFrontmatterBlock").mockReturnValue(
      false
    );

    let thrownError: unknown;
    try {
      compile(config);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(CompileError);
    if (thrownError instanceof CompileError) {
      expect(thrownError.failures).toContain(
        `commands/${TEST_COMMAND_NAME}.md: malformed frontmatter block`
      );
    }

    vi.restoreAllMocks();
  });
});

describe("manifest edge cases", () => {
  let temporaryDirectory = "";

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(path.join(tmpdir(), testDirectoryPrefix));
  });

  afterEach(() => {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  });

  it("handles absolute manifest paths and missing skillsDir", () => {
    const manifestPath = path.join(temporaryDirectory, manifestFileName);
    const manifestDirectory = path.dirname(manifestPath);
    const absoluteFilePath = path.join(
      temporaryDirectory,
      rulesDirectoryName,
      "test-rule.md"
    );

    mkdirSync(manifestDirectory, { recursive: true });
    mkdirSync(path.dirname(absoluteFilePath), { recursive: true });
    writeFileSync(absoluteFilePath, "test content");

    writeFileSync(
      manifestPath,
      JSON.stringify({
        files: [absoluteFilePath.replaceAll("\\", "/")]
      }),
      "utf8"
    );

    const config: CompilerConfig = {
      manifestPath,
      rootDir: temporaryDirectory,
      rules: [],
      rulesDir: path.join(temporaryDirectory, rulesDirectoryName)
    };

    compile(config);

    expect(existsSync(absoluteFilePath)).toBe(false);
  });

  it("handles manifest without a files property", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);
    const manifestPath = path.join(temporaryDirectory, manifestFileName);

    writeFileSync(
      manifestPath,
      JSON.stringify({ notFiles: "some value" }),
      "utf8"
    );

    const config: CompilerConfig = {
      manifestPath,
      rootDir: temporaryDirectory,
      rules: [
        {
          content: repeat("a", 10_500),
          filename: "some-rule",
          trigger: alwaysOnTrigger
        }
      ],
      rulesDir: rulesDirectory
    };

    expect(() => {
      compile(config);
    }).not.toThrow();

    expect(existsSync(path.join(rulesDirectory, "some-rule.md"))).toBe(true);
  });

  it("handles manifest with malformed files property (not an array)", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);
    const manifestPath = path.join(temporaryDirectory, manifestFileName);

    writeFileSync(
      manifestPath,
      JSON.stringify({ files: "not-an-array" }),
      "utf8"
    );

    const config: CompilerConfig = {
      manifestPath,
      rootDir: temporaryDirectory,
      rules: [
        {
          content: repeat("a", 10_500),
          filename: "some-rule",
          trigger: alwaysOnTrigger
        }
      ],
      rulesDir: rulesDirectory
    };

    expect(() => {
      compile(config);
    }).not.toThrow();

    expect(existsSync(path.join(rulesDirectory, "some-rule.md"))).toBe(true);
  });
});
