import includes from "lodash/includes.js";
import noop from "lodash/noop.js";
import { describe, expect, it, vi } from "vitest";

import type {
  AnthropicClient,
  AnthropicResponse,
  BriefingWriter,
  QuestionerDeps,
  ReadlinePort,
} from "./questioner-session.ts";

import { createQuestionerConfig } from "../config/questioner-config.ts";
// eslint-disable-next-line no-duplicate-imports
import { runQuestionerSession } from "./questioner-session.ts";

// ── Constants ───────────────────────────────────────────────────

const MOCK_BRIEFING_PATH = "docs/questioner-sessions/2026-04-04_test.md";
const TEST_DATE = "2026-04-04";

// ── Test helpers ────────────────────────────────────────────────

function createMockClient(responses: string[]): AnthropicClient {
  let callIndex = 0;
  return {
    messages: {
      // eslint-disable-next-line @typescript-eslint/require-await
      create: async () => {
        const text = responses[callIndex] ?? "";
        callIndex += 1;
        return makeResponse(text);
      },
    },
  };
}

function createMockReadline(inputs: string[]): ReadlinePort {
  let inputIndex = 0;
  return {
    close: noop,
    // eslint-disable-next-line @typescript-eslint/require-await
    question: async () => {
      const input = inputs[inputIndex] ?? "";
      inputIndex += 1;
      return input;
    },
  };
}

function createMockWriter(): {
  calls: { artifact: unknown; topic: string }[];
} & BriefingWriter {
  const calls: { artifact: unknown; topic: string }[] = [];
  return {
    calls,
    formatMarkdown: (_artifact, topic, date) => `# ${topic} ${date}`,
    generatePath: (_topic, date) => `docs/questioner-sessions/${date}_test.md`,
    writeFile: (_artifact, topic, _date) => {
      calls.push({ artifact: _artifact, topic });
      return MOCK_BRIEFING_PATH;
    },
  };
}

function makeDeps(
  overrides: {
    client: AnthropicClient;
    readline: ReadlinePort;
  } & Partial<QuestionerDeps>,
): QuestionerDeps {
  return {
    briefingWriter: createMockWriter(),
    config: createQuestionerConfig({
      maxRetries: 3,
      maxSignoffAttempts: 3,
      maxTurns: 50,
      retryBaseDelayMs: 0,
    }),
    dateString: TEST_DATE,
    topic: "Test Topic",
    ...overrides,
  };
}

