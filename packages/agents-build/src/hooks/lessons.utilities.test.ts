import repeat from "lodash/repeat.js";
import toLower from "lodash/toLower.js";
import { describe, expect, it } from "vitest";

import {
  applyDelta,
  buildExtractionPrompt,
  detectInvokedArtifacts,
  isDeltaEmpty,
  parseClaudeEnvelope,
  parseHookInput,
  parseSectionEntries,
  parseTranscriptSlice,
  shouldDispatch
} from "./lessons.utilities.ts";

// ── parseHookInput ─────────────────────────────────────────────────────────────

describe("parseHookInput", () => {
  it("parses a well-formed JSON object", () => {
    const raw = JSON.stringify({
      conversationId: "abc",
      fullyIdle: true,
      transcriptPath: "/t.jsonl"
    });

    expect(parseHookInput(raw)).toEqual({
      conversationId: "abc",
      fullyIdle: true,
      transcriptPath: "/t.jsonl"
    });
  });

  it("returns undefined for malformed JSON", () => {
    expect(parseHookInput("not json")).toBeUndefined();
  });

  it("returns undefined for an empty string", () => {
    expect(parseHookInput("")).toBeUndefined();
  });

  it("returns undefined for whitespace only", () => {
    expect(parseHookInput("   \n ")).toBeUndefined();
  });

  it("returns undefined when the parsed value is not an object", () => {
    expect(parseHookInput("42")).toBeUndefined();
    expect(parseHookInput('"a string"')).toBeUndefined();
    expect(parseHookInput("null")).toBeUndefined();
  });

  it("trims surrounding whitespace before parsing", () => {
    expect(parseHookInput('  {"a":1}\n')).toEqual({ a: 1 });
  });
});

// ── parseTranscriptSlice ───────────────────────────────────────────────────────

describe("parseTranscriptSlice", () => {
  it("extracts a plain-string user turn", () => {
    const line = JSON.stringify({
      message: { content: "Hello there", role: "user" }
    });
    expect(parseTranscriptSlice(line)).toBe("User: Hello there");
  });

  it("extracts a user turn from a text content block", () => {
    const line = JSON.stringify({
      message: {
        content: [{ text: "Tell me about X", type: "text" }],
        role: "user"
      }
    });
    expect(parseTranscriptSlice(line)).toBe("User: Tell me about X");
  });

  it("skips user messages that are tool results", () => {
    const line = JSON.stringify({
      message: {
        content: [{ content: "result data", type: "tool_result" }],
        role: "user"
      }
    });
    expect(parseTranscriptSlice(line)).toBe("");
  });

  it("extracts an assistant text turn", () => {
    const line = JSON.stringify({
      message: {
        content: [{ text: "Here is the answer", type: "text" }],
        role: "assistant"
      }
    });
    expect(parseTranscriptSlice(line)).toBe("Claude: Here is the answer");
  });

  it("truncates assistant text at 800 chars", () => {
    const long = repeat("a", 1000);
    const line = JSON.stringify({
      message: { content: [{ text: long, type: "text" }], role: "assistant" }
    });
    expect(parseTranscriptSlice(line)).toBe(`Claude: ${repeat("a", 800)}`);
  });

  it("processes multiple JSONL lines", () => {
    const lines = [
      JSON.stringify({ message: { content: "First", role: "user" } }),
      JSON.stringify({
        message: {
          content: [{ text: "Response", type: "text" }],
          role: "assistant"
        }
      }),
      JSON.stringify({ message: { content: "Second", role: "user" } })
    ].join("\n");

    expect(parseTranscriptSlice(lines)).toBe(
      "User: First\n\nClaude: Response\n\nUser: Second"
    );
  });

  it("accepts top-level role/content shapes (no message wrapper)", () => {
    const line = JSON.stringify({ content: "Top level", role: "user" });
    expect(parseTranscriptSlice(line)).toBe("User: Top level");
  });

  it("falls back to raw text (truncated) when no JSONL line parses", () => {
    const raw = "this is plain prose\nwith two lines and no json";
    expect(parseTranscriptSlice(raw)).toBe(raw);
  });

  it("skips lines that parse to non-objects or objects without a role", () => {
    const lines = [
      "[1,2]",
      '{"unrelated": true}',
      '{"message": {"role": "user", "content": "Kept turn"}}'
    ].join("\n");

    expect(parseTranscriptSlice(lines)).toBe("User: Kept turn");
  });

  it("truncates the raw-text fallback to the last 50k chars", () => {
    const raw = repeat("x", 60_000);
    const result = parseTranscriptSlice(raw);
    expect(result.length).toBe(50_000);
    expect(result).toBe(repeat("x", 50_000));
  });

  it("never throws on garbage input", () => {
    expect(() => {
      return parseTranscriptSlice("{bad\n{also bad}");
    }).not.toThrow();
  });

  it("returns an empty string for an empty input", () => {
    expect(parseTranscriptSlice("")).toBe("");
  });
});

