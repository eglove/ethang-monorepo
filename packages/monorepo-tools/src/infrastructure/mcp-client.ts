/**
HTTP / SSE transport for the JetBrains / WebStorm MCP server.
*/

import { Effect, Schema } from "effect";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import { Buffer } from "node:buffer";
import http from "node:http";

import {
  buildGetFileProblemsRequest,
  buildInitializedNotification,
  buildInitializeRequest,
  collectInspectionErrors,
  extractMessagePath,
  type McpContentList,
  type McpInspectionErrors,
  McpJsonRpcBodySchema,
  type McpResponse,
  splitSseBuffer,
  tryParseResponse
} from "../domain/mcp-protocol.ts";

const MCP_DEFAULT_HOST = "127.0.0.1";
const MCP_DEFAULT_PORT = 64_506;
const MCP_DEFAULT_PATH = "/sse";
const DEFAULT_TOOL_TIMEOUT_MS = 15_000;
const DEFAULT_SSE_DEADLINE_MS = 1000;
const REQUEST_ID_INITIALIZE = 1;
const REQUEST_ID_TOOL_CALL = 2;

export type Deferred<T> = {
  promise: Promise<T>;
  reject: (reason?: unknown) => void;
  resolve: (value: T) => void;
};

export type LoadFileProblemsOptions = {
  readonly errorsOnly?: boolean;
  readonly filePath: string;
  readonly host?: string;
  readonly port?: number;
  readonly projectPath: string;
  readonly sseDeadlineMs?: number;
  readonly ssePath?: string;
  readonly toolTimeoutMs?: number;
};

export type LoadFileProblemsResult = {
  readonly errors: McpInspectionErrors;
  readonly messagePath: string;
};

export type SseConnection = {
  destroy: () => void;
  on: (event: "data", listener: (chunk: string) => void) => void;
  setEncoding: (encoding: BufferEncoding) => void;
};

export class McpConnectionError extends Error {
  public override readonly name = "McpConnectionError";
}

export const createDeferred = <T>() => {
  return Promise.withResolvers<T>();
};

export const openSse = (host: string, port: number, ssePath: string) => {
  return Effect.tryPromise({
    catch: (cause) => {
      return new McpConnectionError(
        `mcp-client: SSE connect ${host}:${port}${ssePath} failed: ${String(cause)}`
      );
    },
    try: async () => {
      return new Promise<SseConnection>((resolve, reject) => {
        const request = http.get(
          {
            headers: { Accept: "text/event-stream" },
            host,
            path: ssePath,
            port
          },
          (response) => {
            response.setEncoding("utf8");
            resolve(response);
          }
        );
        request.on("error", reject);
      });
    }
  });
};

const encodeJsonRpcBody = (body: unknown) => {
  return Schema.encodeUnknownSync(Schema.parseJson(McpJsonRpcBodySchema))(body);
};

export const destroyPendingRequest = (
  request: { destroy: () => void },
  isSettled: boolean
) => {
  if (!isSettled) {
    request.destroy();
  }
};

export const postJson = <T>(
  host: string,
  port: number,
  messagePath: string,
  body: T
) => {
  const json = encodeJsonRpcBody(body);
  let isSettled = false;

  const failOnce = (cause: unknown) => {
    return Effect.fail(
      new McpConnectionError(
        `mcp-client: POST ${host}:${port}${messagePath} failed: ${String(cause)}`
      )
    );
  };

  const finishOk = () => {
    return Effect.succeed(null);
  };

  return Effect.async<null, McpConnectionError>((resume) => {
    const request = http.request(
      {
        headers: {
          Connection: "close",
          "Content-Length": Buffer.byteLength(json),
          "Content-Type": "application/json"
        },
        host,
        method: "POST" as const,
        path: messagePath,
        port
      },
      (response) => {
        response.on("end", () => {
          if (isSettled) {
            return;
          }
          isSettled = true;
          resume(finishOk());
        });
        response.on("error", (cause) => {
          if (isSettled) {
            return;
          }
          isSettled = true;
          resume(failOnce(cause));
        });
        response.resume();
      }
    );
    const handleError = (cause: unknown) => {
      if (isSettled) {
        return;
      }
      isSettled = true;
      resume(failOnce(cause));
    };
    request.on("error", handleError);
    request.write(json);
    request.end();
    return Effect.sync(() => {
      destroyPendingRequest(request, isSettled);
    });
  });
};

export const tryStoreResponse = (
  frameData: string,
  responses: Map<number, McpResponse>
) => {
  const parsed = tryParseResponse(frameData);
  if (isNil(parsed) || isNil(parsed.id)) {
    return false;
  }
  responses.set(parsed.id, parsed);
  return true;
};

const processChunkForPath = (
  chunk: string,
  state: { buffer: string; pathDeferred: Deferred<string> }
) => {
  const { frames, remaining } = splitSseBuffer(state.buffer, chunk);
  state.buffer = remaining;
  for (const frame of frames) {
    const path = extractMessagePath(frame.data);
    if (isString(path)) {
      state.pathDeferred.resolve(path);
      return;
    }
  }
};

