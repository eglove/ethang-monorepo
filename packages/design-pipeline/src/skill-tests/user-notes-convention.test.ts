import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SKILL_PATH = path.join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  ".claude",
  "skills",
  "shared",
  "conventions.md",
);

const content = readFileSync(SKILL_PATH, "utf8");

const USER_NOTES_HEADING = "## User Notes";
const USER_NOTES_DIR = "docs/user_notes/";
const AGENT_FILE_PATTERN = "<agent-name>-<YYYY-MM-DD>-<HH-MM-SS>.md";
const ANY_AGENT_ANY_TIME = "Any agent can write at any time";
const NON_BLOCKING = "non-blocking";
const WARN_AND_CONTINUE = "warn and continue";
const USER_AUDITS = "user audits and trims manually";

describe("user_notes convention in shared conventions.md", () => {
  it("contains a User Notes section", () => {
    expect(content).toContain(USER_NOTES_HEADING);
  });

  it("specifies docs/user_notes/ as the directory", () => {
    expect(content).toContain(USER_NOTES_DIR);
  });

  it("does not specify a single-file docs/user_notes.md path", () => {
    const singleFilePattern = /docs\/user_notes\.md/u;
    expect(content).not.toMatch(singleFilePattern);
  });

  it("specifies agent-scoped file naming with agent name and timestamp", () => {
    expect(content).toContain(AGENT_FILE_PATTERN);
  });

  it("states any agent can write at any time", () => {
    expect(content).toContain(ANY_AGENT_ANY_TIME);
  });

  it("states write failures are non-blocking", () => {
    expect(content).toContain(NON_BLOCKING);
    expect(content).toContain(WARN_AND_CONTINUE);
  });

  it("states user audits and trims manually", () => {
    expect(content).toContain(USER_AUDITS);
  });
});
