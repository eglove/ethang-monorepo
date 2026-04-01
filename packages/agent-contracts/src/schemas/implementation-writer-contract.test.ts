import find from "lodash/find.js";
import map from "lodash/map.js";
import { describe, expect, it } from "vitest";

import {
  type CodeWriterEntry,
  CodeWriterListSchema,
} from "./implementation-writer-contract.ts";

const TYPESCRIPT_WRITER = "typescript-writer";
const HONO_WRITER = "hono-writer";
const UI_WRITER = "ui-writer";
const TRAINER_WRITER = "trainer-writer";
const PLAYWRIGHT_WRITER = "playwright-writer";
const VITEST_WRITER = "vitest-writer";
const FIXTURE_INCLUDES_EXACTLY_4 =
  "fixture includes exactly 4 code writers: typescript-writer, hono-writer, ui-writer, trainer-writer";
const TRAINER_PAIRING_DESCRIPTION =
  "trainer-writer pairing rules include vitest-writer as a valid test writer";
const TRAINER_FILE_TYPES_DESCRIPTION =
  "trainer-writer file types include .md and .sh";
const TRAINER_SELECTION_GUIDANCE_DESCRIPTION =
  "selection guidance for trainer-writer includes Claude Code artifacts trigger";
const SCHEMA_VALIDATES_FIXTURE =
  "CodeWriterListSchema validates the fixture successfully";

const codeWriterFixture: CodeWriterEntry[] = [
  {
    description:
      "general TypeScript domain logic, utilities, types, state machines, pure functions (.ts files)",
    fileTypes: [".ts"],
    name: TYPESCRIPT_WRITER,
    pairingRules: [VITEST_WRITER, PLAYWRIGHT_WRITER],
    selectionGuidance:
      "Pure domain logic, types, state machines -> typescript-writer + vitest-writer",
  },
  {
    description:
      "Hono route handlers, middleware, server-side HTTP code (.ts files with Hono patterns)",
    fileTypes: [".ts"],
    name: HONO_WRITER,
    pairingRules: [VITEST_WRITER, PLAYWRIGHT_WRITER],
    selectionGuidance:
      "Hono routes, middleware, API endpoints -> hono-writer + vitest-writer",
  },
  {
    description:
      "JSX components, server-rendered or client-rendered UI (.tsx files)",
    fileTypes: [".tsx"],
    name: UI_WRITER,
    pairingRules: [VITEST_WRITER, PLAYWRIGHT_WRITER],
    selectionGuidance:
      "JSX components with component-level tests -> ui-writer + vitest-writer",
  },
  {
    description:
      "Claude Code artifacts: SKILL.md, AGENT.md, .sh hook files, skill/agent definitions (files in .claude/)",
    fileTypes: [".md", ".sh"],
    name: TRAINER_WRITER,
    pairingRules: [VITEST_WRITER],
    selectionGuidance:
      "Claude Code artifacts (.claude/ directory) -> trainer-writer + vitest-writer",
  },
];

describe("ImplementationWriterContract", () => {
  it(SCHEMA_VALIDATES_FIXTURE, () => {
    const result = CodeWriterListSchema.parse(codeWriterFixture);

    expect(result).toStrictEqual(codeWriterFixture);
  });

  it(FIXTURE_INCLUDES_EXACTLY_4, () => {
    expect(codeWriterFixture).toHaveLength(4);

    const names = map(codeWriterFixture, (writer) => {
      return writer.name;
    });

    expect(names).toStrictEqual([
      TYPESCRIPT_WRITER,
      HONO_WRITER,
      UI_WRITER,
      TRAINER_WRITER,
    ]);
  });

  it(TRAINER_PAIRING_DESCRIPTION, () => {
    const trainerWriter = find(codeWriterFixture, (writer) => {
      return writer.name === TRAINER_WRITER;
    });

    expect(trainerWriter).toBeDefined();
    expect(trainerWriter?.pairingRules).toContain(VITEST_WRITER);
  });

  it(TRAINER_FILE_TYPES_DESCRIPTION, () => {
    const trainerWriter = find(codeWriterFixture, (writer) => {
      return writer.name === TRAINER_WRITER;
    });

    expect(trainerWriter).toBeDefined();
    expect(trainerWriter?.fileTypes).toContain(".md");
    expect(trainerWriter?.fileTypes).toContain(".sh");
  });

  it(TRAINER_SELECTION_GUIDANCE_DESCRIPTION, () => {
    const trainerWriter = find(codeWriterFixture, (writer) => {
      return writer.name === TRAINER_WRITER;
    });

    expect(trainerWriter).toBeDefined();
    expect(trainerWriter?.selectionGuidance).toContain("Claude Code artifacts");
  });
});
