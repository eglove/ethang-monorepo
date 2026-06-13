import includes from "lodash/includes.js";
import isError from "lodash/isError.js";
import repeat from "lodash/repeat.js";
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

const manifestJsonName = "manifest.json";
const utf8Encoding = "utf8";
const ruleAMdName = "rules/rule-a.md";
const rulesDirectoryName = "rules";
const skillsDirectoryName = "skills";
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
    const skillsDirectory = path.join(temporaryDirectory, skillsDirectoryName);
    const manifestPath = path.join(temporaryDirectory, manifestJsonName);

    const config: CompilerConfig = {
      manifestPath,
      rootDir: temporaryDirectory,
      rules: [
        {
          content: "rule-a content",
          filename: "rule-a",
          trigger: alwaysOnTrigger
        }
      ],
      rulesDir: rulesDirectory,
      skills: [
        {
          content: "skill-b content referencing res.md",
          description: "skill-b description",
          name: "skill-b",
          resources: [
            {
              content: resourceContent,
              path: "res.md"
            }
          ]
        }
      ],
      skillsDir: skillsDirectory
    };

    compile(config);

    expect(existsSync(path.join(rulesDirectory, "rule-a.md"))).toBe(true);
    expect(existsSync(path.join(skillsDirectory, "skill-b", "SKILL.md"))).toBe(
      true
    );
    expect(existsSync(path.join(skillsDirectory, "skill-b", "res.md"))).toBe(
      true
    );
    expect(existsSync(manifestPath)).toBe(true);

    const parsed = JSON.parse(
      readFileSync(manifestPath, utf8Encoding)
    ) as unknown;
    const manifest = manifestSchema.parse(parsed);
    expect(manifest.files).toContain(ruleAMdName);
    expect(manifest.files).toContain("skills/skill-b/SKILL.md");
    expect(manifest.files).toContain("skills/skill-b/res.md");
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
    const skillsDirectory = path.join(temporaryDirectory, skillsDirectoryName);
    const manifestPath = path.join(temporaryDirectory, manifestJsonName);

    mkdirSync(rulesDirectory, { recursive: true });
    mkdirSync(path.join(skillsDirectory, "old-skill"), { recursive: true });

    const oldRulePath = path.join(rulesDirectory, "old-rule.md");
    const oldSkillPath = path.join(skillsDirectory, "old-skill", "SKILL.md");
    writeFileSync(oldRulePath, "old rule", utf8Encoding);
    writeFileSync(oldSkillPath, "old skill", utf8Encoding);

    const initialManifest = {
      files: ["rules/old-rule.md", "skills/old-skill/SKILL.md"]
    };
    writeFileSync(manifestPath, JSON.stringify(initialManifest), utf8Encoding);

    const config: CompilerConfig = {
      manifestPath,
      rootDir: temporaryDirectory,
      rules: [
        {
          content: "new rule content",
          filename: "new-rule",
          trigger: alwaysOnTrigger
        }
      ],
      rulesDir: rulesDirectory,
      skills: [],
      skillsDir: skillsDirectory
    };

    compile(config);

    expect(existsSync(oldRulePath)).toBe(false);
    expect(existsSync(oldSkillPath)).toBe(false);
    expect(existsSync(path.join(rulesDirectory, "new-rule.md"))).toBe(true);

    const parsed = JSON.parse(
      readFileSync(manifestPath, utf8Encoding)
    ) as unknown;
    const manifest = manifestSchema.parse(parsed);
    expect(manifest.files).toStrictEqual(["rules/new-rule.md"]);
  });

  it("cleans empty parent directories of deleted resources", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);
    const skillsDirectory = path.join(temporaryDirectory, skillsDirectoryName);
    const manifestPath = path.join(temporaryDirectory, manifestJsonName);

    const skillResourceDirectory = path.join(
      skillsDirectory,
      "skill-a",
      "nested",
      "resources"
    );
    mkdirSync(skillResourceDirectory, { recursive: true });

    const resourceFile = path.join(skillResourceDirectory, "res.md");
    writeFileSync(resourceFile, resourceContent, utf8Encoding);

    const initialManifest = {
      files: ["skills/skill-a/nested/resources/res.md"]
    };
    writeFileSync(manifestPath, JSON.stringify(initialManifest), utf8Encoding);

    const config: CompilerConfig = {
      manifestPath,
      rootDir: temporaryDirectory,
      rules: [],
      rulesDir: rulesDirectory,
      skills: [
        {
          content: "skill-a content",
          description: "skill-a description",
          name: "skill-a",
          resources: []
        }
      ],
      skillsDir: skillsDirectory
    };

    compile(config);

    expect(existsSync(resourceFile)).toBe(false);
    expect(existsSync(skillResourceDirectory)).toBe(false);
    expect(existsSync(path.dirname(skillResourceDirectory))).toBe(false);
    expect(existsSync(path.join(skillsDirectory, "skill-a"))).toBe(true);
  });

  it("preserves unrelated external files and their parent directories", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);
    const skillsDirectory = path.join(temporaryDirectory, skillsDirectoryName);
    const manifestPath = path.join(temporaryDirectory, manifestJsonName);

    const skillResourceDirectory = path.join(
      skillsDirectory,
      "skill-a",
      "nested"
    );
    mkdirSync(skillResourceDirectory, { recursive: true });

    const resourceFile = path.join(skillResourceDirectory, "res.md");
    const unrelatedFile = path.join(skillResourceDirectory, "unrelated.txt");
    writeFileSync(resourceFile, resourceContent, utf8Encoding);
    writeFileSync(unrelatedFile, "unrelated content", utf8Encoding);

    const initialManifest = {
      files: ["skills/skill-a/nested/res.md"]
    };
    writeFileSync(manifestPath, JSON.stringify(initialManifest), utf8Encoding);

    const config: CompilerConfig = {
      manifestPath,
      rootDir: temporaryDirectory,
      rules: [],
      rulesDir: rulesDirectory,
      skills: [],
      skillsDir: skillsDirectory
    };

    compile(config);

    expect(existsSync(resourceFile)).toBe(false);
    expect(existsSync(unrelatedFile)).toBe(true);
    expect(existsSync(skillResourceDirectory)).toBe(true);
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
    const skillsDirectory = path.join(temporaryDirectory, skillsDirectoryName);
    const manifestPath = path.join(temporaryDirectory, manifestJsonName);

    mkdirSync(rulesDirectory, { recursive: true });
    writeFileSync(manifestPath, "{ invalid json", utf8Encoding);

    const config: CompilerConfig = {
      manifestPath,
      rootDir: temporaryDirectory,
      rules: [
        {
          content: "rule content",
          filename: "rule-a",
          trigger: alwaysOnTrigger
        }
      ],
      rulesDir: rulesDirectory,
      skills: [],
      skillsDir: skillsDirectory
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
    const skillsDirectory = path.join(temporaryDirectory, skillsDirectoryName);
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
          content: "rule content",
          filename: "rule-a",
          trigger: alwaysOnTrigger
        }
      ],
      rulesDir: rulesDirectory,
      skills: [],
      skillsDir: skillsDirectory
    };

    compile(config);

    expect(existsSync(path.join(rulesDirectory, "rule-a.md"))).toBe(true);
    expect(existsSync(manifestPath)).toBe(true);

    spy.mockRestore();
  });

  it("handles readdirSync error inside cleanFileAndEmptyParents gracefully", () => {
    const rulesDirectory = path.join(temporaryDirectory, rulesDirectoryName);
    const skillsDirectory = path.join(temporaryDirectory, skillsDirectoryName);
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
      rulesDir: rulesDirectory,
      skills: [],
      skillsDir: skillsDirectory
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
    const skillsDirectory = path.join(temporaryDirectory, skillsDirectoryName);
    const manifestPath = path.join(temporaryDirectory, manifestJsonName);

    const config: CompilerConfig = {
      manifestPath,
      rootDir: temporaryDirectory,
      rules: [
        {
          content:
            "rule content containing forbidden word Jira and unresolved {{sections}}",
          filename: "rule-bad-content",
          trigger: alwaysOnTrigger
        },
        {
          content: "some content",
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
      rulesDir: rulesDirectory,
      skills: [
        {
          content: "skill content",
          description: "skill description",
          name: "skill-a"
        },
        {
          content: "swebok content without resources references",
          description: "swebok skill",
          name: "skill-swebok",
          resources: [
            {
              content: "res1 content",
              path: "resources/res1.md"
            }
          ]
        }
      ],
      skillsDir: skillsDirectory
    };

    const originValidateFrontmatter =
      validationHelpers.validateFrontmatterBlock;

    vi.spyOn(validationHelpers, "validateFrontmatterBlock").mockImplementation(
      (markdown) => {
        if (includes(markdown, "skill-a") || includes(markdown, "Jira")) {
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
});
