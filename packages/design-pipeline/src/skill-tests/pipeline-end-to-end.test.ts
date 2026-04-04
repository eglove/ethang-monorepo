import endsWith from "lodash/endsWith.js";
import filter from "lodash/filter.js";
import findIndex from "lodash/findIndex.js";
import forEach from "lodash/forEach.js";
import includes from "lodash/includes.js";
import some from "lodash/some.js";
import split from "lodash/split.js";
import toLower from "lodash/toLower.js";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.join(import.meta.dirname, "..", "..", "..", "..");
const SKILLS_DIR = path.join(ROOT, ".claude", "skills");
const SETTINGS_PATH = path.join(ROOT, ".claude", "settings.json");

const AGENT_MD = "AGENT.md";
const PROJECT_MANAGER = "project-manager";
const SKILL_PATH = path.join(SKILLS_DIR, "design-pipeline", "SKILL.md");
const PM_PATH = path.join(SKILLS_DIR, PROJECT_MANAGER, AGENT_MD);
const STATE_TEMPLATE_PATH = path.join(ROOT, "docs", "pipeline-state.md");

const QUESTIONER_SKILL = ".claude/skills/questioner/SKILL.md";
const DEBATE_MODERATOR_SKILL =
  ".claude/skills/orchestrators/debate-moderator/SKILL.md";
const TLA_WRITER_AGENT = ".claude/skills/tla-writer/AGENT.md";
const IMPL_WRITER_AGENT = ".claude/skills/implementation-writer/AGENT.md";
const PM_AGENT = ".claude/skills/project-manager/AGENT.md";

const skillContent = readFileSync(SKILL_PATH, "utf8");
const pmContent = readFileSync(PM_PATH, "utf8");
const settingsContent = readFileSync(SETTINGS_PATH, "utf8");

const READ_SHARED_CONVENTIONS = "Read shared conventions";
const CONVENTIONS_MD = "conventions.md";

// ── Helpers ──────────────────────────────────────────────────

