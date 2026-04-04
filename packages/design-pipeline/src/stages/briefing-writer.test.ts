import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createEmptyQuestionerArtifact } from "../types/questioner-session.ts";
import {
  formatBriefingMarkdown,
  generateBriefingPath,
  writeBriefingFile,
} from "./briefing-writer.ts";

const TEST_DATE = "2026-04-04";
const STATUS_COMPLETE = "**Status:** COMPLETE";

describe("formatBriefingMarkdown", () => {
  it("includes topic, COMPLETE status, Q&A sections, summary, and Debate Requested", () => {
    const artifact = {
      ...createEmptyQuestionerArtifact(),
      artifactState: "complete" as const,
      questions: [
        { answer: "Full rewrite", question: "What is the scope?" },
        { answer: "Next sprint", question: "What is the deadline?" },
      ],
      sessionState: "completed" as const,
      summary: "A full rewrite is planned for next sprint.",
      turnCount: 4,
    };

    const result = formatBriefingMarkdown(artifact, "Auth Redesign", TEST_DATE);

    expect(result).toContain("# Questioner Session — Auth Redesign");
    expect(result).toContain("**Date:** 2026-04-04");
    expect(result).toContain(STATUS_COMPLETE);
    expect(result).toContain("**Dispatched to:** pending");
    expect(result).toContain("### Q: What is the scope?");
    expect(result).toContain("**A:** Full rewrite");
    expect(result).toContain("### Q: What is the deadline?");
    expect(result).toContain("**A:** Next sprint");
    expect(result).toContain("## Summary");
    expect(result).toContain("A full rewrite is planned for next sprint.");
    expect(result).toContain("## Debate Requested");
    expect(result).toContain("Yes");
    expect(result).not.toContain("[INCOMPLETE]");
    expect(result).not.toContain("Open Questions");
  });

  it("includes [INCOMPLETE] marker and Open Questions for failed session", () => {
    const artifact = {
      ...createEmptyQuestionerArtifact(),
      artifactState: "partial" as const,
      questions: [{ answer: "Partial answer", question: "First question?" }],
      sessionState: "failed" as const,
      turnCount: 1,
    };

    const result = formatBriefingMarkdown(artifact, "Cache Layer", TEST_DATE);

    expect(result).toContain("**Status:** [INCOMPLETE]");
    expect(result).toContain("## Open Questions");
    expect(result).toContain("*Session ended before sign-off.*");
    expect(result).toContain("### Q: First question?");
    expect(result).toContain("**A:** Partial answer");
  });

  it("omits Summary section when summary is null", () => {
    const artifact = {
      ...createEmptyQuestionerArtifact(),
      artifactState: "complete" as const,
      questions: [{ answer: "Only answer", question: "Only question?" }],
      sessionState: "completed" as const,
      turnCount: 2,
    };

    const result = formatBriefingMarkdown(
      artifact,
      "No Summary Topic",
      TEST_DATE,
    );

    expect(result).not.toContain("## Summary");
    expect(result).toContain(STATUS_COMPLETE);
    expect(result).toContain("## Debate Requested");
  });
});

describe("generateBriefingPath", () => {
  it("generates correct slug from topic", () => {
    const briefingPath = generateBriefingPath("Auth Redesign", TEST_DATE);
    expect(briefingPath).toBe(
      "docs/questioner-sessions/2026-04-04_auth-redesign.md",
    );
  });

  it("handles special characters in topic", () => {
    const briefingPath = generateBriefingPath("OAuth 2.0 & OIDC!!", TEST_DATE);
    expect(briefingPath).toBe(
      "docs/questioner-sessions/2026-04-04_oauth-2-0-oidc.md",
    );
  });

  it("strips leading and trailing hyphens from slug", () => {
    const briefingPath = generateBriefingPath("---Edge Case---", TEST_DATE);
    expect(briefingPath).toBe(
      "docs/questioner-sessions/2026-04-04_edge-case.md",
    );
  });

  it("includes date prefix in path", () => {
    const briefingPath = generateBriefingPath("My Topic", "2025-12-31");
    expect(briefingPath).toBe(
      "docs/questioner-sessions/2025-12-31_my-topic.md",
    );
  });
});

describe("writeBriefingFile", () => {
  let originalCwd: string;
  let temporaryDirectory: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    temporaryDirectory = mkdtempSync(path.join(tmpdir(), "briefing-test-"));
    process.chdir(temporaryDirectory);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(temporaryDirectory, { force: true, recursive: true });
  });

  it("anchors file to rootDirectory when provided", () => {
    const artifact = {
      ...createEmptyQuestionerArtifact(),
      artifactState: "complete" as const,
      questions: [{ answer: "Yes", question: "Is it anchored?" }],
      sessionState: "completed" as const,
      summary: "Anchored correctly.",
      turnCount: 2,
    };

    const filePath = writeBriefingFile(
      artifact,
      "Anchored Topic",
      TEST_DATE,
      temporaryDirectory,
    );

    const expected = path.join(
      temporaryDirectory,
      `docs/questioner-sessions/${TEST_DATE}_anchored-topic.md`,
    );
    expect(filePath).toBe(expected);
    expect(existsSync(filePath)).toBe(true);

    const content = readFileSync(filePath, "utf8");
    expect(content).toContain("# Questioner Session — Anchored Topic");
    expect(content).toContain("Anchored correctly.");
  });

  it("creates the directory and writes the briefing file", () => {
    const artifact = {
      ...createEmptyQuestionerArtifact(),
      artifactState: "complete" as const,
      questions: [{ answer: "Yes", question: "Is it ready?" }],
      sessionState: "completed" as const,
      summary: "Ready to ship.",
      turnCount: 2,
    };

    const filePath = writeBriefingFile(artifact, "Ship It", TEST_DATE);

    expect(filePath).toBe(`docs/questioner-sessions/${TEST_DATE}_ship-it.md`);

    const absolutePath = path.resolve(temporaryDirectory, filePath);
    expect(existsSync(absolutePath)).toBe(true);

    const content = readFileSync(absolutePath, "utf8");
    expect(content).toContain("# Questioner Session — Ship It");
    expect(content).toContain("**Status:** COMPLETE");
    expect(content).toContain("### Q: Is it ready?");
    expect(content).toContain("**A:** Yes");
    expect(content).toContain("Ready to ship.");
  });
});
