import endsWith from "lodash/endsWith.js";
import includes from "lodash/includes.js";
import isError from "lodash/isError.js";
import isString from "lodash/isString.js";
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
import { z } from "zod";

import {
  compile,
  CompileError,
  type CompilerConfig,
  fsProxy,
  validationHelpers
} from "./compiler-core.ts";
import {
  BAD_FRONTMATTER_SKILL,
  SKILL_CONTENT,
  SKILL_DESCRIPTION,
  SKILL_MANIFEST_PATH,
  TEST_SKILL_NAME
} from "./test-constants.ts";

const manifestJsonName = "manifest.json";
const utf8Encoding = "utf8";
const ruleAMdName = "rules/rule-a.md";
const rulesDirectoryName = "rules";
const alwaysOnTrigger = "always_on";
const testDirectoryPrefix = "compiler-core-test-";
const resourceContent = "resource content";

const manifestSchema = z.object({
  files: z.array(z.string())
});

describe("first build compilation", () => {
  let temporaryDirectory = "";

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(path.join(tmpdir(), testDirectoryPrefix));
  });

  afterEach(() => {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  });

  it("performs first build and creates generated files and manifest", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);
    const manifestPath = path.join(temporaryDirectory, manifestJsonName);

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
      rulesDir: rulesDirectory
    };

    compile(config);

    expect(existsSync(path.join(rulesDirectory, "rule-a.md"))).toBe(true);
    expect(existsSync(manifestPath)).toBe(true);

    const parsed = JSON.parse(
      readFileSync(manifestPath, utf8Encoding)
    ) as unknown;
    const manifest = manifestSchema.parse(parsed);
    expect(manifest.files).toContain(ruleAMdName);
  });
});

describe("incremental compilation & pruning", () => {
  let temporaryDirectory = "";

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(path.join(tmpdir(), testDirectoryPrefix));
  });

  afterEach(() => {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  });

  it("deletes old generated files and updates manifest on definition change", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);
    const manifestPath = path.join(temporaryDirectory, manifestJsonName);

    mkdirSync(rulesDirectory, { recursive: true });

    const oldRulePath = path.join(rulesDirectory, "old-rule.md");
    writeFileSync(oldRulePath, "old rule", utf8Encoding);

    const initialManifest = {
      files: ["rules/old-rule.md"]
    };
    writeFileSync(manifestPath, JSON.stringify(initialManifest), utf8Encoding);

    const config: CompilerConfig = {
      manifestPath,
      rootDir: temporaryDirectory,
      rules: [
        {
          content: repeat("a", 10_500),
          filename: "new-rule",
          trigger: alwaysOnTrigger
        }
      ],
      rulesDir: rulesDirectory
    };

    compile(config);

    expect(existsSync(oldRulePath)).toBe(false);
    expect(existsSync(path.join(rulesDirectory, "new-rule.md"))).toBe(true);

    const parsed = JSON.parse(
      readFileSync(manifestPath, utf8Encoding)
    ) as unknown;
    const manifest = manifestSchema.parse(parsed);
    expect(manifest.files).toStrictEqual(["rules/new-rule.md"]);
  });

  it("cleans empty parent directories of deleted resources", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);
    const manifestPath = path.join(temporaryDirectory, manifestJsonName);

    const ruleResourceDirectory = path.join(rulesDirectory, "nested", "folder");
    mkdirSync(ruleResourceDirectory, { recursive: true });

    const resourceFile = path.join(ruleResourceDirectory, "res.md");
    writeFileSync(resourceFile, resourceContent, utf8Encoding);

    const initialManifest = {
      files: ["rules/nested/folder/res.md"]
    };
    writeFileSync(manifestPath, JSON.stringify(initialManifest), utf8Encoding);

    const config: CompilerConfig = {
      manifestPath,
      rootDir: temporaryDirectory,
      rules: [],
      rulesDir: rulesDirectory
    };

    compile(config);

    expect(existsSync(resourceFile)).toBe(false);
    expect(existsSync(ruleResourceDirectory)).toBe(false);
    expect(existsSync(path.dirname(ruleResourceDirectory))).toBe(false);
    expect(existsSync(rulesDirectory)).toBe(true);
  });

  it("preserves unrelated external files and their parent directories", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);
    const manifestPath = path.join(temporaryDirectory, manifestJsonName);

    const ruleResourceDirectory = path.join(rulesDirectory, "nested");
    mkdirSync(ruleResourceDirectory, { recursive: true });

    const resourceFile = path.join(ruleResourceDirectory, "res.md");
    const unrelatedFile = path.join(ruleResourceDirectory, "unrelated.txt");
    writeFileSync(resourceFile, resourceContent, utf8Encoding);
    writeFileSync(unrelatedFile, "unrelated content", utf8Encoding);

    const initialManifest = {
      files: ["rules/nested/res.md"]
    };
    writeFileSync(manifestPath, JSON.stringify(initialManifest), utf8Encoding);

    const config: CompilerConfig = {
      manifestPath,
      rootDir: temporaryDirectory,
      rules: [],
      rulesDir: rulesDirectory
    };

    compile(config);

    expect(existsSync(resourceFile)).toBe(false);
    expect(existsSync(unrelatedFile)).toBe(true);
    expect(existsSync(ruleResourceDirectory)).toBe(true);
  });
});

