import { BaseStore } from "@ethang/store";
import {
  chat,
  maxIterations,
  type MCPToolSource,
  type UIMessage
} from "@tanstack/ai";
import { Effect } from "effect";
import endsWith from "lodash/endsWith.js";
import filter from "lodash/filter.js";
import isError from "lodash/isError.js";
import map from "lodash/map.js";
import trim from "lodash/trim.js";

import { PLAN_OUTPUT_PATH } from "../environment.ts";
import { codebaseMemoryMcp } from "../mcp/codebase-memory.ts";
import { webstormMcp } from "../mcp/webstorm.ts";
import { createOpenRouterAdapter } from "../providers/openrouter.js";
import { architectureTool } from "../tools/get-architecture.js";
import { codeSnippetTool } from "../tools/get-code-snippet.js";
import { searchGraphTool } from "../tools/search-graph.js";
import { tracePathTool } from "../tools/trace-path.js";
import { webstormReadFileTool } from "../tools/webstorm-read-file.js";
import { logChatMessage } from "../utils/chat-logger.js";
import { isPlanComplete } from "../utils/is-plan-complete.js";
import { makeUIMessage } from "../utils/make-ui-message.js";
import { parsePlanSections } from "../utils/parse-plan-sections.js";
import { closeClients, processStream } from "../utils/process-stream.js";
import { writePlan } from "../utils/write-plan.js";

export type ChatMessage =
  | {
      content: string;
      role: "assistant" | "user";
      type: "message";
    }
  | {
      content: string;
      type: "system";
    }
  | {
      input: Record<string, unknown>;
      name: string;
      output: string;
      type: "tool_call";
    };

export type ChatState = {
  isLoading: boolean;
  messages: ChatMessage[];
};

const SYSTEM_PROMPT = `You are a planning assistant that helps developers create implementation plans.
You have access to tools that let you explore the codebase using MCP servers (search_graph, trace_path, get_architecture, get_code_snippet, webstorm_read_file).

MANDATORY: Before asking the user anything, use these tools to answer whatever you can for yourself.
- Look up existing code, routes, data flow, and architecture relevant to the request.
- Read source files to understand current behavior before asking about it.
- Only ask the user a question when the answer genuinely cannot be discovered from the codebase (product intent, deployment targets, business rules, timeline, etc.).

When you do ask, grill the user with follow-up questions to produce a thorough, well-thought-out plan.
Ask about requirements, constraints, edge cases, and alternatives.`;

const GRILL_NUDGE = `The user has described what they want to build.

Interview them relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Before asking anything, use your tools to explore the codebase and answer for yourself whatever you can: existing code, routes, data flow, architecture, and current behavior. Read relevant source files before asking about them. If a question can be answered by exploring the codebase, explore the codebase instead.

Ask the questions one at a time, waiting for feedback on each question before continuing. Asking multiple questions at once is bewildering.

Only ask about something you could NOT determine from the codebase (product intent, deployment targets, business rules, timeline, etc.).

Do NOT output a plan yet. Keep probing one question at a time until you have enough understanding to propose the plan. When you are ready, ask the user for approval before synthesizing the plan.`;

const CONTINUE_NUDGE = `You finished your response but did not end with a focused follow-up question for the user. Ask exactly ONE follow-up question now — only about something you could NOT determine from the codebase. If you have enough understanding to propose the plan, ask the user for approval before synthesizing it.`;

const BUILTIN_TOOLS = [
  searchGraphTool,
  tracePathTool,
  architectureTool,
  codeSnippetTool,
  webstormReadFileTool
];

class ChatStore extends BaseStore<ChatState> {
  public exitCallback: (() => void) | undefined;
  public readonly messagesReference: UIMessage[] = [];

  public constructor(state: ChatState) {
    super(state);
  }

  public resetToWelcome(): void {
    this.messagesReference.length = 0;
    super.update((draft) => {
      draft.isLoading = false;
      draft.messages = [
        {
          content:
            "Welcome to the AI planning harness. What would you like to build?",
          role: "assistant",
          type: "message"
        }
      ];
    });
  }

