import find from "lodash/find.js";
import toLower from "lodash/toLower.js";
import trim from "lodash/trim.js";

import type { QuestionerConfig } from "../config/questioner-config.ts";

import { buildQuestionerPrompt } from "../prompts/questioner.ts";
import {
  type QuestionerMessage,
  QuestionerMessageSchema,
} from "../schemas/questioner-session.ts";
import {
  type ArtifactState,
  createEmptyQuestionerArtifact,
  type QuestionerArtifact,
} from "../types/questioner-session.ts";
import {
  formatBriefingMarkdown,
  generateBriefingPath,
  writeBriefingFile,
} from "./briefing-writer.ts";

// ── Port types for injectable dependencies ──────────────────────

export type AnthropicClient = {
  messages: {
    create: (parameters: {
      max_tokens: number;
      messages: MessageParameter[];
      model: string;
      system: string;
    }) => Promise<AnthropicResponse>;
  };
};

export type AnthropicResponse = {
  content: readonly { text?: string; type: string }[];
};

export type BriefingWriter = {
  formatMarkdown: typeof formatBriefingMarkdown;
  generatePath: typeof generateBriefingPath;
  writeFile: typeof writeBriefingFile;
};

export type MessageParameter = {
  content: string;
  role: "assistant" | "user";
};

export type QuestionerDeps = {
  briefingWriter?: BriefingWriter;
  client: AnthropicClient;
  config: QuestionerConfig;
  dateString?: string;
  readline: ReadlinePort;
  topic: string;
};

export type ReadlinePort = {
  close: () => void;
  question: (prompt: string) => Promise<string>;
};

export type SessionResult = {
  artifact: QuestionerArtifact;
  briefingPath: null | string;
  error?: string;
  success: boolean;
};

// ── Internal session context ────────────────────────────────────

type SessionContext = {
  artifact: QuestionerArtifact;
  client: AnthropicClient;
  config: QuestionerConfig;
  dateString: string;
  messages: MessageParameter[];
  readline: ReadlinePort;
  signoffAttempts: number;
  systemPrompt: string;
  topic: string;
  writer: BriefingWriter;
};

type TurnOutcome = { done: false } | { done: true; result: SessionResult };

// ── Pure helpers ────────────────────────────────────────────────

export function resolveSummary(
  artifact: QuestionerArtifact,
  topic: string,
  dateString: string,
): string {
  return (
    artifact.summary ?? formatBriefingMarkdown(artifact, topic, dateString)
  );
}

export async function runQuestionerSession(
  deps: QuestionerDeps,
): Promise<SessionResult> {
  const {
    briefingWriter,
    client,
    config,
    dateString: rawDate,
    readline,
    topic,
  } = deps;
  const dateString = rawDate ?? new Date().toISOString().slice(0, 10);
  const writer = briefingWriter ?? {
    formatMarkdown: formatBriefingMarkdown,
    generatePath: generateBriefingPath,
    writeFile: writeBriefingFile,
  };

  const abortedReference = { value: false };
  const onSigint = (): void => {
    abortedReference.value = true;
  };
  process.on("SIGINT", onSigint);

  const cleanup = (): void => {
    process.removeListener("SIGINT", onSigint);
  };

  const context: SessionContext = {
    artifact: createEmptyQuestionerArtifact(),
    client,
    config,
    dateString,
    messages: [],
    readline,
    signoffAttempts: 0,
    systemPrompt: buildQuestionerPrompt(topic),
    topic,
    writer,
  };

  try {
    return await sessionLoop(context, abortedReference);
  } finally {
    cleanup();
  }
}

async function callLlm(
  client: AnthropicClient,
  systemPrompt: string,
  messages: MessageParameter[],
): Promise<AnthropicResponse> {
  return client.messages.create({
    max_tokens: 4096,
    messages,
    model: "claude-sonnet-4-20250514",
    system: systemPrompt,
  });
}

async function callWithRetry(
  client: AnthropicClient,
  systemPrompt: string,
  messages: MessageParameter[],
  config: QuestionerConfig,
): Promise<QuestionerMessage | undefined> {
  for (let attempt = 0; attempt <= config.maxRetries; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const response = await callLlm(client, systemPrompt, messages);
    const raw = extractText(response);
    const parsed = parseMessage(raw);

    if (parsed !== undefined) {
      return parsed;
    }

    if (attempt < config.maxRetries) {
      // eslint-disable-next-line no-await-in-loop
      await delay(config.retryBaseDelayMs * 2 ** attempt);
    }
  }
  return undefined;
}

