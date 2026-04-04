import { describe, expect, it } from "vitest";

import {
  QuestionAnswerSchema,
  QuestionerArtifactSchema,
  QuestionerMessageSchema,
} from "./questioner-session.ts";

describe("QuestionerMessageSchema", () => {
  it("accepts all 3 valid types", () => {
    for (const type of ["question", "summary", "signoff"]) {
      const result = QuestionerMessageSchema.safeParse({
        content: `Test ${type}`,
        type,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects missing type", () => {
    const result = QuestionerMessageSchema.safeParse({
      content: "Hello",
    });
    expect(result.success).toBe(false);
  });

  it("rejects wrong type value", () => {
    const result = QuestionerMessageSchema.safeParse({
      content: "Hello",
      type: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing content", () => {
    const result = QuestionerMessageSchema.safeParse({
      type: "question",
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

describe("QuestionAnswerSchema", () => {
  it("validates a Q&A pair", () => {
    const result = QuestionAnswerSchema.safeParse({
      answer: "React with TypeScript",
      question: "What framework are you using?",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing question", () => {
    const result = QuestionAnswerSchema.safeParse({
      answer: "React",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing answer", () => {
    const result = QuestionAnswerSchema.safeParse({
      question: "What framework?",
    });
    expect(result.success).toBe(false);
  });
});

describe("QuestionerArtifactSchema", () => {
  it("validates a full artifact", () => {
    const result = QuestionerArtifactSchema.safeParse({
      artifactState: "complete",
      questions: [
        { answer: "Web app", question: "What platform?" },
        { answer: "React", question: "What framework?" },
      ],
      sessionState: "completed",
      summary: "Build a React web app.",
      turnCount: 2,
    });
    expect(result.success).toBe(true);
  });

  it("validates empty artifact", () => {
    const result = QuestionerArtifactSchema.safeParse({
      artifactState: "empty",
      questions: [],
      sessionState: "questioning",
      summary: null,
      turnCount: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative turnCount", () => {
    const result = QuestionerArtifactSchema.safeParse({
      artifactState: "empty",
      questions: [],
      sessionState: "questioning",
      summary: null,
      turnCount: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer turnCount", () => {
    const result = QuestionerArtifactSchema.safeParse({
      artifactState: "empty",
      questions: [],
      sessionState: "questioning",
      summary: null,
      turnCount: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid sessionState", () => {
    const result = QuestionerArtifactSchema.safeParse({
      artifactState: "empty",
      questions: [],
      sessionState: "invalid",
      summary: null,
      turnCount: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid artifactState", () => {
    const result = QuestionerArtifactSchema.safeParse({
      artifactState: "invalid",
      questions: [],
      sessionState: "questioning",
      summary: null,
      turnCount: 0,
    });
    expect(result.success).toBe(false);
  });
});
