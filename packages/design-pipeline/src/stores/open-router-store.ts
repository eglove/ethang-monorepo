/* eslint-disable max-classes-per-file */
import { BaseStore } from "@ethang/store";

import type {
  LlmChatParameters,
  LlmProvider,
  LlmStreamChunk,
} from "../util/interfaces.ts";

import { LlmState } from "../util/enums.ts";
import { ErrorKind, ok, type Result, resultError } from "../util/result.ts";

export type OpenRouterState = {
  currentModel: string;
  llmState: LlmState;
  timeoutMs: number;
};

type ModelConfig = Record<string, string>;

const DEFAULT_MODEL = "anthropic/claude-sonnet-4-20250514";
const DEFAULT_TIMEOUT_MS = 120_000;

const DEFAULT_MODEL_CONFIG: ModelConfig = {
  "debate-moderator": DEFAULT_MODEL,
  "expert-review": DEFAULT_MODEL,
  "implementation-planning": DEFAULT_MODEL,
  questioner: DEFAULT_MODEL,
};

export type TestOpenRouterStore = {
  simulateError: (errorMessage: string) => void;
  simulateStream: (tokens: readonly string[]) => void;
  store: OpenRouterStore;
};

export class OpenRouterStore
  extends BaseStore<OpenRouterState>
  implements LlmProvider
{
  private readonly _modelConfig: ModelConfig;

  public constructor(
    modelConfig: ModelConfig = DEFAULT_MODEL_CONFIG,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  ) {
    super({
      currentModel: "",
      llmState: LlmState.Idle,
      timeoutMs,
    });
    this._modelConfig = modelConfig;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async chat(
    parameters: LlmChatParameters,
  ): Promise<Result<AsyncIterable<LlmStreamChunk>>> {
    // In production, this wraps @openrouter/sdk
    // For now, return a not-implemented error to be overridden in tests
    return resultError(
      ErrorKind.NotImplemented,
      `Chat not implemented for model ${parameters.model}`,
    );
  }

  public getModel(stageName: string): string {
    return this._modelConfig[stageName] ?? DEFAULT_MODEL;
  }
}

// cspell:ignore openrouter
// eslint-disable-next-line @typescript-eslint/require-await
async function* mockStream(tokens: readonly string[]) {
  for (const token of tokens) {
    yield { content: token, done: false };
  }

  yield { content: "", done: true };
}

export const createTestOpenRouterStore = (
  modelConfig?: ModelConfig,
): TestOpenRouterStore => {
  let streamTokens: readonly string[] = ["hello"];
  let errorMessage: string | undefined;

  const store = new (class extends OpenRouterStore {
    // eslint-disable-next-line @typescript-eslint/require-await
    public override async chat(
      _parameters: LlmChatParameters,
    ): Promise<Result<AsyncIterable<LlmStreamChunk>>> {
      if (undefined !== errorMessage) {
        return resultError(ErrorKind.LlmError, errorMessage);
      }

      return ok(mockStream(streamTokens));
    }
  })(modelConfig);

  return {
    simulateError: (message: string) => {
      errorMessage = message;
    },
    simulateStream: (tokens: readonly string[]) => {
      errorMessage = undefined;
      streamTokens = tokens;
    },
    store,
  };
};