// ── detectInvokedArtifacts ─────────────────────────────────────────────────────

const GIT_WORKFLOW = "git-workflow";

const CANDIDATES = [
  "tdd-principles",
  GIT_WORKFLOW,
  "philosophy",
  "verification"
];

describe("detectInvokedArtifacts", () => {
  it("detects a candidate name mentioned in the text", () => {
    expect(
      detectInvokedArtifacts(
        `I used the ${GIT_WORKFLOW} skill here`,
        CANDIDATES
      )
    ).toEqual([GIT_WORKFLOW]);
  });

  it("detects multiple distinct candidates", () => {
    const text = "first tdd-principles then verification ran";
    const found = detectInvokedArtifacts(text, CANDIDATES);
    expect(found).toContain("tdd-principles");
    expect(found).toContain("verification");
    expect(found).toHaveLength(2);
  });

  it("deduplicates repeated mentions", () => {
    expect(
      detectInvokedArtifacts(
        `${GIT_WORKFLOW} ${GIT_WORKFLOW} ${GIT_WORKFLOW}`,
        CANDIDATES
      )
    ).toEqual([GIT_WORKFLOW]);
  });

  it("returns an empty array when no candidate is mentioned", () => {
    expect(detectInvokedArtifacts("nothing relevant here", CANDIDATES)).toEqual(
      []
    );
  });

  it("returns an empty array for an empty candidate list", () => {
    expect(detectInvokedArtifacts(GIT_WORKFLOW, [])).toEqual([]);
  });

  it("preserves candidate-list order in the result", () => {
    const text = `verification first then ${GIT_WORKFLOW}`;
    expect(detectInvokedArtifacts(text, CANDIDATES)).toEqual([
      GIT_WORKFLOW,
      "verification"
    ]);
  });

  it("does not match a candidate name embedded in a larger word", () => {
    expect(
      detectInvokedArtifacts("the verifications passed", ["verification"])
    ).toEqual([]);
  });
});

// ── shouldDispatch ─────────────────────────────────────────────────────────────

const HOUR = 60 * 60 * 1000;

describe("shouldDispatch", () => {
  it("dispatches on first sight of a conversation when the transcript is non-empty", () => {
    expect(shouldDispatch({}, "conv-1", 100, 1_000_000, HOUR)).toBe(true);
  });

  it("does not dispatch when the transcript is empty (size 0)", () => {
    expect(shouldDispatch({}, "conv-1", 0, 1_000_000, HOUR)).toBe(false);
  });

  it("does not dispatch when the transcript has not grown past the recorded offset", () => {
    const state = { "conv-1": { lastDispatch: 0, offset: 500 } };
    expect(shouldDispatch(state, "conv-1", 500, 10 * HOUR, HOUR)).toBe(false);
  });

  it("does not dispatch when the transcript shrank below the recorded offset", () => {
    const state = { "conv-1": { lastDispatch: 0, offset: 500 } };
    expect(shouldDispatch(state, "conv-1", 200, 10 * HOUR, HOUR)).toBe(false);
  });

  it("dispatches when the transcript grew and the interval has elapsed", () => {
    const state = { "conv-1": { lastDispatch: 0, offset: 500 } };
    expect(shouldDispatch(state, "conv-1", 600, HOUR + 1, HOUR)).toBe(true);
  });

  it("does not dispatch when the transcript grew but the interval has NOT elapsed", () => {
    const state = { "conv-1": { lastDispatch: 1000, offset: 500 } };
    expect(shouldDispatch(state, "conv-1", 600, 1000 + HOUR - 1, HOUR)).toBe(
      false
    );
  });

  it("dispatches exactly at the interval boundary", () => {
    const state = { "conv-1": { lastDispatch: 1000, offset: 500 } };
    expect(shouldDispatch(state, "conv-1", 600, 1000 + HOUR, HOUR)).toBe(true);
  });

  it("isolates dedupe state per conversation", () => {
    const state = { "conv-1": { lastDispatch: 1_000_000, offset: 9999 } };
    expect(shouldDispatch(state, "conv-2", 100, 1_000_000, HOUR)).toBe(true);
  });
});