const processChunkForResponses = (
  chunk: string,
  state: { buffer: string; responses: Map<number, McpResponse> }
) => {
  const { frames, remaining } = splitSseBuffer(state.buffer, chunk);
  state.buffer = remaining;
  for (const frame of frames) {
    if (0 < frame.data.length) {
      tryStoreResponse(frame.data, state.responses);
    }
  }
};

export const attachFrameCollectors = (
  stream: SseConnection,
  responses: Map<number, McpResponse>,
  pathDeferred: Deferred<string>
) => {
  const pathState = { buffer: "", pathDeferred };
  const responseState = { buffer: "", responses };
  stream.on("data", (chunk) => {
    processChunkForPath(chunk, pathState);
    processChunkForResponses(chunk, responseState);
  });
};

const rejectOnTimeout = async (ms: number, message: string) => {
  return new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new McpConnectionError(message));
    }, ms);
  });
};

const waitForPathOrTimeout = async (
  sseDeadlineMs: number,
  deferred: Deferred<string>
) => {
  return Promise.race([
    deferred.promise,
    rejectOnTimeout(
      sseDeadlineMs,
      "mcp-client: SSE message path never received"
    )
  ]);
};

export const waitForMessagePath = (sseDeadlineMs: number) => {
  return (deferred: Deferred<string>) => {
    return Effect.fn("waitForMessagePath")(function* () {
      return yield* Effect.tryPromise({
        catch: (cause) => {
          return cause instanceof McpConnectionError
            ? cause
            : new McpConnectionError(
                `mcp-client: SSE message path never received: ${String(cause)}`
              );
        },
        try: async () => {
          return waitForPathOrTimeout(sseDeadlineMs, deferred);
        }
      });
    })();
  };
};

const pollForToolResponse = (
  responses: ReadonlyMap<number, McpResponse>
): Effect.Effect<void> => {
  if (responses.has(REQUEST_ID_TOOL_CALL)) {
    return Effect.void;
  }
  return Effect.sleep("10 millis").pipe(
    Effect.andThen(() => {
      return pollForToolResponse(responses);
    })
  );
};

export const waitForToolResponse = (
  sseDeadlineMs: number,
  responses: ReadonlyMap<number, McpResponse>
) => {
  return Effect.raceFirst(
    pollForToolResponse(responses),
    Effect.sleep(sseDeadlineMs)
  );
};

export const findContent = (responses: ReadonlyMap<number, McpResponse>) => {
  const matched = responses.get(REQUEST_ID_TOOL_CALL) ?? null;
  if (
    isNil(matched) ||
    isNil(matched.result) ||
    isNil(matched.result.content)
  ) {
    return [] as McpContentList;
  }
  return matched.result.content;
};

export const resolveLoadFileProblemsOptions = (
  options: LoadFileProblemsOptions
) => {
  return {
    host: options.host ?? MCP_DEFAULT_HOST,
    isErrorsOnly: options.errorsOnly ?? false,
    port: options.port ?? MCP_DEFAULT_PORT,
    sseDeadlineMs: options.sseDeadlineMs ?? DEFAULT_SSE_DEADLINE_MS,
    ssePath: options.ssePath ?? MCP_DEFAULT_PATH,
    toolTimeoutMs: options.toolTimeoutMs ?? DEFAULT_TOOL_TIMEOUT_MS
  };
};

export const loadFileProblems = (options: LoadFileProblemsOptions) => {
  const { host, isErrorsOnly, port, sseDeadlineMs, ssePath, toolTimeoutMs } =
    resolveLoadFileProblemsOptions(options);

  return Effect.scoped(
    Effect.gen(function* () {
      const stream = yield* Effect.acquireRelease(
        openSse(host, port, ssePath),
        (connection) => {
          return Effect.sync(() => {
            connection.destroy();
          });
        }
      );
      const responses = new Map<number, McpResponse>();
      const pathDeferred = createDeferred<string>();
      attachFrameCollectors(stream, responses, pathDeferred);
      const messagePath =
        yield* waitForMessagePath(sseDeadlineMs)(pathDeferred);
      yield* postJson(
        host,
        port,
        messagePath,
        buildInitializeRequest(REQUEST_ID_INITIALIZE)
      );
      yield* postJson(host, port, messagePath, buildInitializedNotification());
      yield* postJson(
        host,
        port,
        messagePath,
        buildGetFileProblemsRequest(REQUEST_ID_TOOL_CALL, {
          errorsOnly: isErrorsOnly,
          filePath: options.filePath,
          projectPath: options.projectPath,
          timeout: toolTimeoutMs
        })
      );
      yield* waitForToolResponse(sseDeadlineMs, responses);
      const content = findContent(responses);
      const errors = collectInspectionErrors(content);
      return {
        errors: [...errors],
        messagePath
      };
    })
  );
};
