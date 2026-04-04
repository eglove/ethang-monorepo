import noop from "lodash/noop.js";
import { describe, expect, it, vi } from "vitest";

import type {
  AnthropicClient,
  AnthropicResponse,
  BriefingWriter,
  ReadlinePort,
} from "./questioner-session.ts";

import { createQuestionerConfig } from "../config/questioner-config.ts";
// eslint-disable-next-line no-duplicate-imports
import { resolveSummary, runQuestionerSession } from "./questioner-session.ts";

// ── Constants ───────────────────────────────────────────────────

const MOCK_BRIEFING_PATH = "docs/questioner-sessions/2026-04-04_test.md";
const TEST_DATE = "2026-04-04";
const TEST_TOPIC = "Integration Test Topic";

// ── Helpers ─────────────────────────────────────────────────────

function createMockBriefingWriter(): {
  calls: { artifact: unknown; date: string; topic: string }[];
} & BriefingWriter {
  const calls: { artifact: unknown; date: string; topic: string }[] = [];
  return {
    calls,
    formatMarkdown: (_artifact, topic, date) => `# ${topic} ${date}`,
    generatePath: (_topic, date) => `docs/questioner-sessions/${date}_test.md`,
    writeFile: (artifact, topic, date) => {
      calls.push({ artifact, date, topic });
      return MOCK_BRIEFING_PATH;
    },
  };
}

function createMockClient(responses: string[]): AnthropicClient {
  let callIndex = 0;
  return {
    messages: {
      // eslint-disable-next-line @typescript-eslint/require-await
      create: async (): Promise<AnthropicResponse> => {
        const text = responses[callIndex] ?? "";
        callIndex += 1;
        return { content: [{ text, type: "text" }] };
      },
    },
  };
}

function createMockReadline(inputs: string[]): ReadlinePort {
  let inputIndex = 0;
  return {
    close: noop,
    // eslint-disable-next-line @typescript-eslint/require-await
    question: async (): Promise<string> => {
      const input = inputs[inputIndex] ?? "";
      inputIndex += 1;
      return input;
    },
  };
}

function questionJson(content: string): string {
  return JSON.stringify({ content, type: "question" });
}

function signoffJson(content: string): string {
  return JSON.stringify({ content, type: "signoff" });
}

function summaryJson(content: string): string {
  return JSON.stringify({ content, type: "summary" });
}

// ── Integration Tests: Happy Path ───────────────────────────────

describe("questioner-session E2E happy path", () => {
  it("full happy path: 3 questions, /summary, yes, signoff", async () => {
    // LLM returns 3 questions, then a summary (triggered by /summary), then signoff
    const client = createMockClient([
      questionJson("What problem are you solving?"),
      questionJson("Who is the target user?"),
      questionJson("What are the performance constraints?"),
      summaryJson(
        "Summary: solving X for Y with constraints Z. Ready to proceed?",
      ),
      signoffJson(
        "Final briefing: problem=X, user=Y, constraints=Z. All requirements captured.",
      ),
    ]);

    // User answers 3 questions, types /summary, approves with "yes"
    const readline = createMockReadline([
      "We need a caching layer for API responses",
      "Backend engineers on the platform team",
      "Sub-10ms p99 latency, 100k req/s",
      "/summary",
      "yes",
    ]);

    const writer = createMockBriefingWriter();

    const result = await runQuestionerSession({
      briefingWriter: writer,
      client,
      config: createQuestionerConfig({
        maxRetries: 3,
        maxSignoffAttempts: 3,
        maxTurns: 50,
        retryBaseDelayMs: 0,
      }),
      dateString: TEST_DATE,
      readline,
      topic: TEST_TOPIC,
    });

    expect(result.success).toBe(true);
    expect(result.artifact.sessionState).toBe("completed");
    expect(result.artifact.artifactState).toBe("complete");
    expect(result.artifact.questions).toHaveLength(3);
    expect(result.artifact.questions[0]).toStrictEqual({
      answer: "We need a caching layer for API responses",
      question: "What problem are you solving?",
    });
    expect(result.artifact.questions[1]).toStrictEqual({
      answer: "Backend engineers on the platform team",
      question: "Who is the target user?",
    });
    expect(result.artifact.questions[2]).toStrictEqual({
      answer: "Sub-10ms p99 latency, 100k req/s",
      question: "What are the performance constraints?",
    });
    expect(result.artifact.summary).toBe(
      "Summary: solving X for Y with constraints Z. Ready to proceed?",
    );
    expect(result.briefingPath).toBe(MOCK_BRIEFING_PATH);
    expect(writer.calls).toHaveLength(1);
    expect(writer.calls[0]?.topic).toBe(TEST_TOPIC);
  });

  it("LLM-initiated signoff without /summary completes normally", async () => {
    // LLM asks 2 questions then decides to sign off on its own
    const client = createMockClient([
      questionJson("What are you building?"),
      questionJson("Any constraints?"),
      signoffJson(
        "I have enough information. Final briefing: building X with constraint Y.",
      ),
    ]);
    const readline = createMockReadline([
      "A real-time notification system",
      "Must work with existing WebSocket infra",
    ]);
    const writer = createMockBriefingWriter();

    const result = await runQuestionerSession({
      briefingWriter: writer,
      client,
      config: createQuestionerConfig({
        maxRetries: 3,
        maxSignoffAttempts: 3,
        maxTurns: 50,
        retryBaseDelayMs: 0,
      }),
      dateString: TEST_DATE,
      readline,
      topic: TEST_TOPIC,
    });

    expect(result.success).toBe(true);
    expect(result.artifact.sessionState).toBe("completed");
    expect(result.artifact.artifactState).toBe("complete");
    expect(result.artifact.questions).toHaveLength(2);
    expect(result.artifact.summary).toBe(
      "I have enough information. Final briefing: building X with constraint Y.",
    );
    expect(result.briefingPath).toBe(MOCK_BRIEFING_PATH);
    expect(writer.calls).toHaveLength(1);
    expect(writer.calls[0]?.date).toBe(TEST_DATE);
  });
});