// ── buildExtractionPrompt ──────────────────────────────────────────────────────

describe("buildExtractionPrompt", () => {
  const baseArguments = {
    artifacts: [GIT_WORKFLOW, "verification"],
    // eslint-disable-next-line sonar/publicly-writable-directories -- tests need a real temp directory
    sliceFilePath: "/tmp/slice-abc.txt",
    workspaceRoot: "/c/work/repo"
  };

  it("instructs reading the transcript slice at the given temp path", () => {
    expect(buildExtractionPrompt(baseArguments)).toContain(
      // eslint-disable-next-line sonar/publicly-writable-directories -- tests need a real temp directory
      "/tmp/slice-abc.txt"
    );
  });

  it("targets the workspace lessons.md path", () => {
    expect(buildExtractionPrompt(baseArguments)).toContain(
      "/c/work/repo/.agents/lessons.md"
    );
  });

  it("targets the workspace ARTIFACT_IMPROVEMENTS.md path", () => {
    expect(buildExtractionPrompt(baseArguments)).toContain(
      "/c/work/repo/.agents/ARTIFACT_IMPROVEMENTS.md"
    );
  });

  it("instructs the 11,000 character ceiling and pruning oldest patterns", () => {
    const prompt = buildExtractionPrompt(baseArguments);
    expect(prompt).toContain("11,000");
    expect(prompt).toMatch(/prun/iu);
  });

  it("instructs preserving the section skeleton", () => {
    const prompt = buildExtractionPrompt(baseArguments);
    expect(prompt).toContain("# Learned Lessons");
    expect(prompt).toContain("## Corrections");
    expect(prompt).toContain("## Proven Patterns");
  });

  it("instructs remove then modify then add ordering", () => {
    const prompt = toLower(buildExtractionPrompt(baseArguments));
    const removeAt = prompt.indexOf("remove");
    const modifyAt = prompt.indexOf("modify");
    const addAt = prompt.lastIndexOf("add");
    expect(removeAt).toBeGreaterThanOrEqual(0);
    expect(removeAt).toBeLessThan(modifyAt);
    expect(modifyAt).toBeLessThan(addAt);
  });

  it("instructs appending newest session first to artifact improvements", () => {
    const prompt = buildExtractionPrompt(baseArguments);
    expect(prompt).toMatch(/newest/iu);
    expect(prompt).toMatch(/append/iu);
  });

  it("lists the artifact names when artifacts are present", () => {
    const prompt = buildExtractionPrompt(baseArguments);
    expect(prompt).toContain(GIT_WORKFLOW);
    expect(prompt).toContain("verification");
  });

  it("instructs touching no other files and never committing", () => {
    const prompt = toLower(buildExtractionPrompt(baseArguments));
    expect(prompt).toContain("no other files");
    expect(prompt).toContain("never commit");
  });

  it("omits artifact-improvement instructions when no artifacts are present", () => {
    const prompt = buildExtractionPrompt({ ...baseArguments, artifacts: [] });
    expect(prompt).not.toContain(GIT_WORKFLOW);
  });
});

// ── isDeltaEmpty (ported) ──────────────────────────────────────────────────────

describe("isDeltaEmpty", () => {
  it("returns true for empty object", () => {
    expect(isDeltaEmpty({})).toBe(true);
  });

  it("returns true when all arrays are empty", () => {
    expect(
      isDeltaEmpty({
        corrections: { add: [], modify: [], remove: [] },
        patterns: { add: [] }
      })
    ).toBe(true);
  });

  it("returns false when corrections.add has items", () => {
    expect(isDeltaEmpty({ corrections: { add: ["- **Rule**: X"] } })).toBe(
      false
    );
  });

  it("returns false when patterns.remove has items", () => {
    expect(isDeltaEmpty({ patterns: { remove: ["- **Pattern**: Y"] } })).toBe(
      false
    );
  });

  it("returns false when corrections.modify has items", () => {
    expect(
      isDeltaEmpty({ corrections: { modify: [{ new: "b", old: "a" }] } })
    ).toBe(false);
  });
});

// ── parseSectionEntries (ported) ───────────────────────────────────────────────

const RULE_ONE = "- **Rule**: Rule one";

const SAMPLE_DOC = `# Learned Lessons

## Corrections
Rules from explicit user corrections.

- **Rule**: Rule one
- **Rule**: Rule two

## Proven Patterns
Approaches confirmed to work well.

- **Pattern**: Pattern one
`;

