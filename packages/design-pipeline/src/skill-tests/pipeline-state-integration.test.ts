import every from "lodash/every.js";
import filter from "lodash/filter.js";
import includes from "lodash/includes.js";
import some from "lodash/some.js";
import split from "lodash/split.js";
import values from "lodash/values.js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const MONOREPO_ROOT = path.join(import.meta.dirname, "..", "..", "..", "..");

const PIPELINE_STATE_REF = "pipeline-state.md";
const PIPELINE_STATE_SHORT = "pipeline-state";
const SESSION_DIR_REF = "design-pipeline-sessions";

const AGENT_FILES = {
  debateModerator: path.join(
    MONOREPO_ROOT,
    ".claude",
    "skills",
    "orchestrators",
    "debate-moderator",
    "SKILL.md",
  ),
  designPipeline: path.join(
    MONOREPO_ROOT,
    ".claude",
    "skills",
    "design-pipeline",
    "SKILL.md",
  ),
  implementationWriter: path.join(
    MONOREPO_ROOT,
    ".claude",
    "skills",
    "implementation-writer",
    "AGENT.md",
  ),
  questioner: path.join(
    MONOREPO_ROOT,
    ".claude",
    "skills",
    "questioner",
    "SKILL.md",
  ),
  tlaWriter: path.join(
    MONOREPO_ROOT,
    ".claude",
    "skills",
    "tla-writer",
    "AGENT.md",
  ),
} as const;

const TEMPLATE_PATH = path.join(MONOREPO_ROOT, "docs", "pipeline-state.md");

const contents = {
  debateModerator: readFileSync(AGENT_FILES.debateModerator, "utf8"),
  designPipeline: readFileSync(AGENT_FILES.designPipeline, "utf8"),
  implementationWriter: readFileSync(AGENT_FILES.implementationWriter, "utf8"),
  questioner: readFileSync(AGENT_FILES.questioner, "utf8"),
  tlaWriter: readFileSync(AGENT_FILES.tlaWriter, "utf8"),
};

const allContents = values(contents);

const templateContent = readFileSync(TEMPLATE_PATH, "utf8").replaceAll(
  "\r\n",
  "\n",
);

describe("pipeline state integration — cross-file coherence", () => {
  it("all 5 agent/skill files reference pipeline-state.md", () => {
    const allReference = every(allContents, (content) => {
      return includes(content, PIPELINE_STATE_REF);
    });

    expect(allReference).toBe(true);
  });

  describe("stage number coverage — each agent owns its stage writes", () => {
    it("questioner mentions Stage 1 in context of state file writes", () => {
      expect(contents.questioner).toMatch(/Stage 1/u);

      const lines = split(contents.questioner, "\n");
      const hasStage1Write = some(lines, (line) => {
        return (
          includes(line, "Stage 1") && includes(line, PIPELINE_STATE_SHORT)
        );
      });

      expect(hasStage1Write).toBe(true);
    });

    it("debate-moderator mentions Stage 2 and Stage 4 in context of state file writes", () => {
      const lines = split(contents.debateModerator, "\n");

      const hasStage2 = some(lines, (line) => {
        return includes(line, "Stage 2");
      });
      const hasStage4 = some(lines, (line) => {
        return includes(line, "Stage 4");
      });

      expect(hasStage2).toBe(true);
      expect(hasStage4).toBe(true);
      expect(contents.debateModerator).toContain(PIPELINE_STATE_REF);
    });

    it("tla-writer mentions Stage 3 in context of state file writes", () => {
      expect(contents.tlaWriter).toMatch(/Stage 3/u);

      const lines = split(contents.tlaWriter, "\n");
      const hasStage3Write = some(lines, (line) => {
        return (
          includes(line, "Stage 3") && includes(line, PIPELINE_STATE_SHORT)
        );
      });

      expect(hasStage3Write).toBe(true);
    });

    it("implementation-writer mentions Stage 5 in context of state file writes", () => {
      expect(contents.implementationWriter).toMatch(/Stage 5/u);

      const lines = split(contents.implementationWriter, "\n");
      const hasStage5Write = some(lines, (line) => {
        return (
          includes(line, "Stage 5") && includes(line, PIPELINE_STATE_SHORT)
        );
      });

      expect(hasStage5Write).toBe(true);
    });

    it("design-pipeline mentions Stage 6 in context of state file writes", () => {
      expect(contents.designPipeline).toMatch(/Stage 6/u);

      const lines = split(contents.designPipeline, "\n");
      const hasStage6Write = some(lines, (line) => {
        return (
          includes(line, "Stage 6") && includes(line, PIPELINE_STATE_SHORT)
        );
      });

      expect(hasStage6Write).toBe(true);
    });
  });

  describe("design-pipeline SKILL.md contains lifecycle concepts", () => {
    it("contains fail-fast for clear failure handling", () => {
      expect(contents.designPipeline).toContain("fail-fast");
    });

    it("contains uncommitted as warning before clearing", () => {
      expect(contents.designPipeline).toMatch(/uncommitted/iu);
    });

    it("contains terminal in context of commits", () => {
      const lines = split(contents.designPipeline, "\n");
      const hasTerminalCommit = some(lines, (line) => {
        return includes(line, "terminal") && includes(line, "commit");
      });

      expect(hasTerminalCommit).toBe(true);
    });

    it("contains section in context of ownership", () => {
      const hasSectionOwnership =
        includes(contents.designPipeline, "section ownership") ||
        includes(contents.designPipeline, "section-scoped ownership") ||
        includes(contents.designPipeline, "Section-Scoped Ownership") ||
        includes(contents.designPipeline, "Section Ownership");

      expect(hasSectionOwnership).toBe(true);
    });
  });

  it("template file contains exactly 6 stage sections", () => {
    const stageHeadings = filter(split(templateContent, "\n"), (line) => {
      return /^## Stage \d/u.test(line);
    });

    expect(stageHeadings).toHaveLength(6);
  });

  describe("no stale session index references — docs/design-pipeline-sessions/ eliminated", () => {
    it("questioner does not reference docs/design-pipeline-sessions/", () => {
      expect(contents.questioner).not.toContain(SESSION_DIR_REF);
    });

    it("debate-moderator does not reference docs/design-pipeline-sessions/", () => {
      expect(contents.debateModerator).not.toContain(SESSION_DIR_REF);
    });

    it("tla-writer does not reference docs/design-pipeline-sessions/", () => {
      expect(contents.tlaWriter).not.toContain(SESSION_DIR_REF);
    });

    it("implementation-writer does not reference docs/design-pipeline-sessions/", () => {
      expect(contents.implementationWriter).not.toContain(SESSION_DIR_REF);
    });

    it("design-pipeline does not reference docs/design-pipeline-sessions/", () => {
      expect(contents.designPipeline).not.toContain(SESSION_DIR_REF);
    });
  });

  describe("no stale Expert Council references", () => {
    it("design-pipeline SKILL.md does not contain Expert Council", () => {
      expect(contents.designPipeline).not.toContain("Expert Council");
    });

    it("questioner SKILL.md does not contain Expert Council", () => {
      expect(contents.questioner).not.toContain("Expert Council");
    });
  });
});