// ── Integration Tests: Failure Paths ────────────────────────────

describe("questioner-session E2E failure paths", () => {
  it("retry exhaustion E2E: invalid JSON (maxRetries+1) times fails", async () => {
    const maxRetries = 2;
    // 3 invalid responses (maxRetries + 1 = 3 attempts)
    const client = createMockClient([
      "not json at all",
      "{malformed",
      "still broken",
    ]);
    const readline = createMockReadline([]);
    const writer = createMockBriefingWriter();

    const result = await runQuestionerSession({
      briefingWriter: writer,
      client,
      config: createQuestionerConfig({
        maxRetries,
        maxSignoffAttempts: 3,
        maxTurns: 50,
        retryBaseDelayMs: 0,
      }),
      dateString: TEST_DATE,
      readline,
      topic: TEST_TOPIC,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("retry_exhausted");
    expect(result.artifact.sessionState).toBe("failed");
    // No questions were answered, so partial briefing is null
    expect(result.briefingPath).toBeNull();
  });

  it("retry exhaustion E2E with partial data saves partial briefing", async () => {
    // First a valid question, user answers, then LLM returns invalid JSON
    const client = createMockClient([
      questionJson("What do you need?"),
      "broken1",
      "broken2",
    ]);
    const readline = createMockReadline(["A caching layer"]);
    const writer = createMockBriefingWriter();

    const result = await runQuestionerSession({
      briefingWriter: writer,
      client,
      config: createQuestionerConfig({
        maxRetries: 1,
        maxSignoffAttempts: 3,
        maxTurns: 50,
        retryBaseDelayMs: 0,
      }),
      dateString: TEST_DATE,
      readline,
      topic: TEST_TOPIC,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("retry_exhausted");
    expect(result.artifact.questions).toHaveLength(1);
    // Partial briefing was saved because there were Q&A pairs
    expect(result.briefingPath).toBe(MOCK_BRIEFING_PATH);
    expect(writer.calls).toHaveLength(1);
  });

  it("turn cap E2E: maxTurns=3 from questioning state", async () => {
    const client = createMockClient([
      questionJson("Q1?"),
      questionJson("Q2?"),
      questionJson("Q3?"),
      questionJson("Q4 should never be asked"),
    ]);
    const readline = createMockReadline(["a1", "a2", "a3", "a4"]);
    const writer = createMockBriefingWriter();

    const result = await runQuestionerSession({
      briefingWriter: writer,
      client,
      config: createQuestionerConfig({
        maxRetries: 3,
        maxSignoffAttempts: 3,
        maxTurns: 3,
        retryBaseDelayMs: 0,
      }),
      dateString: TEST_DATE,
      readline,
      topic: TEST_TOPIC,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("turn_cap_exceeded");
    expect(result.artifact.sessionState).toBe("failed");
    // Turn cap fires when turnCount >= maxTurns AND sessionState === "questioning"
    // After 3 questions answered, turnCount=3 and state is "questioning" so it fires
    expect(result.artifact.turnCount).toBe(3);
    // Partial briefing written because there are Q&A pairs
    expect(result.briefingPath).toBe(MOCK_BRIEFING_PATH);
  });

  it("signoff exhaustion E2E: LLM refuses to sign off, CLI forces signoff", async () => {
    const maxSignoffAttempts = 2;
    const client = createMockClient([
      questionJson("Q1?"),
      summaryJson("Here is the summary."),
      // After user approves, LLM returns questions instead of signoff
      questionJson("But wait, what about edge case A?"),
      questionJson("And what about edge case B?"),
      // Third attempt never happens -- CLI forces after maxSignoffAttempts
    ]);
    const readline = createMockReadline(["answer1", "yes"]);
    const writer = createMockBriefingWriter();

    const result = await runQuestionerSession({
      briefingWriter: writer,
      client,
      config: createQuestionerConfig({
        maxRetries: 3,
        maxSignoffAttempts,
        maxTurns: 50,
        retryBaseDelayMs: 0,
      }),
      dateString: TEST_DATE,
      readline,
      topic: TEST_TOPIC,
    });

    // CLI force is a success path
    expect(result.success).toBe(true);
    expect(result.artifact.sessionState).toBe("completed");
    expect(result.artifact.artifactState).toBe("complete");
    expect(result.briefingPath).toBe(MOCK_BRIEFING_PATH);
    expect(writer.calls).toHaveLength(1);
  });
});

// ── Integration Tests: Multi-phase Flow ─────────────────────────

describe("questioner-session E2E multi-phase flow", () => {
  it("summary, keep going, summary, approve, signoff: full flow", async () => {
    const client = createMockClient([
      // Phase 1: 2 questions
      questionJson("What is the scope?"),
      questionJson("What is the timeline?"),
      // Phase 2: Q3 asked, user types /summary, LLM returns summary
      questionJson("What about deployment?"),
      summaryJson("Summary v1: scope is full rewrite, timeline is Q3."),
      // Phase 3: user says "no" -- LLM asks another question
      questionJson("What about testing strategy?"),
      // Phase 4: user answers, then user types /summary to next question
      questionJson("Anything else?"),
      summaryJson(
        "Summary v2: scope is full rewrite, timeline Q3, TDD approach.",
      ),
      // Phase 5: user says "yes" -- LLM returns signoff
      signoffJson("Final briefing: full rewrite, Q3, TDD. All captured."),
    ]);

    const readline = createMockReadline([
      "Full rewrite of the auth module", // answer to Q1
      "Q3 2026", // answer to Q2
      "/summary", // intercept on Q3 "What about deployment?"
      "no", // reject summary v1
      "TDD with 90% coverage target", // answer to Q4 "What about testing strategy?"
      "/summary", // intercept on Q5 "Anything else?"
      "yes", // approve summary v2
    ]);

    const writer = createMockBriefingWriter();

    const result = await runQuestionerSession({
      briefingWriter: writer,
      client,
      config: createQuestionerConfig({
        maxRetries: 3,
        maxSignoffAttempts: 3,
        maxTurns: 50,
        retryBaseDelayMs: 0,
      }),
      dateString: TEST_DATE,
      readline,
      topic: TEST_TOPIC,
    });

    expect(result.success).toBe(true);
    expect(result.artifact.sessionState).toBe("completed");
    expect(result.artifact.artifactState).toBe("complete");
    // 3 questions answered: Q1, Q2, Q4 (/summary intercepts on Q3 and Q5 are not recorded)
    expect(result.artifact.questions).toHaveLength(3);
    expect(result.artifact.questions[0]).toStrictEqual({
      answer: "Full rewrite of the auth module",
      question: "What is the scope?",
    });
    expect(result.artifact.questions[1]).toStrictEqual({
      answer: "Q3 2026",
      question: "What is the timeline?",
    });
    expect(result.artifact.questions[2]).toStrictEqual({
      answer: "TDD with 90% coverage target",
      question: "What about testing strategy?",
    });
    // Summary should be from v2 since handleSummary patches summary each time
    expect(result.artifact.summary).toBe(
      "Summary v2: scope is full rewrite, timeline Q3, TDD approach.",
    );
    expect(result.briefingPath).toBe(MOCK_BRIEFING_PATH);
    expect(writer.calls).toHaveLength(1);
  });
});

describe("resolveSummary — null fallback branch (line 285)", () => {
  it("returns artifact.summary when it is set", () => {
    const result = resolveSummary(
      {
        artifactState: "complete",
        questions: [{ answer: "a", question: "q" }],
        sessionState: "signingOff",
        summary: "Existing summary",
        turnCount: 3,
      },
      "topic",
      TEST_DATE,
    );
    expect(result).toBe("Existing summary");
  });

  it("falls back to formatBriefingMarkdown when summary is null", () => {
    const result = resolveSummary(
      {
        artifactState: "partial",
        questions: [{ answer: "a", question: "q" }],
        sessionState: "signingOff",
        summary: null,
        turnCount: 2,
      },
      "topic",
      TEST_DATE,
    );
    expect(result).toContain("topic");
    expect(result).toContain(TEST_DATE);
  });
});

describe("questioner-session — default briefingWriter fallback (line 103)", () => {
  it("uses default briefingWriter when none provided", async () => {
    const briefingWriter = await import("./briefing-writer.ts");
    const spiedWrite = vi.spyOn(briefingWriter, "writeBriefingFile");
    spiedWrite.mockReturnValue("/spy/default-writer-path.md");

    try {
      const client = createMockClient([signoffJson("Done.")]);
      const readline = createMockReadline([]);

      const result = await runQuestionerSession({
        client,
        config: createQuestionerConfig({ retryBaseDelayMs: 0 }),
        dateString: TEST_DATE,
        readline,
        topic: "DefaultWriter",
      });

      expect(result.success).toBe(true);
      expect(result.briefingPath).toBe("/spy/default-writer-path.md");
    } finally {
      spiedWrite.mockRestore();
    }
  });
});
