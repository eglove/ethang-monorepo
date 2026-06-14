import find from "lodash/find.js";
import { describe, expect, it } from "vitest";

import { GLOBAL_RULES } from "./global.ts";

describe("GLOBAL_RULES lint rule", () => {
  it("has a rule with filename 'lint' and trigger 'model_decision'", () => {
    const lintRule = find(GLOBAL_RULES, (rule) => {
      return "lint" === rule.filename;
    });

    expect(lintRule).toBeDefined();
    expect(lintRule?.trigger).toBe("model_decision");
    expect(lintRule?.description).toBe(
      "linting, fixing lint errors, formatting, typescript checks, or type errors"
    );
  });

  it("contains the ESLint troubleshooting sections and learned linting lessons", () => {
    const lintRule = find(GLOBAL_RULES, (rule) => {
      return "lint" === rule.filename;
    });

    expect(lintRule).toBeDefined();
    const content = lintRule?.content ?? "";

    expect(content).toContain("ESLint Troubleshooting & User Collaboration");
    expect(content).toContain("ESLint Auto-Fix Cycle Deadlock");
    expect(content).toContain("Lodash Imports Must Be Individual");
    expect(content).toContain("Explicit Returns in attempt/attemptAsync");
    expect(content).toContain("Avoid Explicit Returns");
    expect(content).toContain("Lodash isNil for Nullable Checks");
    expect(content).toContain("ESLint and Lodash Compliance");
    expect(content).toContain("Strict TypeScript/ESLint checks");
  });

  it("contains style guidelines from eslint-fixer", () => {
    const lintRule = find(GLOBAL_RULES, (rule) => {
      return "lint" === rule.filename;
    });

    expect(lintRule).toBeDefined();
    const content = lintRule?.content ?? "";

    expect(content).toContain("Yoda comparisons");
    expect(content).toContain("Arrow function blocks");
    expect(content).toContain("Arrow functions");
    expect(content).toContain("Explicit member accessibility");
    expect(content).toContain("typescript type definitions");
    expect(content).toContain("consistent-type-imports");
    expect(content).toContain("React 19 rules");
    expect(content).toContain("Ng signals and DI");
    expect(content).toContain("Vitest spec checks");
  });

  it("contains linter conflict solutions and security mitigations", () => {
    const lintRule = find(GLOBAL_RULES, (rule) => {
      return "lint" === rule.filename;
    });

    expect(lintRule).toBeDefined();
    const content = lintRule?.content ?? "";

    expect(content).toContain("Mock Promise auto-fix deadlock loops");
    expect(content).toContain("use lodash over native array methods");
    expect(content).toContain("use isNil, isString instead of !!");
    expect(content).toContain(
      "perfectionist object sorting vs partition comments"
    );
    expect(content).toContain("SR-1");
    expect(content).toContain("SR-3");
    expect(content).toContain("SR-7");
  });
});

describe("GLOBAL_RULES esCli rule", () => {
  it("contains the Everything Search CLI fallback guideline in 'es-cli'", () => {
    const esCliRule = find(GLOBAL_RULES, (rule) => {
      return "es-cli" === rule.filename;
    });

    expect(esCliRule).toBeDefined();
    const content = esCliRule?.content ?? "";
    expect(content).toContain("Everything Search CLI (es) Fallback");
  });
});

describe("GLOBAL_RULES jqCli rule", () => {
  it("contains the jq processor reference", () => {
    const jqCliRule = find(GLOBAL_RULES, (rule) => {
      return "jq-cli" === rule.filename;
    });

    expect(jqCliRule).toBeDefined();
    expect(jqCliRule?.trigger).toBe("always_on");
    const content = jqCliRule?.content ?? "";
    expect(content).toContain("jq (JSON processor) Reference");
    expect(content).toContain("--null-input");
  });
});

describe("GLOBAL_RULES rgCli rule", () => {
  it("contains the ripgrep reference", () => {
    const rgCliRule = find(GLOBAL_RULES, (rule) => {
      return "rg-cli" === rule.filename;
    });

    expect(rgCliRule).toBeDefined();
    expect(rgCliRule?.trigger).toBe("always_on");
    const content = rgCliRule?.content ?? "";
    expect(content).toContain("ripgrep (rg) Reference");
    expect(content).toContain("--ignore-case");
  });
});

describe("GLOBAL_RULES webstormMcp rule", () => {
  it("contains the WebStorm MCP guidelines in 'webstorm-mcp'", () => {
    const webstormMcpRule = find(GLOBAL_RULES, (rule) => {
      return "webstorm-mcp" === rule.filename;
    });

    expect(webstormMcpRule).toBeDefined();
    const content = webstormMcpRule?.content ?? "";
    expect(content).toContain("WebStorm MCP Argument Nesting");
    expect(content).toContain("WebStorm MCP replace_text_in_file Parameter");
    expect(content).toContain("WebStorm Text Search");
    expect(content).toContain("IDE Write Synchronization");
  });
});

