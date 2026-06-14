import { describe, expect, it } from "vitest";

import type { RuleDefinition } from "./define.ts";

import { renderJson, ruleMarkdown } from "./render.ts";

const baseRule: RuleDefinition = {
  content: "Rule body.",
  filename: "philosophy",
  trigger: "always_on"
};

describe("ruleMarkdown", () => {
  it("emits frontmatter, a blank line, the content, and a trailing newline", () => {
    expect(ruleMarkdown(baseRule)).toBe(
      "---\ntrigger: always_on\n---\n\nRule body.\n"
    );
  });

  it("renders manual with only the trigger line", () => {
    expect(ruleMarkdown({ ...baseRule, trigger: "manual" })).toBe(
      "---\ntrigger: manual\n---\n\nRule body.\n"
    );
  });

  it("emits frontmatter with description for model_decision trigger", () => {
    const rule: RuleDefinition = {
      ...baseRule,
      description: "running tests in this monorepo",
      trigger: "model_decision"
    };
    expect(ruleMarkdown(rule)).toBe(
      "---\ndescription: running tests in this monorepo\ntrigger: model_decision\n---\n\nRule body.\n"
    );
  });

  it("emits frontmatter with globs for glob trigger", () => {
    const rule: RuleDefinition = {
      ...baseRule,
      globs: "**/*.test.ts",
      trigger: "glob"
    };
    expect(ruleMarkdown(rule)).toBe(
      "---\nglobs: **/*.test.ts\ntrigger: glob\n---\n\nRule body.\n"
    );
  });

  it("throws when model_decision has no description", () => {
    expect(() => {
      ruleMarkdown({ ...baseRule, trigger: "model_decision" });
    }).toThrow(/model_decision/u);
  });

  it("throws when glob has no globs", () => {
    expect(() => {
      ruleMarkdown({ ...baseRule, trigger: "glob" });
    }).toThrow(/glob/u);
  });

  it("throws when a value contains a newline", () => {
    expect(() => {
      ruleMarkdown({
        ...baseRule,
        description: "line one\nline two",
        trigger: "model_decision"
      });
    }).toThrow(/newline/u);
  });

  it("double-quotes a model_decision description containing a colon-space", () => {
    expect(
      ruleMarkdown({
        ...baseRule,
        content: "Rule body.",
        description: "reviewing: a PR or diff",
        trigger: "model_decision"
      })
    ).toBe(
      '---\ndescription: "reviewing: a PR or diff"\ntrigger: model_decision\n---\n\nRule body.\n'
    );
  });
});

describe("renderJson", () => {
  it("emits stable two-space JSON with a trailing newline", () => {
    expect(renderJson({ a: [true], b: 1 })).toBe(
      '{\n  "a": [\n    true\n  ],\n  "b": 1\n}\n'
    );
  });
});
