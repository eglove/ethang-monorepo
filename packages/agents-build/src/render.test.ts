import { describe, expect, it } from "vitest";

import type {
  RuleDefinition,
  Section,
  SkillDefinition,
  SkillReference
} from "./define.ts";

import {
  pluginJson,
  renderJson,
  renderRuleFrontmatter,
  renderSkillFrontmatter,
  resolveSections,
  resolveSkillReferences,
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

describe("renderRuleFrontmatter", () => {
  it("renders always_on with only the trigger line", () => {
    expect(renderRuleFrontmatter(baseRule)).toBe(
      "---\ntrigger: always_on\n---\n"
    );
  });

  it("renders manual with only the trigger line", () => {
    expect(renderRuleFrontmatter({ ...baseRule, trigger: "manual" })).toBe(
      "---\ntrigger: manual\n---\n"
    );
  });

  it("renders model_decision with its description", () => {
    expect(
      renderRuleFrontmatter({
        ...baseRule,
        description: "running tests in this monorepo",
        trigger: "model_decision"
      })
    ).toBe(
      "---\ntrigger: model_decision\ndescription: running tests in this monorepo\n---\n"
    );
  });

  it("renders glob with its globs", () => {
    expect(
      renderRuleFrontmatter({
        ...baseRule,
        globs: "**/*.test.ts",
        trigger: "glob"
      })
    ).toBe("---\ntrigger: glob\nglobs: **/*.test.ts\n---\n");
  });

  it("throws when model_decision has no description", () => {
    expect(() => {
      renderRuleFrontmatter({ ...baseRule, trigger: "model_decision" });
    }).toThrow(/model_decision/u);
  });

  it("throws when glob has no globs", () => {
    expect(() => {
      renderRuleFrontmatter({ ...baseRule, trigger: "glob" });
    }).toThrow(/glob/u);
  });

  it("throws when a value contains a newline", () => {
    expect(() => {
      renderRuleFrontmatter({
        ...baseRule,
        description: "line one\nline two",
        trigger: "model_decision"
      });
    }).toThrow(/newline/u);
  });
});

describe("renderSkillFrontmatter", () => {
  it("renders name then description", () => {
    expect(renderSkillFrontmatter(baseSkill)).toBe(
      "---\nname: my-skill\ndescription: Does a thing. Use when the user asks for the thing.\n---\n"
    );
  });

  it("throws when the description contains a newline", () => {
    expect(() => {
      renderSkillFrontmatter({ ...baseSkill, description: "a\nb" });
    }).toThrow(/newline/u);
  });

  it("double-quotes a description containing a colon-space", () => {
    expect(
      renderSkillFrontmatter({
        ...baseSkill,
        description: "Create a commit: proposal, review, message."
      })
    ).toBe(
      '---\nname: my-skill\ndescription: "Create a commit: proposal, review, message."\n---\n'
    );
  });

  it("escapes embedded double quotes when quoting", () => {
    expect(
      renderSkillFrontmatter({
        ...baseSkill,
        description: 'Ask "why: really?" five times.'
      })
    ).toBe(
      '---\nname: my-skill\ndescription: "Ask \\"why: really?\\" five times."\n---\n'
    );
  });
});

describe("renderRuleFrontmatter yaml quoting", () => {
  it("double-quotes a model_decision description containing a colon-space", () => {
    expect(
      renderRuleFrontmatter({
        content: "x",
        description: "reviewing: a PR or diff",
        filename: "edge",
        trigger: "model_decision"
      })
    ).toBe(
      '---\ntrigger: model_decision\ndescription: "reviewing: a PR or diff"\n---\n'
    );
  });
});

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

describe("resolveSkillRefs", () => {
  const referenceOne: SkillReference = {
    description: "Read before writing tests.",
    skill: "tdd-state-coverage"
  };
  const referenceTwo: SkillReference = {
    description: "Read during review.",
    skill: "ddd-tactical"
  };

  it("renders a Skills heading with one block per ref", () => {
    expect(resolveSkillReferences([referenceOne, referenceTwo])).toBe(
      "## Skills\n\n### `tdd-state-coverage`\n\nRead before writing tests.\n\n### `ddd-tactical`\n\nRead during review."
    );
  });

  it("dedupes refs by skill name", () => {
    expect(resolveSkillReferences([referenceOne, referenceOne])).toBe(
      "## Skills\n\n### `tdd-state-coverage`\n\nRead before writing tests."
    );
  });
});

describe("skillMarkdown", () => {
  it("emits frontmatter, a blank line, the body, and a trailing newline", () => {
    expect(skillMarkdown(baseSkill)).toBe(
      "---\nname: my-skill\ndescription: Does a thing. Use when the user asks for the thing.\n---\n\nSkill body.\n"
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

  it("appends skill refs after sections in the token replacement", () => {
    const skill: SkillDefinition = {
      ...baseSkill,
      content: "{{sections}}",
      sections: [{ content: "Shared.", id: "shared", label: "Shared" }],
      skillRefs: [{ description: "Use it.", skill: "other-skill" }]
    };

    expect(skillMarkdown(skill)).toContain(
      "Shared.\n\n---\n\n## Skills\n\n### `other-skill`\n\nUse it."
    );
  });

  it("replaces the token with only skill refs when no sections are declared", () => {
    const skill: SkillDefinition = {
      ...baseSkill,
      content: "{{sections}}",
      skillRefs: [{ description: "Use it.", skill: "other-skill" }]
    };

    expect(skillMarkdown(skill)).toContain(
      "## Skills\n\n### `other-skill`\n\nUse it."
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
});

describe("pluginJson", () => {
  it("emits the plugin marker with a trailing newline", () => {
    expect(pluginJson("tdd")).toBe('{\n  "name": "tdd"\n}\n');
  });
});

describe("renderJson", () => {
  it("emits stable two-space JSON with a trailing newline", () => {
    expect(renderJson({ a: [true], b: 1 })).toBe(
      '{\n  "a": [\n    true\n  ],\n  "b": 1\n}\n'
    );
  });
});