describe("parseSectionEntries", () => {
  it("returns entries from Corrections section", () => {
    expect(parseSectionEntries(SAMPLE_DOC, "Corrections")).toEqual([
      RULE_ONE,
      "- **Rule**: Rule two"
    ]);
  });

  it("returns entries from Proven Patterns section", () => {
    expect(parseSectionEntries(SAMPLE_DOC, "Proven Patterns")).toEqual([
      "- **Pattern**: Pattern one"
    ]);
  });

  it("returns empty array for a missing section", () => {
    expect(parseSectionEntries(SAMPLE_DOC, "Missing")).toEqual([]);
  });

  it("stops collecting at the next ## heading", () => {
    const document =
      "## Corrections\n- Entry A\n\n## Proven Patterns\n- Entry B\n";
    expect(parseSectionEntries(document, "Corrections")).toEqual(["- Entry A"]);
  });
});

// ── applyDelta (ported) ────────────────────────────────────────────────────────

describe("applyDelta", () => {
  it("adds corrections to empty state", () => {
    const result = applyDelta("", {
      corrections: { add: ["- **Rule**: New"] }
    });
    expect(result).toContain("- **Rule**: New");
    expect(result).toContain("## Corrections");
    expect(result).toContain("## Proven Patterns");
    expect(result).toContain("*(none yet)*");
  });

  it("adds patterns to empty state", () => {
    const result = applyDelta("", {
      patterns: { add: ["- **Pattern**: Works"] }
    });
    expect(result).toContain("- **Pattern**: Works");
    expect(result).toContain("*(none yet)*");
  });

  it("modifies an existing entry", () => {
    const result = applyDelta(SAMPLE_DOC, {
      corrections: {
        modify: [{ new: `${RULE_ONE} (updated)`, old: RULE_ONE }]
      }
    });
    expect(result).toContain(`${RULE_ONE} (updated)`);
    expect(result).not.toContain(`${RULE_ONE}\n`);
  });

  it("removes an entry", () => {
    const result = applyDelta(SAMPLE_DOC, {
      corrections: { remove: [RULE_ONE] }
    });
    expect(result).not.toContain(RULE_ONE);
    expect(result).toContain("- **Rule**: Rule two");
  });

  it("does not duplicate an item already present", () => {
    const result = applyDelta(SAMPLE_DOC, {
      corrections: { add: [RULE_ONE] }
    });
    expect(result.match(/- \*\*Rule\*\*: Rule one/gu)?.length).toBe(1);
  });

  it("normalizes add items that lack leading dash", () => {
    const result = applyDelta("", {
      corrections: { add: ["**Rule**: No dash"] }
    });
    expect(result).toContain("- **Rule**: No dash");
  });

  it("renders the none-yet sentinel when a section becomes empty after remove", () => {
    const document =
      "# Learned Lessons\n\n## Corrections\nRules.\n\n- **Rule**: Only one\n\n## Proven Patterns\nPatterns.\n\n*(none yet)*\n";
    const result = applyDelta(document, {
      corrections: { remove: ["- **Rule**: Only one"] }
    });
    expect(result.match(/\*\(none yet\)\*/gu)?.length).toBe(2);
  });
});

// ── parseClaudeEnvelope (ported) ───────────────────────────────────────────────

describe("parseClaudeEnvelope", () => {
  it("returns structured_output when present", () => {
    const stdout = JSON.stringify({
      structured_output: {
        artifact_improvements: "foo",
        lessons: { corrections: { add: ["x"] } }
      }
    });
    expect(parseClaudeEnvelope(stdout)).toEqual({
      artifact_improvements: "foo",
      lessons: { corrections: { add: ["x"] } }
    });
  });

  it("returns undefined when structured_output is missing", () => {
    expect(parseClaudeEnvelope(JSON.stringify({ other: 1 }))).toBeUndefined();
  });

  it("returns undefined for malformed JSON", () => {
    expect(parseClaudeEnvelope("not json")).toBeUndefined();
  });

  it("returns undefined when the envelope parses to a non-object", () => {
    expect(parseClaudeEnvelope("42")).toBeUndefined();
  });

  it("trims surrounding whitespace before parsing", () => {
    const stdout = `  ${JSON.stringify({ structured_output: { artifact_improvements: "y" } })}\n`;
    expect(parseClaudeEnvelope(stdout)).toEqual({ artifact_improvements: "y" });
  });
});