describe("GLOBAL_RULES new transition rules", () => {
  it("has tdd-principles rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "tdd-principles" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toContain("Red-Green-Refactor");
    expect(rule?.content).toContain("Scientific Method");
    expect(rule?.content).toContain("Parameterized Tests");
  });

  it("has git-workflow rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "git-workflow" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toBe(
      "staging changes, creating commits, amending commits, or generating git PRs"
    );
    expect(rule?.content).toContain("# Git Workflow");
  });

  it("has review-pipeline rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "review-pipeline" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toBe(
      "reviewing pull requests, verifying code changes, or writing review comments"
    );
    expect(rule?.content).toContain("# PR Review");
  });

  it("has swebok rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "swebok" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toBe(
      "software engineering vocabulary, cross-cutting terms, SWEBOK, or software engineering standards"
    );
    expect(rule?.content).toContain("# SWEBOK v4 — Chapter Index");
  });

  it.each<[string, string, string, string]>([
    ["01", "requirements", "Software Requirements", "Software Requirements"],
    ["02", "architecture", "Software Architecture", "Software Architecture"],
    ["03", "design", "Software Design", "Software Design"],
    ["04", "construction", "Software Construction", "Software Construction"],
    ["05", "testing", "Software Testing", "Software Testing"],
    [
      "06",
      "operations",
      "Software Engineering Operations",
      "Software Operations"
    ],
    ["07", "maintenance", "Software Maintenance", "Software Maintenance"],
    [
      "08",
      "configuration",
      "Software Configuration Management",
      "Software Configuration Management"
    ],
    [
      "09",
      "management",
      "Software Engineering Management",
      "Software Engineering Management"
    ],
    [
      "10",
      "process",
      "Software Engineering Process",
      "Software Engineering Process"
    ],
    [
      "11",
      "models",
      "Software Engineering Models and Methods",
      "Software Engineering Models and Methods"
    ],
    ["12", "quality", "Software Quality", "Software Quality"],
    ["13", "security", "Software Security", "Software Security"],
    [
      "14",
      "professional",
      "Software Engineering Professional Practice",
      "Software Engineering Professional Practice"
    ],
    [
      "15",
      "economics",
      "Software Engineering Economics",
      "Software Engineering Economics"
    ],
    ["16", "computing", "Computing Foundations", "Computing Foundations"],
    ["17", "math", "Mathematical Foundations", "Mathematical Foundations"],
    ["18", "engineering", "Engineering Foundations", "Engineering Foundations"]
  ])(
    "has swebok-ch%s-%s rule registered",
    (chNumber, chName, chTitle, descTitle) => {
      const ruleFilename = `swebok-ch${chNumber}-${chName}`;
      const rule = find(GLOBAL_RULES, (r) => {
        return ruleFilename === r.filename;
      });
      expect(rule).toBeDefined();
      expect(rule?.trigger).toBe("model_decision");
      expect(rule?.description).toContain(descTitle);
      expect(rule?.content).toContain(chTitle);
    }
  );
});

describe("GLOBAL_RULES additional transition rules", () => {
  it("has tdd-state-coverage rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "tdd-state-coverage" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toContain("FSM");
    expect(rule?.content).toContain("Mental Model");
    expect(rule?.content).toContain("State Table Template");
  });

  it("has tdd-test-as-documentation rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "tdd-test-as-documentation" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toContain("test naming");
    expect(rule?.content).toContain("Tests as Executable Documentation");
    expect(rule?.content).toContain("Assertions Document Contracts");
  });

  it("has ddd-strategic rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "ddd-strategic" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toContain("bounded contexts");
    expect(rule?.content).toContain("DDD Strategic Lens");
    expect(rule?.content).toContain("Ubiquitous Language");
  });

  it("has ddd-tactical rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "ddd-tactical" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toContain("CQRS");
    expect(rule?.content).toContain("DDD Tactical Patterns");
    expect(rule?.content).toContain("Specification Pattern");
  });

  it("has rca-five-whys rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "rca-five-whys" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toContain("5-Whys");
    expect(rule?.content).toContain("Bug Root Cause Analysis");
    expect(rule?.content).toContain("Defect Classification");
  });

  it("has requirements-engineering rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "requirements-engineering" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toContain("requirements analysis");
    expect(rule?.content).toContain("Functional Requirements");
    expect(rule?.content).toContain("requirements.md");
  });

  it("has execution-planning rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "execution-planning" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toContain("execution planning");
    expect(rule?.content).toContain("execution-plan.md");
    expect(rule?.content).toContain("STRIDE");
  });

  it("has code-verification rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "code-verification" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toContain("code verification");
    expect(rule?.content).toContain("SonarCloud");
    expect(rule?.content).toContain("OWASP Top 10");
  });

  it("has review-design-checklist rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "review-design-checklist" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toContain("React component design");
    expect(rule?.content).toContain("Drizzle-Specific Design");
    expect(rule?.content).toContain("CQRS");
  });

  it("has review-security-checklist rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "review-security-checklist" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toContain("security vulnerabilities");
    expect(rule?.content).toContain("dangerouslySetInnerHTML");
    expect(rule?.content).toContain("PII and Privacy");
  });
});

describe("GLOBAL_RULES role rules", () => {
  it("has role-planner rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "role-planner" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toContain("acting as a planner");
  });

  it("has role-test-writer rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "role-test-writer" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toContain("acting as a test-writer");
  });

  it("has role-implementer rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "role-implementer" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toContain("acting as an implementer");
  });

  it("has role-rca rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "role-rca" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toContain("performing bug root cause analysis");
  });

  it("has role-requirements-analyst rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "role-requirements-analyst" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toContain("acting as a requirements-analyst");
  });

  it("has role-requirements-writer rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "role-requirements-writer" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toContain("acting as a requirements-writer");
  });

  it("has role-security-analyst rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "role-security-analyst" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toContain("acting as a security-analyst");
  });

  it("has role-quality-analyst rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "role-quality-analyst" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toContain("acting as a quality-analyst");
  });

  it("has role-reviewer rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "role-reviewer" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toContain("acting as a reviewer");
  });

  it("has role-reporter rule", () => {
    const rule = find(GLOBAL_RULES, (r) => {
      return "role-reporter" === r.filename;
    });
    expect(rule).toBeDefined();
    expect(rule?.trigger).toBe("model_decision");
    expect(rule?.description).toContain("acting as a reporter");
  });
});