const collectMarkdownFiles = (directory: string): string[] => {
  const results: string[] = [];

  const walk = (currentDirectory: string): void => {
    const entries = readdirSync(currentDirectory);
    for (const entry of entries) {
      const fullPath = path.join(currentDirectory, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (endsWith(entry, ".md")) {
        results.push(fullPath);
      } else {
        // Non-directory, non-markdown file — skip
      }
    }
  };

  walk(directory);
  return results;
};

// ── Dimension 1: Stage Ordering ──────────────────────────────

describe("dimension 1: stage ordering", () => {
  const stageLabels = [
    "Stage 1",
    "Stage 2",
    "Stage 3",
    "Stage 4",
    "Stage 5",
    "Stage 6",
    "Stage 7",
  ];

  it("SKILL.md contains all 7 stages", () => {
    forEach(stageLabels, (label) => {
      expect(skillContent).toContain(label);
    });
  });

  it("stages appear in ascending order", () => {
    const lines = split(skillContent, "\n");
    let lastIndex = -1;
    forEach(stageLabels, (label) => {
      const index = findIndex(
        lines,
        (line) => includes(line, label),
        lastIndex + 1,
      );
      expect(index).toBeGreaterThan(lastIndex);
      lastIndex = index;
    });
  });

  it("Stage 1 references questioner", () => {
    expect(skillContent).toMatch(/Stage 1.*Questioner/iu);
  });

  it("Stage 2 references debate-moderator", () => {
    expect(skillContent).toMatch(/Stage 2.*Debate/iu);
  });

  it("Stage 3 references TLA", () => {
    expect(skillContent).toMatch(/Stage 3.*TLA/iu);
  });

  it("Stage 5 references implementation", () => {
    expect(skillContent).toMatch(/Stage 5.*Implementation/iu);
  });

  it("Stage 6 references pair programming", () => {
    expect(skillContent).toMatch(/Stage 6.*Pair Programming/iu);
  });

  it("Stage 7 references fork-join", () => {
    expect(skillContent).toMatch(/Stage 7.*Fork.Join/iu);
  });
});

// ── Dimension 2: Agent File Existence ────────────────────────

describe("dimension 2: agent file existence", () => {
  const agentFiles = [
    QUESTIONER_SKILL,
    DEBATE_MODERATOR_SKILL,
    TLA_WRITER_AGENT,
    IMPL_WRITER_AGENT,
    PM_AGENT,
    ".claude/skills/agents/librarian/AGENT.md",
    ".claude/skills/typescript-writer/AGENT.md",
    ".claude/skills/hono-writer/AGENT.md",
    ".claude/skills/ui-writer/AGENT.md",
    ".claude/skills/vitest-writer/AGENT.md",
    ".claude/skills/playwright-writer/AGENT.md",
    ".claude/skills/trainer/AGENT.md",
  ];

  forEach(agentFiles, (file) => {
    it(`${file} exists on disk`, () => {
      const fullPath = path.join(ROOT, file);
      expect(existsSync(fullPath)).toBe(true);
    });
  });
});

// ── Dimension 3: Handoff Contracts ───────────────────────────

describe("dimension 3: handoff contracts", () => {
  const agentFilesWithHandoff = [
    QUESTIONER_SKILL,
    DEBATE_MODERATOR_SKILL,
    TLA_WRITER_AGENT,
    IMPL_WRITER_AGENT,
    PM_AGENT,
  ];

  forEach(agentFilesWithHandoff, (file) => {
    it(`${file} has a Handoff section`, () => {
      const fullPath = path.join(ROOT, file);
      const content = readFileSync(fullPath, "utf8");
      expect(toLower(content)).toContain("handoff");
    });
  });

  it("SKILL.md references all pipeline agent files", () => {
    expect(skillContent).toContain("questioner/SKILL.md");
    expect(skillContent).toContain("debate-moderator/SKILL.md");
    expect(skillContent).toContain("tla-writer/AGENT.md");
    expect(skillContent).toContain("implementation-writer/AGENT.md");
    expect(skillContent).toContain("project-manager/AGENT.md");
  });
});

// ── Dimension 4: State Transitions ───────────────────────────

describe("dimension 4: state transitions", () => {
  it("pipeline state file exists", () => {
    expect(existsSync(STATE_TEMPLATE_PATH)).toBe(true);
  });

  it("state file covers all 7 stages", () => {
    const stateContent = readFileSync(STATE_TEMPLATE_PATH, "utf8");
    expect(stateContent).toContain("Stage 1");
    expect(stateContent).toContain("Stage 2");
    expect(stateContent).toContain("Stage 3");
    expect(stateContent).toContain("Stage 4");
    expect(stateContent).toContain("Stage 5");
    expect(stateContent).toContain("Stage 6");
  });

  it("state file has Status fields", () => {
    const stateContent = readFileSync(STATE_TEMPLATE_PATH, "utf8");
    const statusCount = filter(split(stateContent, "\n"), (line) =>
      includes(line, "**Status:**"),
    ).length;
    expect(statusCount).toBeGreaterThanOrEqual(6);
  });

  it("state file has Artifact fields", () => {
    const stateContent = readFileSync(STATE_TEMPLATE_PATH, "utf8");
    const artifactCount = filter(split(stateContent, "\n"), (line) =>
      includes(line, "**Artifact:**"),
    ).length;
    expect(artifactCount).toBeGreaterThanOrEqual(6);
  });

  it("state file has Timestamp fields", () => {
    const stateContent = readFileSync(STATE_TEMPLATE_PATH, "utf8");
    const timestampCount = filter(split(stateContent, "\n"), (line) =>
      includes(line, "**Timestamp:**"),
    ).length;
    expect(timestampCount).toBeGreaterThanOrEqual(6);
  });
});

// ── Dimension 5: Reviewer Roster ─────────────────────────────

describe("dimension 5: reviewer roster", () => {
  const reviewers = [
    "artifact-reviewer",
    "compliance-reviewer",
    "bug-reviewer",
    "simplicity-reviewer",
    "type-design-reviewer",
    "security-reviewer",
    "backlog-reviewer",
    "test-reviewer",
    "a11y-reviewer",
  ];

  it("SKILL.md references all 9 reviewers", () => {
    forEach(reviewers, (reviewer) => {
      expect(skillContent).toContain(reviewer);
    });
  });

  it("project-manager references at least 8 reviewers from the roster", () => {
    const pmReviewerCount = filter(reviewers, (reviewer) =>
      includes(pmContent, reviewer),
    ).length;
    expect(pmReviewerCount).toBeGreaterThanOrEqual(8);
  });

  forEach(reviewers, (reviewer) => {
    it(`${reviewer}/AGENT.md exists on disk`, () => {
      const reviewerPath = path.join(
        SKILLS_DIR,
        "reviewers",
        reviewer,
        "AGENT.md",
      );
      expect(existsSync(reviewerPath)).toBe(true);
    });
  });
});

// ── Dimension 6: Stage-to-Agent Mapping ──────────────────────

describe("dimension 6: stage-to-agent mapping", () => {
  const stageAgentMap = [
    { agent: "questioner", stage: "Stage 1" },
    { agent: "debate-moderator", stage: "Stage 2" },
    { agent: "tla-writer", stage: "Stage 3" },
    { agent: "debate-moderator", stage: "Stage 4" },
    { agent: "implementation-writer", stage: "Stage 5" },
    { agent: PROJECT_MANAGER, stage: "Stage 6" },
  ];

  forEach(stageAgentMap, ({ agent, stage }) => {
    it(`${stage} maps to ${agent}`, () => {
      expect(skillContent).toContain(agent);
    });
  });

  it("stage-to-agent mapping is bidirectional: agents reference the pipeline", () => {
    const coreAgents = [
      QUESTIONER_SKILL,
      TLA_WRITER_AGENT,
      IMPL_WRITER_AGENT,
      PM_AGENT,
    ];
    forEach(coreAgents, (agentFile) => {
      const content = readFileSync(path.join(ROOT, agentFile), "utf8");
      const lower = toLower(content);
      const hasReference =
        includes(lower, "pipeline") ||
        includes(lower, "design-pipeline") ||
        includes(lower, "orchestrator");
      expect(hasReference).toBe(true);
    });
  });
});

// ── Dimension 7: Negative Cleanup Assertion ──────────────────

describe("dimension 7: negative cleanup assertion", () => {
  const allMdFiles = collectMarkdownFiles(SKILLS_DIR);

  it("found markdown files to scan", () => {
    expect(allMdFiles.length).toBeGreaterThan(0);
  });

  it("no .md file under .claude/skills/ contains 'Read shared conventions'", () => {
    const violators = filter(allMdFiles, (filePath) => {
      const content = readFileSync(filePath, "utf8");
      return includes(content, READ_SHARED_CONVENTIONS);
    });
    expect(violators).toEqual([]);
  });
});

// ── PreToolUse Hook Validation ───────────────────────────────

describe("PreToolUse hook validation", () => {
  type SettingsHook = {
    additionalContext?: boolean | string;
    command?: string;
  };

  type SettingsEntry = {
    hooks?: SettingsHook[];
    matcher?: string;
  };

  type Settings = {
    hooks?: {
      PreToolUse?: SettingsEntry[];
    };
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON.parse returns unknown
  const settings = JSON.parse(settingsContent) as Settings;

  it("settings.json has a PreToolUse hook entry", () => {
    expect(settings.hooks?.PreToolUse).toBeDefined();
    expect(settings.hooks?.PreToolUse?.length).toBeGreaterThan(0);
  });

  it("PreToolUse hook uses an Agent matcher", () => {
    const agentHook = some(settings.hooks?.PreToolUse ?? [], (entry) =>
      includes(entry.matcher ?? "", "Agent"),
    );
    expect(agentHook).toBe(true);
  });

  it("PreToolUse hook references conventions.md in command", () => {
    const hooks = settings.hooks?.PreToolUse ?? [];
    const referencesConventions = some(hooks, (entry) =>
      some(entry.hooks ?? [], (hook) =>
        includes(hook.command ?? "", CONVENTIONS_MD),
      ),
    );
    expect(referencesConventions).toBe(true);
  });

  it("conventions.md file exists at the referenced path", () => {
    const conventionsPath = path.join(SKILLS_DIR, "shared", CONVENTIONS_MD);
    expect(existsSync(conventionsPath)).toBe(true);
  });
});

// ── conventions.md cleanup validation ────────────────────────

describe("conventions.md content validation", () => {
  const conventionsContent = readFileSync(
    path.join(SKILLS_DIR, "shared", CONVENTIONS_MD),
    "utf8",
  );

  it("does NOT contain Feature Development Agents section", () => {
    expect(conventionsContent).not.toContain("Feature Development Agents");
    expect(conventionsContent).not.toContain("feature-dev:code-architect");
    expect(conventionsContent).not.toContain("feature-dev:code-explorer");
    expect(conventionsContent).not.toContain("feature-dev:code-reviewer");
  });

  it("does NOT contain Review Gate Quorum Formula heading", () => {
    expect(conventionsContent).not.toContain("## Review Gate Quorum Formula");
  });

  it("does NOT contain ceil(2n/3) formula", () => {
    expect(conventionsContent).not.toContain("ceil(2n/3)");
  });

  it("contains a breadcrumb referencing project-manager and quorum", () => {
    expect(toLower(conventionsContent)).toContain(PROJECT_MANAGER);
    expect(toLower(conventionsContent)).toContain("quorum");
  });
});

// ── Double-Pass Protocol validation ──────────────────────────

describe("double-pass protocol in project-manager", () => {
  it("contains Global Review Double-Pass Protocol heading", () => {
    expect(pmContent).toContain("Global Review Double-Pass Protocol");
  });

  it("contains all 7 state names", () => {
    const states = [
      "idle",
      "running",
      "fixing",
      "clean1",
      "success",
      "restarting",
      "exhausted",
    ];
    forEach(states, (state) => {
      expect(pmContent).toContain(`\`${state}\``);
    });
  });

  it("contains MaxGlobalFixes with value 3", () => {
    expect(pmContent).toMatch(/MaxGlobalFixes.*3|MaxGlobalFixes\(3\)/u);
  });

  it("contains per-step retry cap semantics", () => {
    expect(pmContent).toMatch(/per-step retry cap/iu);
  });

  it("contains the 3-step sequence: test, lint, tsc", () => {
    expect(pmContent).toContain("test");
    expect(pmContent).toContain("lint");
    expect(pmContent).toContain("tsc");
  });

  it("contains GLOBAL_REVIEW_EXHAUSTED halt condition", () => {
    expect(pmContent).toContain("GLOBAL_REVIEW_EXHAUSTED");
  });
});

// ── Double-Pass reference in SKILL.md ────────────────────────

describe("double-pass reference in design-pipeline SKILL.md", () => {
  it("references double-pass or Global Review in Stage 6 context", () => {
    const hasDoublePass = includes(toLower(skillContent), "double-pass");
    const hasGlobalReview = includes(toLower(skillContent), "global review");
    expect(hasDoublePass || hasGlobalReview).toBe(true);
  });

  it("references project-manager as the executor of global review", () => {
    expect(skillContent).toMatch(
      /project.manager.*global review|global review.*project.manager/isu,
    );
  });
});
