import repeat from "lodash/repeat.js";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { PluginDefinition, RuleDefinition } from "./define.ts";

import {
  checkRuleSize,
  findDuplicateRuleFilenames,
  findForbiddenStrings,
  findUnresolvedTokens,
  validateFrontmatterBlock,
  validateSkillReferenceIntegrity,
  validateSwebokGuard
} from "./validate.ts";

describe("validateFrontmatterBlock", () => {
  it.each([
    ["---\ntrigger: always_on\n---\n\nBody.\n", true],
    ["---\nname: x\ndescription: y\n---\n\nBody.\n", true],
    ["no frontmatter at all", false],
    ["---\nbad line without colon\n---\n", false],
    ["---\ntrigger: always_on\n", false]
  ])("classifies %j as %s", (markdown, expected) => {
    expect(validateFrontmatterBlock(markdown)).toBe(expected);
  });
});

describe("checkRuleSize", () => {
  it.each([
    [9999, "ok"],
    [10_000, "warn"],
    [12_000, "warn"],
    [12_001, "fail"]
  ])("classifies %i chars as %s", (length, status) => {
    expect(checkRuleSize(repeat("x", length))).toStrictEqual({
      length,
      status
    });
  });
});

describe("findForbiddenStrings", () => {
  it.each([
    ["This came from a NISC workflow.", ["NISC"]],
    ["Fetch the Jira ticket first.", ["Jira"]],
    ["Post the diff to Stash for review.", ["Stash"]],
    ["Dispatch an NGXS action.", ["NGXS"]],
    ["Use the Angular CLI.", ["Angular"]],
    ["Call mcp__webstorm__get_file_problems.", ["mcp__webstorm"]],
    ["Call mcp__intellij__get_file_problems.", ["mcp__intellij"]],
    ["Gate on AskUserQuestion before continuing.", ["AskUserQuestion"]],
    ['Spawn it with subagent_type: "planner".', ["subagent_type"]],
    ["Check the knowledge graph for flows.", ["knowledge graph"]],
    ["Write a JUnit 5 parameterized test.", ["JUnit"]]
  ])("flags %j as %j", (content, expected) => {
    expect(findForbiddenStrings(content)).toStrictEqual(expected);
  });

  it.each([
    ["Run git stash before switching branches."],
    ["Write a Vitest it.each table for every state."],
    ["Use Hono middleware on the Cloudflare Worker."]
  ])("does not flag clean content %j", (content) => {
    expect(findForbiddenStrings(content)).toStrictEqual([]);
  });

  it("reports each forbidden name once per content", () => {
    expect(findForbiddenStrings("NISC and more NISC plus Jira")).toStrictEqual([
      "NISC",
      "Jira"
    ]);
  });
});

describe("validateSkillRefIntegrity", () => {
  const plugin: PluginDefinition = {
    name: "tdd",
    skills: [
      {
        content: "{{sections}}",
        description: "Pipeline.",
        name: "tdd-pipeline",
        skillRefs: [{ description: "Use it.", skill: "ddd-tactical" }]
      },
      { content: "Tactics.", description: "DDD tactics.", name: "ddd-tactical" }
    ]
  };

  it("returns no violations when refs point at sibling skills", () => {
    expect(validateSkillReferenceIntegrity(plugin)).toStrictEqual([]);
  });

  it("reports refs that point at skills missing from the plugin", () => {
    const [firstSkill] = plugin.skills;

    if (undefined === firstSkill) {
      throw new Error("test setup: plugin must have at least one skill");
    }

    const broken: PluginDefinition = {
      ...plugin,
      skills: [firstSkill]
    };

    expect(validateSkillReferenceIntegrity(broken)).toStrictEqual([
      'tdd/tdd-pipeline -> missing sibling skill "ddd-tactical"'
    ]);
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

describe("validateSwebokGuard", () => {
  const resources = [
    "resources/ch01-requirements.md",
    "resources/ch05-testing.md"
  ];

  it("returns nothing when every resource appears in the router", () => {
    const router =
      "| Ch 1 | resources/ch01-requirements.md |\n| Ch 5 | resources/ch05-testing.md |";

    expect(validateSwebokGuard(resources, router)).toStrictEqual([]);
  });

  it("reports resources absent from the router", () => {
    expect(
      validateSwebokGuard(
        resources,
        "| Ch 1 | resources/ch01-requirements.md |"
      )
    ).toStrictEqual(["resources/ch05-testing.md"]);
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