function computeArtifactState(questionCount: number): ArtifactState {
  return 0 < questionCount ? "partial" : "empty";
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// ── LLM communication ───────────────────────────────────────────

async function dispatchTurn(
  context: SessionContext,
  parsed: QuestionerMessage,
  abortedReference: { value: boolean },
): Promise<TurnOutcome> {
  switch (parsed.type) {
    case "question": {
      return handleQuestion(context, parsed.content, abortedReference);
    }
    case "signoff": {
      return handleSignoff(context, parsed.content);
    }
    case "summary": {
      return handleSummary(context, parsed.content, abortedReference);
    }
  }
}

function extractText(response: AnthropicResponse): string {
  const textBlock = find(response.content, (block) => "text" === block.type);
  return textBlock?.text ?? "";
}

async function handleQuestion(
  context: SessionContext,
  content: string,
  abortedReference: { value: boolean },
): Promise<TurnOutcome> {
  if ("signingOff" === context.artifact.sessionState) {
    return handleSignoffGuard(context);
  }

  context.artifact = patchArtifact(context.artifact, {
    artifactState: computeArtifactState(context.artifact.questions.length),
    sessionState: "questioning",
    turnCount: context.artifact.turnCount + 1,
  });

  const userInput = await context.readline.question(
    `\n${content}\n\nYour answer: `,
  );

  if (abortedReference.value) {
    return { done: true, result: makeFailResult(context, "user_abandon") };
  }

  if ("/summary" === userInput) {
    context.messages.push({
      content:
        'Please summarize everything we have discussed so far. Respond with a JSON object of type "summary".',
      role: "user",
    });
  } else {
    context.artifact = patchArtifact(context.artifact, {
      artifactState: "partial",
      questions: [
        ...context.artifact.questions,
        { answer: userInput, question: content },
      ],
    });
    context.messages.push({ content: userInput, role: "user" });
  }

  return { done: false };
}

// ── Turn handlers ───────────────────────────────────────────────

function handleSignoff(context: SessionContext, content: string): TurnOutcome {
  const artifact = patchArtifact(context.artifact, {
    artifactState: "complete",
    sessionState: "completed",
    summary: context.artifact.summary ?? content,
    turnCount: context.artifact.turnCount + 1,
  });
  context.artifact = artifact;
  return {
    done: true,
    result: {
      artifact,
      briefingPath: context.writer.writeFile(
        artifact,
        context.topic,
        context.dateString,
      ),
      success: true,
    },
  };
}

function handleSignoffGuard(context: SessionContext): TurnOutcome {
  context.signoffAttempts += 1;
  if (context.signoffAttempts >= context.config.maxSignoffAttempts) {
    const resolvedSummary = resolveSummary(
      context.artifact,
      context.topic,
      context.dateString,
    );
    const artifact = patchArtifact(context.artifact, {
      artifactState: "complete",
      sessionState: "completed",
      summary: resolvedSummary,
    });
    context.artifact = artifact;
    return {
      done: true,
      result: {
        artifact,
        briefingPath: context.writer.writeFile(
          artifact,
          context.topic,
          context.dateString,
        ),
        success: true,
      },
    };
  }
  context.messages.push({
    content:
      'The user has already approved the summary. Please produce your final signoff briefing now. Respond with a JSON object of type "signoff".',
    role: "user",
  });
  return { done: false };
}

async function handleSummary(
  context: SessionContext,
  content: string,
  abortedReference: { value: boolean },
): Promise<TurnOutcome> {
  context.artifact = patchArtifact(context.artifact, {
    sessionState: "summaryPresented",
    summary: content,
    turnCount: context.artifact.turnCount + 1,
  });

  const userResponse = await context.readline.question(
    `\n${content}\n\nApprove and proceed to signoff? (yes/y/approve or continue): `,
  );

  if (abortedReference.value) {
    return { done: true, result: makeFailResult(context, "user_abandon") };
  }

  const normalized = toLower(trim(userResponse));
  if ("yes" === normalized || "y" === normalized || "approve" === normalized) {
    context.artifact = patchArtifact(context.artifact, {
      sessionState: "signingOff",
    });
    context.messages.push({
      content:
        'Approved. Please produce your final signoff briefing. Respond with a JSON object of type "signoff".',
      role: "user",
    });
  } else {
    context.artifact = patchArtifact(context.artifact, {
      sessionState: "questioning",
    });
    context.messages.push({ content: userResponse, role: "user" });
  }

  return { done: false };
}

function makeFailResult(context: SessionContext, error: string): SessionResult {
  const artifact = patchArtifact(context.artifact, {
    artifactState: computeArtifactState(context.artifact.questions.length),
    sessionState: "failed",
  });
  return {
    artifact,
    briefingPath: writePartialBriefing(
      context.writer,
      artifact,
      context.topic,
      context.dateString,
    ),
    error,
    success: false,
  };
}

// ── Core session loop ───────────────────────────────────────────

function parseMessage(raw: string): QuestionerMessage | undefined {
  try {
    const result = QuestionerMessageSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : undefined;
  } catch {
    return undefined;
  }
}

function patchArtifact(
  artifact: QuestionerArtifact,
  patch: Partial<QuestionerArtifact>,
): QuestionerArtifact {
  return { ...artifact, ...patch };
}

async function sessionLoop(
  context: SessionContext,
  abortedReference: { value: boolean },
): Promise<SessionResult> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    if (abortedReference.value) {
      return makeFailResult(context, "user_abandon");
    }

    if (
      "questioning" === context.artifact.sessionState &&
      context.artifact.turnCount >= context.config.maxTurns
    ) {
      return makeFailResult(context, "turn_cap_exceeded");
    }

    // eslint-disable-next-line no-await-in-loop
    const parsed = await callWithRetry(
      context.client,
      context.systemPrompt,
      context.messages,
      context.config,
    );

    if (parsed === undefined) {
      return makeFailResult(context, "retry_exhausted");
    }

    context.messages.push({
      content: JSON.stringify(parsed),
      role: "assistant",
    });

    // eslint-disable-next-line no-await-in-loop
    const outcome = await dispatchTurn(context, parsed, abortedReference);
    if (outcome.done) {
      return outcome.result;
    }
  }
}

function writePartialBriefing(
  writer: BriefingWriter,
  artifact: QuestionerArtifact,
  topic: string,
  dateString: string,
): null | string {
  if (0 === artifact.questions.length) {
    return null;
  }
  try {
    return writer.writeFile(artifact, topic, dateString);
  } catch {
    return null;
  }
}
