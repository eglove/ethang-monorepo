import filter from "lodash/filter.js";
import includes from "lodash/includes.js";
import split from "lodash/split.js";
import startsWith from "lodash/startsWith.js";
import trim from "lodash/trim.js";
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
  "orchestrators",
  "debate-moderator",
  "SKILL.md",
);

const content = readFileSync(SKILL_PATH, "utf8");

describe("debate-moderator SKILL.md", () => {
  it("roster table contains expert-lodash (ninth expert added)", () => {
    expect(content).toContain("expert-lodash");
  });

  it("contains a section about autonomous expert selection", () => {
    expect(content).toContain("## Autonomous Expert Selection");
  });

  it("does NOT contain old halt behavior text", () => {
    expect(content).not.toContain(
      "Then stop. Do not proceed until an explicit selection is received.",
    );
  });

  it("contains text about hard precondition error when selectExperts returns empty set", () => {
    expect(content).toContain("hard precondition");
  });

  it("contains a section about user_notes.md annotation", () => {
    expect(content).toContain("user_notes.md");
  });

  it("contains the exact string '# User Notes — Agent Requests'", () => {
    expect(content).toContain("# User Notes — Agent Requests");
  });

  it("contains 'entries are user-curated' convention language", () => {
    expect(content).toContain("entries are user-curated");
  });

  it("describes handling of both ABSENT and EMPTY file states for user_notes.md", () => {
    expect(content).toContain("ABSENT");
    expect(content).toContain("EMPTY");
  });

  it("contains 'at most one' or 'once before round 1' describing when selection occurs", () => {
    const hasAtMostOne = includes(content, "at most one");
    const hasOnceBeforeRound1 = includes(content, "once before round 1");
    expect(hasAtMostOne || hasOnceBeforeRound1).toBe(true);
  });

  it("roster table has 9 entries", () => {
    // Find the Expert Roster table and count data rows (non-header, non-separator)
    const rosterSection = content.slice(
      includes(content, "## Expert Roster")
        ? content.indexOf("## Expert Roster")
        : 0,
    );
    const lines = split(rosterSection, "\n");
    const dataRows = filter(lines, (line) => {
      const trimmed = trim(line);
      return (
        startsWith(trimmed, "|") &&
        !startsWith(trimmed, "| Agent") &&
        !startsWith(trimmed, "|---") &&
        1 < trimmed.length
      );
    });
    expect(dataRows).toHaveLength(9);
  });
});
