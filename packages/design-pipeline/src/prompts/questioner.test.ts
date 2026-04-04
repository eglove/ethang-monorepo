import { describe, expect, it } from "vitest";

import { buildQuestionerPrompt } from "./questioner.ts";

describe("buildQuestionerPrompt", () => {
  const seed = "my seed";
  const prompt = buildQuestionerPrompt(seed);

  it("returns a string containing the JSON protocol instruction", () => {
    expect(prompt).toContain('"type": "question"');
    expect(prompt).toContain("JSON object");
  });

  it("contains all three message types: question, summary, signoff", () => {
    expect(prompt).toContain('"question"');
    expect(prompt).toContain('"summary"');
    expect(prompt).toContain('"signoff"');
  });

  it("contains the one-question-per-turn instruction", () => {
    expect(prompt).toContain("one question per turn");
  });

  it("contains the completeness check instruction", () => {
    expect(prompt).toContain("Completeness Check");
    expect(prompt).toContain("review every answer");
  });

  it("includes the user-provided seed string", () => {
    expect(prompt).toContain(seed);
  });

  it("contains the recommendation-pairing instruction", () => {
    expect(prompt).toContain("recommendation");
    expect(prompt).toContain("Paired With a Recommendation");
  });
});
