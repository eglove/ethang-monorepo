import { describe, expect, it } from "vitest";

import type { RuleDefinition, Section, SkillDefinition } from "./define.ts";

import {
  renderJson,
  resolveSections,
  ruleMarkdown,
  skillMarkdown
} from "./render.ts";

const baseRule: RuleDefinition = {
  content: "Rule body.",
  filename: "philosophy",
  trigger: "always_on"
};

const baseSkill: SkillDefinition = {
  content: "Skill body.",
  description: "Does a thing. Use when the user asks for the thing.",
  name: "my-skill"
};

describe("resolveSections", () => {
  const sectionA: Section = { content: "Alpha.", id: "a", label: "A" };
  const sectionB: Section = { content: "Beta.", id: "b", label: "B" };

  it("joins section contents with a horizontal rule", () => {
    expect(resolveSections([sectionA, sectionB], "test")).toBe(
      "Alpha.\n\n---\n\nBeta."
    );
  });

  it("dedupes sections by id", () => {
    expect(resolveSections([sectionA, sectionA, sectionB], "test")).toBe(
      "Alpha.\n\n---\n\nBeta."
    );
  });

  it("accepts a section whose dependsOn id is declared", () => {
    const dependent: Section = {
      content: "Gamma.",
      dependsOn: ["a"],
      id: "c",
      label: "C"
    };

    expect(resolveSections([sectionA, dependent], "test")).toBe(
      "Alpha.\n\n---\n\nGamma."
    );
  });

  it("throws when a dependsOn id is not declared", () => {
    const dependent: Section = {
      content: "Gamma.",
      dependsOn: ["missing"],
      id: "c",
      label: "C"
    };

    expect(() => {
      return resolveSections([dependent], "test");
    }).toThrow(/missing/u);
  });
});

describe("skillMarkdown", () => {
  it("emits frontmatter, a blank line, the body, and a trailing newline", () => {
    expect(skillMarkdown(baseSkill)).toBe(
      "---\ndescription: Does a thing. Use when the user asks for the thing.\nname: my-skill\n---\n\nSkill body.\n"
    );
  });

  it("throws when the description contains a newline", () => {
    expect(() => {
      skillMarkdown({ ...baseSkill, description: "a\nb" });
    }).toThrow(/newline/u);
  });

  it("double-quotes a description containing a colon-space", () => {
    expect(
      skillMarkdown({
        ...baseSkill,
        description: "Create a commit: proposal, review, message."
      })
    ).toBe(
      '---\ndescription: "Create a commit: proposal, review, message."\nname: my-skill\n---\n\nSkill body.\n'
    );
  });

  it("escapes embedded double quotes when quoting", () => {
    expect(
      skillMarkdown({
        ...baseSkill,
        description: 'Ask "why: really?" five times.'
      })
    ).toBe(
      '---\ndescription: "Ask \\"why: really?\\" five times."\nname: my-skill\n---\n\nSkill body.\n'
    );
  });

  it("replaces the sections token when sections are declared", () => {
    const skill: SkillDefinition = {
      ...baseSkill,
      content: "Intro.\n\n{{sections}}\n\nOutro.",
      sections: [{ content: "Shared.", id: "shared", label: "Shared" }]
    };

    expect(skillMarkdown(skill)).toContain("Intro.\n\nShared.\n\nOutro.");
  });

  it("does not replace sections token when sections is empty list", () => {
    const skill: SkillDefinition = {
      ...baseSkill,
      sections: []
    };

    expect(skillMarkdown(skill)).toBe(
      "---\ndescription: Does a thing. Use when the user asks for the thing.\nname: my-skill\n---\n\nSkill body.\n"
    );
  });

  it("throws when sections are declared but the token is missing", () => {
    const skill: SkillDefinition = {
      ...baseSkill,
      sections: [{ content: "Shared.", id: "shared", label: "Shared" }]
    };

    expect(() => {
      return skillMarkdown(skill);
    }).toThrow(/\{\{sections\}\}/u);
  });
});

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