function makeResponse(content: string): AnthropicResponse {
  return {
    content: [{ text: content, type: "text" }],
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

// ── Assertion helpers ────────────────────────────────────────────

const ARTIFACT_COMPLETE = "complete";
const COMPLETED = "completed";
const FAILED = "failed";
const SCOPE_QUESTION = "What is the scope?";

function expectCompleted(result: {
  artifact: { artifactState: string; sessionState: string };
  success: boolean;
}): void {
  expect(result.success).toBe(true);
  expect(result.artifact.sessionState).toBe(COMPLETED);
}

// ── Tests ───────────────────────────────────────────────────────

describe("runQuestionerSession — happy path", () => {
  it("2 questions then signoff completes with artifact complete", async () => {
    const client = createMockClient([
      questionJson(SCOPE_QUESTION),
      questionJson("What is the deadline?"),
      signoffJson("Final briefing: scope is full, deadline is Q3."),
    ]);
    const readline = createMockReadline(["Full rewrite", "Q3 2026"]);
    const writer = createMockWriter();

    const result = await runQuestionerSession(
      makeDeps({ briefingWriter: writer, client, readline }),
    );

    expectCompleted(result);
    expect(result.artifact.artifactState).toBe(ARTIFACT_COMPLETE);
    expect(result.artifact.questions).toHaveLength(2);
    expect(result.artifact.questions[0]?.question).toBe(SCOPE_QUESTION);
    expect(result.artifact.questions[0]?.answer).toBe("Full rewrite");
    expect(result.artifact.questions[1]?.question).toBe(
      "What is the deadline?",
    );
    expect(result.artifact.questions[1]?.answer).toBe("Q3 2026");
    expect(result.briefingPath).toBe(MOCK_BRIEFING_PATH);
    expect(writer.calls).toHaveLength(1);
  });

  it("LLM-initiated signoff without /summary completes successfully", async () => {
    const client = createMockClient([
      questionJson("Q1?"),
      signoffJson("I believe we have covered everything. Final briefing."),
    ]);
    const readline = createMockReadline(["answer1"]);

    const result = await runQuestionerSession(makeDeps({ client, readline }));

    expectCompleted(result);
    expect(result.artifact.artifactState).toBe(ARTIFACT_COMPLETE);
    expect(result.artifact.summary).toBe(
      "I believe we have covered everything. Final briefing.",
    );
  });

  it("artifact progression: empty then partial then complete", async () => {
    const responses = [questionJson("Q1?"), signoffJson("Done.")];
    const client = createMockClient(responses);
    const readline = createMockReadline(["answer"]);

    const result = await runQuestionerSession(makeDeps({ client, readline }));

    expect(result.artifact.artifactState).toBe(ARTIFACT_COMPLETE);
    expect(result.artifact.questions).toHaveLength(1);
  });

  it("malformed JSON retry: invalid once then valid resets", async () => {
    const client = createMockClient([
      "not valid json",
      questionJson("What do you need?"),
      signoffJson("Done."),
    ]);
    const readline = createMockReadline(["Everything"]);

    const result = await runQuestionerSession(makeDeps({ client, readline }));

    expectCompleted(result);
  });
});

describe("runQuestionerSession — /summary interception", () => {
  it("exact /summary triggers summary request to LLM", async () => {
    const client = createMockClient([
      questionJson(SCOPE_QUESTION),
      summaryJson("Here is the summary of our discussion."),
      signoffJson("Final signoff briefing."),
    ]);
    const readline = createMockReadline(["/summary", "yes"]);

    const result = await runQuestionerSession(makeDeps({ client, readline }));

    expectCompleted(result);
    expect(result.artifact.questions).toHaveLength(0);
    expect(result.artifact.summary).toBe(
      "Here is the summary of our discussion.",
    );
  });

  it("non-exact /summary in answer does NOT trigger interception", async () => {
    const client = createMockClient([
      questionJson(SCOPE_QUESTION),
      signoffJson("Final briefing."),
    ]);
    const readline = createMockReadline(["I said /summary in my answer"]);

    const result = await runQuestionerSession(makeDeps({ client, readline }));

    expectCompleted(result);
    expect(result.artifact.questions).toHaveLength(1);
    expect(result.artifact.questions[0]?.answer).toBe(
      "I said /summary in my answer",
    );
  });
});

describe("runQuestionerSession — summary and signoff flow", () => {
  it("summary then keep going continues questioning", async () => {
    const client = createMockClient([
      questionJson("Q1?"),
      summaryJson("Here is the summary."),
      questionJson("Q2?"),
      signoffJson("Final briefing."),
    ]);
    const readline = createMockReadline([
      "answer1",
      "no, keep going",
      "answer2",
    ]);

    const result = await runQuestionerSession(makeDeps({ client, readline }));

    expectCompleted(result);
    expect(result.artifact.questions).toHaveLength(2);
  });

  it("summary then yes proceeds to signoff", async () => {
    const client = createMockClient([
      questionJson("Q1?"),
      summaryJson("Summary."),
      signoffJson("Signoff briefing."),
    ]);
    const readline = createMockReadline(["answer1", "approve"]);

    const result = await runQuestionerSession(makeDeps({ client, readline }));

    expectCompleted(result);
    expect(result.artifact.summary).toBe("Summary.");
  });

  it("approve variants: y and approve both trigger signoff", async () => {
    for (const approval of ["y", "approve", "yes"]) {
      const client = createMockClient([
        questionJson("Q?"),
        summaryJson("Sum."),
        signoffJson("Done."),
      ]);
      const readline = createMockReadline(["a", approval]);

      // eslint-disable-next-line no-await-in-loop
      const result = await runQuestionerSession(makeDeps({ client, readline }));

      expectCompleted(result);
    }
  });

  it("signoff guard: LLM returns question instead of signoff retries then CLI forces", async () => {
    const config = createQuestionerConfig({
      maxRetries: 3,
      maxSignoffAttempts: 2,
      maxTurns: 50,
      retryBaseDelayMs: 0,
    });
    const client = createMockClient([
      questionJson("Q1?"),
      summaryJson("Summary of discussion."),
      questionJson("But what about X?"),
      questionJson("And what about Y?"),
    ]);
    const readline = createMockReadline(["answer1", "yes"]);
    const writer = createMockWriter();

    const result = await runQuestionerSession(
      makeDeps({ briefingWriter: writer, client, config, readline }),
    );

    expectCompleted(result);
    expect(result.artifact.artifactState).toBe(ARTIFACT_COMPLETE);
  });
});

describe("runQuestionerSession — failure paths", () => {
  it("turn cap: fails with turn_cap_exceeded from questioning state only", async () => {
    const config = createQuestionerConfig({
      maxRetries: 3,
      maxSignoffAttempts: 3,
      maxTurns: 2,
      retryBaseDelayMs: 0,
    });
    const client = createMockClient([
      questionJson("Q1?"),
      questionJson("Q2?"),
      questionJson("Q3?"),
    ]);
    const readline = createMockReadline(["a1", "a2", "a3"]);
    const writer = createMockWriter();

    const result = await runQuestionerSession(
      makeDeps({ briefingWriter: writer, client, config, readline }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("turn_cap_exceeded");
    expect(result.artifact.sessionState).toBe(FAILED);
    expect(result.artifact.turnCount).toBe(2);
  });

  it("retry exhaustion: invalid JSON maxRetries+1 times fails with retry_exhausted", async () => {
    const config = createQuestionerConfig({
      maxRetries: 2,
      maxSignoffAttempts: 3,
      maxTurns: 50,
      retryBaseDelayMs: 0,
    });
    const client = createMockClient(["bad1", "bad2", "bad3"]);
    const readline = createMockReadline([]);
    const writer = createMockWriter();

    const result = await runQuestionerSession(
      makeDeps({ briefingWriter: writer, client, config, readline }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("retry_exhausted");
    expect(result.artifact.sessionState).toBe(FAILED);
    expect(result.briefingPath).toBeNull();
  });

  it("writePartialBriefing returns null when writer throws", async () => {
    const config = createQuestionerConfig({
      maxRetries: 1,
      maxSignoffAttempts: 3,
      maxTurns: 50,
      retryBaseDelayMs: 0,
    });
    const client = createMockClient([questionJson("Q1?"), "bad1", "bad2"]);
    const readline = createMockReadline(["answer1"]);
    const throwingWriter: BriefingWriter = {
      formatMarkdown: (_artifact, topic, date) => `# ${topic} ${date}`,
      generatePath: (_topic, date) =>
        `docs/questioner-sessions/${date}_test.md`,
      writeFile: () => {
        throw new Error("disk full");
      },
    };

    const result = await runQuestionerSession(
      makeDeps({
        briefingWriter: throwingWriter,
        client,
        config,
        readline,
      }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("retry_exhausted");
    expect(result.artifact.questions).toHaveLength(1);
    expect(result.briefingPath).toBeNull();
  });

  it("retry exhaustion with partial questions writes partial briefing", async () => {
    const config = createQuestionerConfig({
      maxRetries: 1,
      maxSignoffAttempts: 3,
      maxTurns: 50,
      retryBaseDelayMs: 0,
    });
    const client = createMockClient([questionJson("Q1?"), "bad1", "bad2"]);
    const readline = createMockReadline(["answer1"]);
    const writer = createMockWriter();

    const result = await runQuestionerSession(
      makeDeps({ briefingWriter: writer, client, config, readline }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("retry_exhausted");
    expect(result.artifact.questions).toHaveLength(1);
    expect(result.briefingPath).toBe(MOCK_BRIEFING_PATH);
  });
});

describe("runQuestionerSession — SIGINT handling", () => {
  it("abort produces user_abandon with partial briefing", async () => {
    let questionCallCount = 0;
    const client = createMockClient([questionJson("Q1?"), questionJson("Q2?")]);
    const readline: ReadlinePort = {
      close: noop,
      // eslint-disable-next-line @typescript-eslint/require-await
      question: async () => {
        questionCallCount += 1;
        if (2 === questionCallCount) {
          process.emit("SIGINT", "SIGINT");
        }
        return `answer${String(questionCallCount)}`;
      },
    };
    const writer = createMockWriter();

    const result = await runQuestionerSession(
      makeDeps({ briefingWriter: writer, client, readline }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("user_abandon");
    expect(result.artifact.sessionState).toBe(FAILED);
  });

  it("SIGINT before any questions produces null briefingPath", async () => {
    const client = createMockClient([questionJson("Q1?")]);
    const readline: ReadlinePort = {
      close: noop,
      // eslint-disable-next-line @typescript-eslint/require-await
      question: async () => {
        process.emit("SIGINT", "SIGINT");
        return "answer";
      },
    };

    const result = await runQuestionerSession(makeDeps({ client, readline }));

    expect(result.success).toBe(false);
    expect(result.error).toBe("user_abandon");
    expect(result.artifact.questions).toHaveLength(0);
    expect(result.briefingPath).toBeNull();
  });

  it("cleans up SIGINT handler after completion", async () => {
    const listenersBefore = process.listenerCount("SIGINT");
    const client = createMockClient([signoffJson("Done.")]);
    const readline = createMockReadline([]);

    await runQuestionerSession(makeDeps({ client, readline }));

    const listenersAfter = process.listenerCount("SIGINT");
    expect(listenersAfter).toBe(listenersBefore);
  });

  it("SIGINT during summary approval produces user_abandon", async () => {
    const client = createMockClient([
      questionJson("Q1?"),
      summaryJson("Here is the summary."),
    ]);
    const readline: ReadlinePort = {
      close: noop,
      // eslint-disable-next-line @typescript-eslint/require-await -- test mock emits SIGINT synchronously
      question: async (prompt: string): Promise<string> => {
        if (includes(prompt, "Approve")) {
          process.emit("SIGINT", "SIGINT");
          return "yes";
        }
        return "answer1";
      },
    };
    const writer = createMockWriter();

    const result = await runQuestionerSession(
      makeDeps({ briefingWriter: writer, client, readline }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("user_abandon");
    expect(result.artifact.sessionState).toBe(FAILED);
  });

  it("SIGINT detected at top of session loop via signoff guard produces user_abandon", async () => {
    const config = createQuestionerConfig({
      maxRetries: 3,
      maxSignoffAttempts: 5,
      maxTurns: 50,
      retryBaseDelayMs: 0,
    });
    let llmCallCount = 0;
    const client: AnthropicClient = {
      messages: {
        // eslint-disable-next-line @typescript-eslint/require-await
        create: async () => {
          llmCallCount += 1;
          if (1 === llmCallCount) {
            return makeResponse(questionJson("Q1?"));
          }
          if (2 === llmCallCount) {
            return makeResponse(summaryJson("Summary."));
          }
          // LLM returns question instead of signoff — triggers signoff guard
          // Fire SIGINT during signoff guard path so loop catches it
          if (3 === llmCallCount) {
            process.emit("SIGINT", "SIGINT");
          }
          return makeResponse(questionJson("Extra question?"));
        },
      },
    };
    const readline = createMockReadline(["answer1", "yes"]);

    const result = await runQuestionerSession(
      makeDeps({ client, config, readline }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("user_abandon");
  });

  it("cleans up SIGINT handler after failure", async () => {
    const listenersBefore = process.listenerCount("SIGINT");
    const config = createQuestionerConfig({
      maxRetries: 1,
      maxSignoffAttempts: 3,
      maxTurns: 50,
      retryBaseDelayMs: 0,
    });
    const client = createMockClient(["bad", "bad"]);
    const readline = createMockReadline([]);

    await runQuestionerSession(makeDeps({ client, config, readline }));

    const listenersAfter = process.listenerCount("SIGINT");
    expect(listenersAfter).toBe(listenersBefore);
  });

  it("default dateString uses ISO date format when not provided", async () => {
    const client = createMockClient([signoffJson("Done.")]);
    const readline = createMockReadline([]);
    const writer = createMockWriter();

    await runQuestionerSession({
      briefingWriter: writer,
      client,
      config: createQuestionerConfig({ retryBaseDelayMs: 0 }),
      readline,
      topic: "Date Test",
    });

    expect(writer.calls).toHaveLength(1);
  });
});

describe("runQuestionerSession — branch gap coverage", () => {
  it("extractText returns empty string when response has no text block (line 208)", async () => {
    // Response with no "text" type block — extractText falls back to ""
    const noTextResponse: AnthropicResponse = {
      content: [{ type: "tool_use" }],
    };
    const client: AnthropicClient = {
      messages: {
        // eslint-disable-next-line @typescript-eslint/require-await
        create: async () => noTextResponse,
      },
    };

    const result = await runQuestionerSession(
      makeDeps({
        client,
        config: createQuestionerConfig({
          maxRetries: 1,
          maxSignoffAttempts: 3,
          maxTurns: 50,
          retryBaseDelayMs: 0,
        }),
        readline: createMockReadline([]),
      }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("retry_exhausted");
  });

  it("API throw is caught and retried then fails with retry_exhausted", async () => {
    const config = createQuestionerConfig({
      maxRetries: 1,
      maxSignoffAttempts: 3,
      maxTurns: 50,
      retryBaseDelayMs: 0,
    });
    const errorSpy = vi
      .spyOn(globalThis.console, "error")
      .mockImplementation(noop);
    const client: AnthropicClient = {
      messages: {
        // eslint-disable-next-line @typescript-eslint/require-await -- test mock must throw inside async to simulate API error
        create: async () => {
          throw new Error("network timeout");
        },
      },
    };
    const readline = createMockReadline([]);

    const result = await runQuestionerSession(
      makeDeps({ client, config, readline }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("retry_exhausted");
    expect(result.artifact.sessionState).toBe(FAILED);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[questioner] API error on attempt"),
      expect.any(Error),
    );
    errorSpy.mockRestore();
  });

  it("parseMessage returns undefined for valid JSON that fails schema (line 374)", async () => {
    const config = createQuestionerConfig({
      maxRetries: 1,
      maxSignoffAttempts: 3,
      maxTurns: 50,
      retryBaseDelayMs: 0,
    });
    // Valid JSON but type is not one of "question" | "summary" | "signoff"
    const client = createMockClient([
      JSON.stringify({ content: "hello", type: "invalid_type" }),
      JSON.stringify({ content: "hello", type: "invalid_type" }),
    ]);
    const readline = createMockReadline([]);

    const result = await runQuestionerSession(
      makeDeps({ client, config, readline }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("retry_exhausted");
  });

  it("uses generic initial message when topic is empty or 'pipeline'", async () => {
    const client = createMockClient([signoffJson("Done.")]);
    const readline = createMockReadline([]);
    const writer = createMockWriter();

    const result = await runQuestionerSession(
      makeDeps({ briefingWriter: writer, client, readline, topic: "" }),
    );

    expect(result.success).toBe(true);
  });
});
