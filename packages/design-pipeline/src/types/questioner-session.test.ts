import { describe, expect, it } from "vitest";

import {
  QuestionerArtifactSchema,
  QuestionerMessageSchema,
} from "../schemas/questioner-session.ts";
import {
  ARTIFACT_STATES,
  createEmptyQuestionerArtifact,
  SESSION_STATES,
} from "./questioner-session.ts";

describe("Session States", () => {
  it("defines exactly 6 session states", () => {
    expect(SESSION_STATES).toHaveLength(6);
    expect(SESSION_STATES).toEqual([
      "questioning",
      "awaitingInput",
      "summaryPresented",
      "signingOff",
      "completed",
      "failed",
    ]);
  });
});

describe("Artifact States", () => {
  it("defines exactly 3 artifact states", () => {
    expect(ARTIFACT_STATES).toHaveLength(3);
    expect(ARTIFACT_STATES).toEqual(["empty", "partial", "complete"]);
  });
});

describe("createEmptyQuestionerArtifact", () => {
  it("returns correct defaults", () => {
    const artifact = createEmptyQuestionerArtifact();
    expect(artifact).toEqual({
      artifactState: "empty",
      questions: [],
      sessionState: "questioning",
      summary: null,
      turnCount: 0,
    });
  });

  it("returns a new object each call", () => {
    const a = createEmptyQuestionerArtifact();
    const b = createEmptyQuestionerArtifact();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

describe("QuestionerMessageSchema", () => {
  it("parses valid question message", () => {
    const result = QuestionerMessageSchema.safeParse({
      content: "What is the target platform?",
      type: "question",
    });
    expect(result.success).toBe(true);
  });

  it("parses valid summary message", () => {
    const result = QuestionerMessageSchema.safeParse({
      content: "Here is the summary.",
      type: "summary",
    });
    expect(result.success).toBe(true);
  });

  it("parses valid signoff message", () => {
    const result = QuestionerMessageSchema.safeParse({
      content: "Session complete.",
      type: "signoff",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid type", () => {
    const result = QuestionerMessageSchema.safeParse({
      content: "Hello",
      type: "greeting",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty content", () => {
    const result = QuestionerMessageSchema.safeParse({
      content: "",
      type: "question",
    });
    expect(result.success).toBe(false);
  });
});

describe("QuestionerArtifactSchema", () => {
  it("validates a full artifact", () => {
    const result = QuestionerArtifactSchema.safeParse({
      artifactState: "partial",
      questions: [{ answer: "Web app", question: "What platform?" }],
      sessionState: "awaitingInput",
      summary: null,
      turnCount: 1,
    });
    expect(result.success).toBe(true);
  });

  it("validates the empty artifact from factory", () => {
    const artifact = createEmptyQuestionerArtifact();
    const result = QuestionerArtifactSchema.safeParse(artifact);
    expect(result.success).toBe(true);
  });
});
