import endsWith from "lodash/endsWith.js";
import filter from "lodash/filter.js";
import isString from "lodash/isString.js";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { RuleDefinition } from "./define.ts";

import {
  findDuplicateRuleFilenames,
  findUnresolvedTokens,
  isValidFrontmatterBlock
} from "./validate.ts";

describe("validateFrontmatterBlock", () => {
  it.each([
    ["---\ntrigger: always_on\n---\n\nBody.\n", true],
    ["---\nname: x\ndescription: y\n---\n\nBody.\n", true],
    ["no frontmatter at all", false],
    ["---\nbad line without colon\n---\n", false],
    ["---\ntrigger: always_on\n", false]
  ])("classifies %j as %s", (markdown, expected) => {
    expect(isValidFrontmatterBlock(markdown)).toBe(expected);
  });
});

const makeRule = (filename: string): RuleDefinition => {
  return { content: "x", filename, trigger: "always_on" };
};

describe("findDuplicateRuleFilenames", () => {
  it("returns no duplicates for unique filenames", () => {
    expect(
      findDuplicateRuleFilenames([makeRule("a"), makeRule("b")])
    ).toStrictEqual([]);
  });

  it("reports each duplicated filename once", () => {
    expect(
      findDuplicateRuleFilenames([
        makeRule("a"),
        makeRule("a"),
        makeRule("b"),
        makeRule("a")
      ])
    ).toStrictEqual(["a"]);
  });
});

describe("findUnresolvedTokens", () => {
  let directory = "";

  beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), "agents-build-test-"));
  });

  afterEach(() => {
    rmSync(directory, { force: true, recursive: true });
  });

  it("finds markdown files containing the sections token", () => {
    mkdirSync(path.join(directory, "nested"));
    writeFileSync(path.join(directory, "clean.md"), "All resolved.", "utf8");
    writeFileSync(
      path.join(directory, "nested", "dirty.md"),
      "Oops {{sections}} left over.",
      "utf8"
    );
    writeFileSync(path.join(directory, "ignored.json"), "{{sections}}", "utf8");

    const violations = findUnresolvedTokens(directory);

    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain("dirty.md");
  });

  it("returns nothing for a clean tree", () => {
    writeFileSync(path.join(directory, "clean.md"), "All resolved.", "utf8");

    expect(findUnresolvedTokens(directory)).toStrictEqual([]);
  });
});

describe("definePlugin check", () => {
  it("ensures no active source files import definePlugin", () => {
    const sourceDirectory = import.meta.dirname;
    const allFiles = readdirSync(sourceDirectory, { recursive: true });
    const stringFiles = filter(allFiles, isString);
    const tsFiles = filter(stringFiles, (file) => {
      return endsWith(file, ".ts") && !endsWith(file, ".test.ts");
    });

    const badFiles: string[] = [];
    for (const file of tsFiles) {
      const filePath = path.join(sourceDirectory, file);
      const content = readFileSync(filePath, "utf8");
      if (/import\s*\{[^}]*definePlugin[^}]*\}\s*from/u.test(content)) {
        badFiles.push(file);
      }
    }

    expect(badFiles).toEqual([]);
  });
});
