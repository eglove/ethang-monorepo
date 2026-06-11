import { describe, expect, it } from "vitest";

import {
  getPreInvocationResponse,
  isSeedOnly,
  parseHookInput
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

// ── isSeedOnly ─────────────────────────────────────────────────────────────────

describe("isSeedOnly", () => {
  it("returns true for empty string or just whitespace", () => {
    expect(isSeedOnly("")).toBe(true);
    expect(isSeedOnly("   \n  ")).toBe(true);
  });

  it("returns true for seed skeleton with none-yet markers", () => {
    const seed = `# Learned Lessons\n\n## Corrections\n\n*(none yet)*\n\n## Proven Patterns\n\n*(none yet)*`;
    expect(isSeedOnly(seed)).toBe(true);
  });

  it("returns false if there are actual bulleted entries", () => {
    const content = `# Learned Lessons\n\n## Corrections\n- **Rule**: Avoid X\n\n## Proven Patterns\n*(none yet)*`;
    expect(isSeedOnly(content)).toBe(false);
  });
});

// ── getPreInvocationResponse ───────────────────────────────────────────────────

describe("getPreInvocationResponse", () => {
  const swebokHeading = "SWEBOK v4 Standards & Glossary";

  it("returns an empty object if invocationNum is not 1", () => {
    expect(getPreInvocationResponse(2, "some content")).toEqual({});
    expect(getPreInvocationResponse(undefined, "some content")).toEqual({});
  });

  it("injects only SWEBOK guidelines when lessons content is empty or seed-only", () => {
    const response = getPreInvocationResponse(1, "");
    expect(response.injectSteps).toHaveLength(1);
    expect(response.injectSteps?.[0]?.ephemeralMessage).toContain(
      swebokHeading
    );
    expect(response.injectSteps?.[0]?.ephemeralMessage).not.toContain(
      "Learned Lessons"
    );

    const seed = `# Learned Lessons\n\n## Corrections\n\n*(none yet)*`;
    const responseSeed = getPreInvocationResponse(1, seed);
    expect(responseSeed.injectSteps).toHaveLength(1);
    expect(responseSeed.injectSteps?.[0]?.ephemeralMessage).toContain(
      swebokHeading
    );
  });

  it("injects both SWEBOK guidelines and learned lessons when actual lessons exist", () => {
    const lessons = `# Learned Lessons\n\n## Corrections\n- **Rule**: Do Y`;
    const response = getPreInvocationResponse(1, lessons);
    expect(response.injectSteps).toHaveLength(2);
    expect(response.injectSteps?.[0]?.ephemeralMessage).toContain(
      swebokHeading
    );
    expect(response.injectSteps?.[1]?.ephemeralMessage).toContain(
      "# Learned Lessons (from previous sessions)"
    );
    expect(response.injectSteps?.[1]?.ephemeralMessage).toContain(
      "- **Rule**: Do Y"
    );
  });
});
