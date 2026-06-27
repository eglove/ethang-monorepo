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
import trim from "lodash/trim.js";

import type { ChatState } from "./chat-types.ts";

import { PLAN_OUTPUT_PATH } from "../environment.ts";
import { createOpenRouterAdapter } from "../providers/openrouter.js";
import { logChatMessage } from "../utils/chat-logger.js";
import { isPlanComplete } from "../utils/is-plan-complete.js";
import { makeUIMessage } from "../utils/make-ui-message.js";
import { parsePlanSections } from "../utils/parse-plan-sections.js";
import { closeClients, processStream } from "../utils/process-stream.js";
import { writePlan } from "../utils/write-plan.js";
import {
  CONTINUE_NUDGE,
  GRILL_NUDGE,
  SYSTEM_PROMPT
} from "./chat-constants.ts";
import { getMCPClients } from "./mcp-clients.ts";

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
    if (this.state.isLoading) {
      return;
    }

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
    const stream = chat({
      adapter,
      agentLoopStrategy: maxIterations(50),
      ...(0 < mcpClients.length && {
        mcp: {
          clients: mcpClients,
          connection: "close" as const
        }
      }),
      messages: this.messagesReference,
      systemPrompts: [SYSTEM_PROMPT]
    });

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
