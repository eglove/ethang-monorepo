import filter from "lodash/filter.js";
import includes from "lodash/includes.js";
import map from "lodash/map.js";
import padStart from "lodash/padStart.js";

import type { SkillDefinition, SkillResource } from "../../../define.ts";

import { ch01Requirements } from "./ch01-requirements.ts";
import { ch02Architecture } from "./ch02-architecture.ts";
import { ch03Design } from "./ch03-design.ts";
import { ch04Construction } from "./ch04-construction.ts";
import { ch05Testing } from "./ch05-testing.ts";
import { ch06Operations } from "./ch06-operations.ts";
import { ch07Maintenance } from "./ch07-maintenance.ts";
import { ch08Configuration } from "./ch08-configuration.ts";
import { ch09Management } from "./ch09-management.ts";
import { ch10Process } from "./ch10-process.ts";
import { ch11Models } from "./ch11-models.ts";
import { ch12Quality } from "./ch12-quality.ts";
import { ch13Security } from "./ch13-security.ts";
import { ch14Professional } from "./ch14-professional.ts";
import { ch15Economics } from "./ch15-economics.ts";
import { ch16Computing } from "./ch16-computing.ts";
import { ch17Math } from "./ch17-math.ts";
import { ch18Engineering } from "./ch18-engineering.ts";

export type ChapterDefinition = {
  content: string;
  path: string;
  title: string;
  triggers: readonly string[];
};

/**
 * Stable ordered array of all 18 SWEBOK v4 chapters.
 * Order must match chapter numbers ch01..ch18.
 */
export const CHAPTERS: readonly ChapterDefinition[] = [
  ch01Requirements,
  ch02Architecture,
  ch03Design,
  ch04Construction,
  ch05Testing,
  ch06Operations,
  ch07Maintenance,
  ch08Configuration,
  ch09Management,
  ch10Process,
  ch11Models,
  ch12Quality,
  ch13Security,
  ch14Professional,
  ch15Economics,
  ch16Computing,
  ch17Math,
  ch18Engineering
];

const SKILL_REVIEW_DESIGN = "review-design-checklist";
const SKILL_TDD_PRINCIPLES = "tdd-principles";
const SKILL_TDD_STATE_COVERAGE = "tdd-state-coverage";
const EMPTY_CELL = "—";

/**
 * Maps resource paths to related operational skill names.
 * Keys are the chapter resource paths (as declared in each chapter file).
 * Values are the sibling skill names that operationalize the chapter theory.
 */
const CHAPTER_RELATED_SKILLS: Record<string, readonly string[]> = {
  "resources/ch02-architecture.md": [SKILL_REVIEW_DESIGN],
  "resources/ch03-design.md": [
    "ddd-strategic",
    "ddd-tactical",
    SKILL_REVIEW_DESIGN
  ],
  "resources/ch04-construction.md": [
    SKILL_TDD_PRINCIPLES,
    "tdd-test-as-documentation"
  ],
  "resources/ch05-testing.md": [SKILL_TDD_PRINCIPLES, SKILL_TDD_STATE_COVERAGE],
  "resources/ch11-models.md": [SKILL_TDD_STATE_COVERAGE],
  "resources/ch12-quality.md": [SKILL_REVIEW_DESIGN, "rca-five-whys"],
  "resources/ch13-security.md": ["review-security-checklist"],
  "resources/ch16-computing.md": [SKILL_REVIEW_DESIGN],
  "resources/ch17-math.md": [SKILL_TDD_STATE_COVERAGE],
  "resources/ch18-engineering.md": ["rca-five-whys"]
};

/**
 * Builds the chapter index table for inclusion in the SWEBOK skill body.
 * The table is generated from CHAPTERS so it cannot drift from the actual
 * resource definitions — every resource path is programmatically included.
 *
 * @param siblingSkillNames - skill names bundled in the same plugin; used to
 *   filter the "related skill" column so only present skills are listed.
 */
const buildChapterTable = (siblingSkillNames: readonly string[]): string => {
  const header = [
    "| Ch | Title | Resource path | Trigger keywords | Related skill |",
    "|---|---|---|---|---|"
  ].join("\n");

  const rows = map(CHAPTERS, (chapter, index) => {
    const chNumber = padStart(String(index + 1), 2, "0");
    const triggers = [...chapter.triggers].join(", ");

    const related = CHAPTER_RELATED_SKILLS[chapter.path] ?? [];
    const filteredRelated = filter(related, (skill) => {
      return includes(siblingSkillNames, skill);
    });
    const relatedCell =
      0 < filteredRelated.length ? filteredRelated.join(", ") : EMPTY_CELL;

    return `| Ch ${chNumber} | ${chapter.title} | \`${chapter.path}\` | ${triggers} | ${relatedCell} |`;
  });

  return [header, ...rows].join("\n");
};

/**
 * Builds the SWEBOK router SkillDefinition for inclusion in a plugin.
 *
 * @param siblingSkillNames - names of other skills in the same plugin;
 *   determines which "related skill" entries appear in the chapter table.
 */
export const swebokSkill = (
  siblingSkillNames: readonly string[]
): SkillDefinition => {
  const chapterTable = buildChapterTable(siblingSkillNames);

  const resources: SkillResource[] = map(CHAPTERS, (chapter) => {
    return {
      content: chapter.content,
      path: chapter.path
    };
  });

  return {
    content: `# SWEBOK v4 — Chapter Index

**How to use:** Identify the relevant chapters (maximum 3 per task), then Read the matching \`resources/chNN-*.md\` file next to this SKILL.md. Read the file directly — do not attempt to invoke it as a skill. Loading more than 3 chapters per task wastes context; pick the chapters closest to your current work.

${chapterTable}

## Cross-Cutting Vocabulary

Terms used across multiple chapters:

| Term | Definition |
|---|---|
| **Error** | A human action that produces an incorrect result |
| **Defect / Fault** | An imperfection in a work product (a manifestation of an error) |
| **Failure** | An event where a system deviates from expected behavior (a defect manifesting at runtime) |
| **Technical debt** | Accumulated shortcuts that increase future maintenance cost; must be tracked and paid down |
| **ATDD** | Acceptance Test-Driven Development — test cases ARE requirements; no production code until at least one test fails |
| **V&V** | Verification ("built it right") + Validation ("built the right thing") |
| **CoSQ** | Cost of Software Quality: Prevention + Appraisal (conformance) + Internal/External failure (nonconformance) |
| **ASR** | Architecturally Significant Requirement — any requirement that influences architecture |
| **CIA triad** | Confidentiality, Integrity, Availability — the three pillars of information security |
| **GQM** | Goal-Question-Metric — every metric must support a decision |
| **CMMI** | Capability Maturity Model Integration — process improvement framework |
| **SQA** | Software Quality Assurance — process assurance + product assurance |
`,
    description:
      "SWEBOK v4 chapter index and router. Read the matching chapter resource before requirements, design, testing, or maintenance work. Maximum 3 chapters per task.",
    name: "swebok",
    resources
  };
};