describe("resilience & error recovery", () => {
  let temporaryDirectory = "";

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(path.join(tmpdir(), testDirectoryPrefix));
  });

  afterEach(() => {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  });

  it("falls back to current targets calculation if manifest is missing or corrupted", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);
    const manifestPath = path.join(temporaryDirectory, manifestJsonName);

    mkdirSync(rulesDirectory, { recursive: true });
    writeFileSync(manifestPath, "{ invalid json", utf8Encoding);

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
      rulesDir: rulesDirectory
    };

    compile(config);

    expect(existsSync(path.join(rulesDirectory, "rule-a.md"))).toBe(true);
    expect(existsSync(manifestPath)).toBe(true);

    const parsed = JSON.parse(
      readFileSync(manifestPath, utf8Encoding)
    ) as unknown;
    const manifest = manifestSchema.parse(parsed);
    expect(manifest.files).toStrictEqual(["rules/rule-a.md"]);
  });

  it("falls back to current targets calculation if readFileSync fails", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);
    const manifestPath = path.join(temporaryDirectory, manifestJsonName);

    mkdirSync(rulesDirectory, { recursive: true });
    writeFileSync(manifestPath, "{}", utf8Encoding);

    const spy = vi.spyOn(fsProxy, "readFileSync").mockImplementationOnce(() => {
      throw new Error("mock read failure");
    });

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
      rulesDir: rulesDirectory
    };

    compile(config);

    expect(existsSync(path.join(rulesDirectory, "rule-a.md"))).toBe(true);
    expect(existsSync(manifestPath)).toBe(true);

    spy.mockRestore();
  });

  it("handles readdirSync error inside cleanFileAndEmptyParents gracefully", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);
    const manifestPath = path.join(temporaryDirectory, manifestJsonName);

    const initialManifest = {
      files: ["rules/nested/rule-to-clean.md"]
    };
    const nestedDirectory = path.join(rulesDirectory, "nested");
    mkdirSync(nestedDirectory, { recursive: true });
    writeFileSync(path.join(nestedDirectory, "rule-to-clean.md"), "content");
    writeFileSync(manifestPath, JSON.stringify(initialManifest), utf8Encoding);

    const spy = vi.spyOn(fsProxy, "readdirSync").mockImplementationOnce(() => {
      throw new Error("mocked readdir error");
    });

    const config: CompilerConfig = {
      manifestPath,
      rootDir: temporaryDirectory,
      rules: [],
      rulesDir: rulesDirectory
    };

    expect(() => {
      compile(config);
    }).not.toThrow();

    spy.mockRestore();
  });

  it("handles non-existent directory during cleanFileAndEmptyParents gracefully", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);
    const manifestPath = path.join(temporaryDirectory, manifestJsonName);

    const initialManifest = {
      files: ["rules/nested/rule-to-clean.md"]
    };
    const nestedDirectory = path.join(rulesDirectory, "nested");
    mkdirSync(nestedDirectory, { recursive: true });
    writeFileSync(path.join(nestedDirectory, "rule-to-clean.md"), "content");
    writeFileSync(manifestPath, JSON.stringify(initialManifest), utf8Encoding);

    const spy = vi.spyOn(fsProxy, "existsSync").mockImplementation((p) => {
      if (isString(p) && endsWith(p.replaceAll("\\", "/"), "rules/nested")) {
        return false;
      }
      return existsSync(p);
    });

    const config: CompilerConfig = {
      manifestPath,
      rootDir: temporaryDirectory,
      rules: [],
      rulesDir: rulesDirectory
    };

    expect(() => {
      compile(config);
    }).not.toThrow();

    spy.mockRestore();
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
    const manifestPath = path.join(temporaryDirectory, manifestJsonName);

    const config: CompilerConfig = {
      manifestPath,
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

    const originValidateFrontmatter =
      validationHelpers.validateFrontmatterBlock;

    vi.spyOn(validationHelpers, "validateFrontmatterBlock").mockImplementation(
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
    const manifestPath = path.join(temporaryDirectory, manifestJsonName);

    const config: CompilerConfig = {
      manifestPath,
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

  it("compiles skills and includes them in the manifest", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);
    const skillsDirectory = path.join(temporaryDirectory, "skills");
    const manifestPath = path.join(temporaryDirectory, manifestJsonName);

    const config: CompilerConfig = {
      manifestPath,
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

    const parsed = JSON.parse(
      readFileSync(manifestPath, utf8Encoding)
    ) as unknown;
    const manifest = manifestSchema.parse(parsed);
    expect(manifest.files).toContain(SKILL_MANIFEST_PATH);
  });

  it("compiles skills with resources and includes resources in the manifest", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);
    const skillsDirectory = path.join(temporaryDirectory, "skills");
    const manifestPath = path.join(temporaryDirectory, manifestJsonName);

    const config: CompilerConfig = {
      manifestPath,
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

    const parsed = JSON.parse(
      readFileSync(manifestPath, utf8Encoding)
    ) as unknown;
    const manifest = manifestSchema.parse(parsed);
    expect(manifest.files).toContain(SKILL_MANIFEST_PATH);
    expect(manifest.files).toContain(
      `skills/${TEST_SKILL_NAME}/resources/res1.md`
    );
    expect(manifest.files).toContain(
      `skills/${TEST_SKILL_NAME}/resources/res2.md`
    );
  });

  it("records a failure if a skill has a malformed frontmatter block", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);
    const skillsDirectory = path.join(temporaryDirectory, "skills");
    const manifestPath = path.join(temporaryDirectory, manifestJsonName);

    const config: CompilerConfig = {
      manifestPath,
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

    vi.spyOn(validationHelpers, "validateFrontmatterBlock").mockReturnValue(
      false
    );

    let thrownError: unknown;
    try {
      compile(config);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError instanceof CompileError).toBe(true);
    if (thrownError instanceof CompileError) {
      expect(thrownError.failures).toContain(
        `skills/${BAD_FRONTMATTER_SKILL}/SKILL.md: malformed frontmatter block`
      );
    }

    vi.restoreAllMocks();
  });
});