  public readonly sendMessage = async (text: string): Promise<void> => {
    this.messagesReference.push(makeUIMessage("user", text));
    await logChatMessage(`user: ${text}`);
    const isFirstUserMessage =
      0 ===
      filter(this.state.messages, (m) => {
        return "message" === m.type && "user" === m.role;
      }).length;

    this.update((draft) => {
      draft.isLoading = true;
      draft.messages.push({ content: text, role: "user", type: "message" });
    });

    if (isFirstUserMessage) {
      this.messagesReference.push(makeUIMessage("user", GRILL_NUDGE));
      this.update((draft) => {
        draft.messages.push({
          content: GRILL_NUDGE,
          role: "user",
          type: "message"
        });
      });
    }

    const program = this.runChatSession();
    await Effect.runPromise(program);
  };

  public override update(updater: (draft: ChatState) => void) {
    super.update(updater);
  }

  private async runChat(
    adapter: ReturnType<typeof createOpenRouterAdapter>,
    mcpClients: MCPToolSource[]
  ): Promise<string> {
    let stream;

    if (0 < mcpClients.length) {
      const mcpToolsResults = await Promise.all(
        map(mcpClients, async (client) => {
          return client.tools({ lazy: true });
        })
      );
      const mcpTools = mcpToolsResults.flat();

      stream = chat({
        adapter,
        agentLoopStrategy: maxIterations(50),
        mcp: {
          clients: mcpClients,
          connection: "close" as const
        },
        messages: this.messagesReference,
        systemPrompts: [SYSTEM_PROMPT],
        tools: [...BUILTIN_TOOLS, ...mcpTools]
      });
    } else {
      stream = chat({
        adapter,
        agentLoopStrategy: maxIterations(50),
        messages: this.messagesReference,
        systemPrompts: [SYSTEM_PROMPT],
        tools: BUILTIN_TOOLS
      });
    }

    return processStream(stream);
  }

  private runChatSession() {
    const run = async (): Promise<void> => {
      const adapter = createOpenRouterAdapter();
      const mcpClients = await getMCPClients();

      let assistantContent = await this.runChat(adapter, mcpClients);

      let continueRetries = 0;
      while (
        assistantContent &&
        !isPlanComplete(assistantContent) &&
        3 > continueRetries
      ) {
        const trimmed = trim(assistantContent);
        if (endsWith(trimmed, "?")) {
          break;
        }
        continueRetries += 1;
        this.messagesReference.push(makeUIMessage("user", CONTINUE_NUDGE));
        this.update((draft) => {
          draft.messages.push({
            content: CONTINUE_NUDGE,
            role: "user",
            type: "message"
          });
        });
        // eslint-disable-next-line no-await-in-loop
        assistantContent = await this.runChat(adapter, mcpClients);
      }

      if (assistantContent && isPlanComplete(assistantContent)) {
        const sections = parsePlanSections(assistantContent);
        const { jsonPath, markdownPath } = await writePlan(
          sections,
          PLAN_OUTPUT_PATH
        );
        this.update((draft) => {
          draft.messages.push({
            content: `Plan written to ${markdownPath} and ${jsonPath}`,
            type: "system"
          });
        });
        await logChatMessage(
          `system: Plan written to ${markdownPath} and ${jsonPath}`
        );
      }

      await closeClients(mcpClients);
    };

    return Effect.tryPromise(run).pipe(
      Effect.catchAll((error) => {
        const errorMessage = isError(error) ? error.message : String(error);
        logChatMessage(`system: Error: ${errorMessage}`).catch(
          globalThis.console.error
        );
        return Effect.sync(() => {
          this.update((draft) => {
            draft.isLoading = false;
            draft.messages.push({
              content: `Error: ${errorMessage}`,
              type: "system"
            });
          });
        });
      }),
      Effect.ensuring(
        Effect.sync(() => {
          this.update((draft) => {
            draft.isLoading = false;
          });
        })
      )
    );
  }
}

async function getMCPClients(): Promise<MCPToolSource[]> {
  const cmClient = await codebaseMemoryMcp();
  const wsClient = await webstormMcp();

  const clients: MCPToolSource[] = [];
  if (null !== cmClient) {
    clients.push(cmClient);
  }
  if (null !== wsClient) {
    clients.push(wsClient);
  }

  return clients;
}

export const chatStore = new ChatStore({
  isLoading: false,
  messages: [
    {
      content:
        "Welcome to the AI planning harness. What would you like to build?",
      role: "assistant",
      type: "message"
    }
  ]
});
