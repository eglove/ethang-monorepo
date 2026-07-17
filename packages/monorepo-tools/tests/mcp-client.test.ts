/**
Tests for the MCP HTTP / SSE transport (`mcp-client.ts`).
*/

import type { AddressInfo, Server, Socket } from "node:net";

import { Effect, Fiber } from "effect";
import isObject from "lodash/isObject.js";
import noop from "lodash/noop.js";
import { Buffer } from "node:buffer";
import http from "node:http";
import { PassThrough } from "node:stream";
import { describe, expect, it, vi } from "vitest";

import type { McpResponse } from "../src/domain/mcp-protocol.ts";

import {
  attachFrameCollectors,
  createDeferred,
  destroyPendingRequest,
  findContent,
  loadFileProblems,
  McpConnectionError,
  openSse,
  postJson,
  resolveLoadFileProblemsOptions,
  type SseConnection,
  tryStoreResponse,
  waitForMessagePath,
  waitForToolResponse
} from "../src/infrastructure/mcp-client.ts";

const REQUEST_ID_INITIALIZE = 1;
const REQUEST_ID_TOOL_CALL = 2;
const PROTOCOL_VERSION = "2024-11-05";
const REPO_PROJECT_PATH = "/repo";
const RELATIVE_FILE_PATH = "packages/foo/src/a.ts";
const UNREACHABLE_DEADLINE_MS = 50;
const SHORT_TOOL_RESPONSE_DEADLINE_MS = 500;
const SSE_CHUNK_PATH_ABC = "/messages/abc";
const TEST_SSE_DEADLINE_MS = 1000;

type MockPostRequest = {
  destroy: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
  write: ReturnType<typeof vi.fn>;
} & PassThrough;

type MockServer = {
  close: () => void;
  port: number;
  pushChunks: (chunks: readonly string[]) => void;
  requests: readonly RecordedRequest[];
};

type RecordedRequest = {
  body: string;
  method: string | undefined;
  path: string | undefined;
};

type SseResponder = { trigger: (chunk: string) => void };

const mockHttpPostRequest = (response?: PassThrough) => {
  const request = Object.assign(new PassThrough(), {
    destroy: vi.fn(),
    end: vi.fn(),
    write: vi.fn()
  }) as MockPostRequest;
  vi.spyOn(http, "request").mockImplementation(((
    _options: unknown,
    callback: unknown
  ) => {
    if (response) {
      queueMicrotask(() => {
        (callback as (incoming: PassThrough) => void)(response);
      });
    }
    return request;
  }) as never);
  return request;
};

const startMockServer = async (
  onRequest: (request: RecordedRequest) => void
) => {
  const requests: RecordedRequest[] = [];
  const sseResponders = new Set<SseResponder>();
  const sockets = new Set<Socket>();
  const pendingSseChunks: string[] = [];

  const server: Server = http.createServer((request, response) => {
    if ("/sse" === request.url) {
      response.writeHead(200, {
        Connection: "keep-alive",
        "Content-Type": "text/event-stream"
      });
      response.flushHeaders();
      const trigger = (chunk: string) => {
        response.write(chunk);
      };
      const responder: SseResponder = { trigger };
      sseResponders.add(responder);
      for (const queued of pendingSseChunks) {
        trigger(queued);
      }
      pendingSseChunks.length = 0;
      request.socket.on("close", () => {
        sseResponders.delete(responder);
      });
      return;
    }
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    request.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");
      const record: RecordedRequest = {
        body,
        method: request.method,
        path: request.url
      };
      requests.push(record);
      onRequest(record);
      response.writeHead(202);
      response.end();
    });
  });

  server.on("connection", (socket: Socket) => {
    sockets.add(socket);
    socket.on("close", () => {
      sockets.delete(socket);
    });
  });

  return new Promise<MockServer>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address() as AddressInfo;
      const close = () => {
        for (const socket of sockets) {
          socket.destroy();
        }
        server.close();
      };
      const flushQueuedChunks = () => {
        if (0 === sseResponders.size) {
          return;
        }
        const drain = [...pendingSseChunks];
        pendingSseChunks.length = 0;
        for (const responder of sseResponders) {
          for (const queued of drain) {
            responder.trigger(queued);
          }
        }
      };
      const pushChunks = (chunks: readonly string[]) => {
        for (const chunk of chunks) {
          pendingSseChunks.push(chunk);
        }
        // Defer the actual write to the next macrotask so the orchestrator's
        // `stream.on("data", ...)` listener is attached before any chunk
        // reaches the TCP socket. The SSE flush always runs AFTER both the
        // server-side writeHead and the client-side listener registration.
        setImmediate(flushQueuedChunks);
      };
      resolve({ close, port: address.port, pushChunks, requests });
    });
  });
};

const buildToolCallFrame = (errors: readonly unknown[]) => {
  return `data: ${JSON.stringify({
    id: REQUEST_ID_TOOL_CALL,
    jsonrpc: "2.0",
    result: {
      content: [{ text: JSON.stringify({ errors }), type: "text" }]
    }
  })}\n\n`;
};

const buildEndpointFrame = (path: string) => {
  return `data: ${path}\n\n`;
};

const buildInitializeResponseFrame = () => {
  return buildJsonDataFrame({
    id: REQUEST_ID_INITIALIZE,
    jsonrpc: "2.0",
    result: { capabilities: {} }
  });
};

const buildJsonDataFrame = (payload: unknown) => {
  return `data: ${JSON.stringify(payload)}\n\n`;
};

type LoadOptions = Parameters<typeof loadFileProblems>[0];

const buildLoadOptions = (
  overrides: Partial<LoadOptions> & Pick<LoadOptions, "host" | "port">
) => {
  return {
    errorsOnly: true,
    filePath: RELATIVE_FILE_PATH,
    projectPath: REPO_PROJECT_PATH,
    sseDeadlineMs: TEST_SSE_DEADLINE_MS,
    ...overrides
  };
};

const decodeRequestBody = (raw: string | undefined) => {
  return JSON.parse(raw ?? "{}") as Record<string, unknown>;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return isObject(value);
};

const getNestedField = (
  body: Record<string, unknown>,
  ...keys: readonly string[]
) => {
  let current: unknown = body;
  for (const key of keys) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
};

const releaseHandshake = (
  endpoint: MockServer,
  responseChunks: readonly string[]
) => {
  setImmediate(() => {
    endpoint.pushChunks(responseChunks);
  });
};

const EMPTY_TOOL_RESPONSE = buildJsonDataFrame({
  id: REQUEST_ID_TOOL_CALL,
  jsonrpc: "2.0",
  result: {}
});

const EMPTY_TOOL_RESPONSE_NO_RESULT = buildJsonDataFrame({
  id: REQUEST_ID_TOOL_CALL,
  jsonrpc: "2.0"
});

const registerAndTeardown = async <T>(
  endpoint: MockServer,
  body: (endpoint: MockServer) => Promise<T>
) => {
  try {
    return await body(endpoint);
  } finally {
    endpoint.close();
    await new Promise<void>((resolve) => {
      setImmediate(resolve);
    });
  }
};

const withMockServer = async <T>(
  body: (endpoint: MockServer) => Promise<T>
) => {
  const endpoint = await startMockServer(noop);
  return registerAndTeardown(endpoint, body);
};

describe("mCP client handshake", () => {
  it("drives the SSE handshake, posts initialize + initialized + tools/call, and surfaces parsed inspection errors", async () => {
    const errorEntry = {
      column: 3,
      description: "Suspicious usage",
      inspectionId: "Reek::UtilityFunction",
      line: 7,
      severity: "warning"
    };

    const result = await withMockServer(async (endpoint) => {
      releaseHandshake(endpoint, [
        buildEndpointFrame(SSE_CHUNK_PATH_ABC),
        buildInitializeResponseFrame(),
        buildToolCallFrame([errorEntry])
      ]);

      return Effect.runPromise(
        loadFileProblems(
          buildLoadOptions({ host: "127.0.0.1", port: endpoint.port })
        )
      );
    });

    expect(result.messagePath).toBe(SSE_CHUNK_PATH_ABC);
    expect(result.errors).toStrictEqual([errorEntry]);
  });

  it("posts an initialize request with the documented protocol version and client info", async () => {
    const endpoint = await startMockServer(noop);
    await registerAndTeardown(endpoint, async (server) => {
      releaseHandshake(server, [
        buildEndpointFrame(SSE_CHUNK_PATH_ABC),
        buildInitializeResponseFrame(),
        buildToolCallFrame([])
      ]);

      await Effect.runPromise(
        loadFileProblems(
          buildLoadOptions({ host: "127.0.0.1", port: server.port })
        )
      );

      const initBody = decodeRequestBody(server.requests[0]?.body);

      expect(getNestedField(initBody, "id")).toBe(REQUEST_ID_INITIALIZE);
      expect(getNestedField(initBody, "method")).toBe("initialize");
      expect(getNestedField(initBody, "jsonrpc")).toBe("2.0");
      expect(getNestedField(initBody, "params", "protocolVersion")).toBe(
        PROTOCOL_VERSION
      );
      expect(getNestedField(initBody, "params", "clientInfo", "name")).toBe(
        "post-tool-inspect"
      );
    });
  });

  it("posts a notifications/initialized frame without an id", async () => {
    const endpoint = await startMockServer(noop);
    await registerAndTeardown(endpoint, async (server) => {
      releaseHandshake(server, [
        buildEndpointFrame(SSE_CHUNK_PATH_ABC),
        buildInitializeResponseFrame(),
        buildToolCallFrame([])
      ]);

      await Effect.runPromise(
        loadFileProblems(
          buildLoadOptions({ host: "127.0.0.1", port: server.port })
        )
      );

      const notifBody = decodeRequestBody(server.requests[1]?.body);

      expect(getNestedField(notifBody, "method")).toBe(
        "notifications/initialized"
      );
      expect(getNestedField(notifBody, "id")).toBeUndefined();
    });
  });

  it("posts a tools/call request with get_file_problems arguments", async () => {
    const endpoint = await startMockServer(noop);
    await registerAndTeardown(endpoint, async (server) => {
      releaseHandshake(server, [
        buildEndpointFrame(SSE_CHUNK_PATH_ABC),
        buildInitializeResponseFrame(),
        buildToolCallFrame([])
      ]);

      await Effect.runPromise(
        loadFileProblems(
          buildLoadOptions({ host: "127.0.0.1", port: server.port })
        )
      );

      const toolBody = decodeRequestBody(server.requests[2]?.body);

      expect(getNestedField(toolBody, "id")).toBe(REQUEST_ID_TOOL_CALL);
      expect(getNestedField(toolBody, "method")).toBe("tools/call");
      expect(getNestedField(toolBody, "params")).toStrictEqual({
        arguments: {
          errorsOnly: true,
          filePath: RELATIVE_FILE_PATH,
          projectPath: REPO_PROJECT_PATH,
          timeout: 15_000
        },
        name: "get_file_problems"
      });
    });
  });
});

describe("mCP client responses", () => {
  it("forwards errorsOnly=false to the tools/call request", async () => {
    const endpoint = await startMockServer(noop);
    await registerAndTeardown(endpoint, async (server) => {
      releaseHandshake(server, [
        buildEndpointFrame("/messages/xyz"),
        buildInitializeResponseFrame(),
        buildToolCallFrame([])
      ]);

      await Effect.runPromise(
        loadFileProblems({
          ...buildLoadOptions({ host: "127.0.0.1", port: server.port }),
          errorsOnly: false
        })
      );

      const toolBody = decodeRequestBody(server.requests[2]?.body);

      expect(getNestedField(toolBody, "params", "arguments")).toMatchObject({
        errorsOnly: false,
        filePath: RELATIVE_FILE_PATH,
        projectPath: REPO_PROJECT_PATH
      });
    });
  });

  it("returns no errors when the tool response has result but no content field", async () => {
    const result = await withMockServer(async (endpoint) => {
      releaseHandshake(endpoint, [
        buildEndpointFrame(SSE_CHUNK_PATH_ABC),
        EMPTY_TOOL_RESPONSE
      ]);

      return Effect.runPromise(
        loadFileProblems({
          ...buildLoadOptions({ host: "127.0.0.1", port: endpoint.port }),
          sseDeadlineMs: SHORT_TOOL_RESPONSE_DEADLINE_MS
        })
      );
    });

    expect(result.errors).toStrictEqual([]);
    expect(result.messagePath).toBe(SSE_CHUNK_PATH_ABC);
  });

  it("returns no errors when the tool response omits the result field entirely", async () => {
    const result = await withMockServer(async (endpoint) => {
      releaseHandshake(endpoint, [
        buildEndpointFrame(SSE_CHUNK_PATH_ABC),
        EMPTY_TOOL_RESPONSE_NO_RESULT
      ]);

      return Effect.runPromise(
        loadFileProblems({
          ...buildLoadOptions({ host: "127.0.0.1", port: endpoint.port }),
          sseDeadlineMs: SHORT_TOOL_RESPONSE_DEADLINE_MS
        })
      );
    });

    expect(result.errors).toStrictEqual([]);
  });

  it("returns no errors when the tool response never arrives (deadline expires)", async () => {
    const result = await withMockServer(async (endpoint) => {
      releaseHandshake(endpoint, [buildEndpointFrame(SSE_CHUNK_PATH_ABC)]);

      return Effect.runPromise(
        loadFileProblems({
          ...buildLoadOptions({ host: "127.0.0.1", port: endpoint.port }),
          sseDeadlineMs: 100
        })
      );
    });

    expect(result.errors).toStrictEqual([]);
    expect(result.messagePath).toBe(SSE_CHUNK_PATH_ABC);
  });

  it("fails with McpConnectionError when the server never sends an endpoint (SSE deadline exceeded)", async () => {
    const endpoint = await startMockServer(noop);
    await registerAndTeardown(endpoint, async (server) => {
      const program = loadFileProblems({
        ...buildLoadOptions({ host: "127.0.0.1", port: server.port }),
        sseDeadlineMs: UNREACHABLE_DEADLINE_MS
      }).pipe(Effect.flip);

      const error = await Effect.runPromise(program);

      expect(error.name).toBe("McpConnectionError");
    });
  });

  it("fails with McpConnectionError when the SSE endpoint is unreachable", async () => {
    const endpoint = await startMockServer(noop);
    const deadPort = endpoint.port;
    endpoint.close();

    const program = loadFileProblems({
      ...buildLoadOptions({ host: "127.0.0.1", port: deadPort }),
      sseDeadlineMs: 100
    }).pipe(Effect.flip);

    const error = await Effect.runPromise(program);

    expect(error.name).toBe("McpConnectionError");
  });

  it("tolerates SSE frames that are not parseable as JSON-RPC responses (still surfaces parsed errors)", async () => {
    const result = await withMockServer(async (endpoint) => {
      releaseHandshake(endpoint, [
        buildEndpointFrame(SSE_CHUNK_PATH_ABC),
        "event: ping\ndata: keepalive\n\n",
        "data: this is not json\n\n",
        buildToolCallFrame([
          { description: "x", inspectionId: "I", severity: "warning" }
        ])
      ]);

      return Effect.runPromise(
        loadFileProblems({
          ...buildLoadOptions({ host: "127.0.0.1", port: endpoint.port }),
          sseDeadlineMs: SHORT_TOOL_RESPONSE_DEADLINE_MS
        })
      );
    });

    expect(result.errors).toStrictEqual([
      { description: "x", inspectionId: "I", severity: "warning" }
    ]);
  });
});

describe("mCP client transport primitives", () => {
  it.each([
    {
      expected: {
        host: "127.0.0.1",
        isErrorsOnly: false,
        port: 64_506,
        sseDeadlineMs: 1000,
        ssePath: "/sse",
        toolTimeoutMs: 15_000
      },
      input: { filePath: RELATIVE_FILE_PATH, projectPath: REPO_PROJECT_PATH }
    },
    {
      expected: {
        host: "localhost",
        isErrorsOnly: true,
        port: 1234,
        sseDeadlineMs: 10,
        ssePath: "/custom",
        toolTimeoutMs: 20
      },
      input: {
        errorsOnly: true,
        filePath: RELATIVE_FILE_PATH,
        host: "localhost",
        port: 1234,
        projectPath: REPO_PROJECT_PATH,
        sseDeadlineMs: 10,
        ssePath: "/custom",
        toolTimeoutMs: 20
      }
    }
  ])("resolves explicit and default load options", ({ expected, input }) => {
    expect(resolveLoadFileProblemsOptions(input)).toStrictEqual(expected);
  });

  it("opens an SSE stream and releases it", async () => {
    const endpoint = await startMockServer(noop);
    await registerAndTeardown(endpoint, async (server) => {
      const stream = await Effect.runPromise(
        openSse("127.0.0.1", server.port, "/sse")
      );
      stream.destroy();

      expect(stream).toBeDefined();
    });
  });

  it("posts JSON and waits for the response end", async () => {
    const endpoint = await startMockServer(noop);
    await registerAndTeardown(endpoint, async (server) => {
      await Effect.runPromise(
        postJson("127.0.0.1", server.port, "/messages/test", {
          jsonrpc: "2.0",
          method: "notifications/initialized"
        })
      );

      expect(server.requests).toHaveLength(1);
    });
  });

  it("maps POST request and response errors to McpConnectionError", async () => {
    const response = Object.assign(new PassThrough(), { resume: vi.fn() });
    const responseRequest = mockHttpPostRequest(response);
    setImmediate(() => {
      response.emit("error", new Error("response failure"));
      response.emit("end");
    });
    const responseError = await Effect.runPromise(
      postJson("host", 1, "/post", {}).pipe(Effect.flip)
    );
    vi.restoreAllMocks();

    const request = mockHttpPostRequest();
    setImmediate(() => {
      request.emit("error", new Error("request failure"));
    });
    const requestError = await Effect.runPromise(
      postJson("host", 1, "/post", {}).pipe(Effect.flip)
    );
    vi.restoreAllMocks();

    expect(responseError).toBeInstanceOf(McpConnectionError);
    expect(requestError).toBeInstanceOf(McpConnectionError);
    expect(response.resume).toHaveBeenCalledExactlyOnceWith();
    expect(responseRequest.write).toHaveBeenCalledExactlyOnceWith("{}");
  });

  it("ignores duplicate POST terminal events after success", async () => {
    const response = Object.assign(new PassThrough(), { resume: vi.fn() });
    const request = mockHttpPostRequest(response);
    setImmediate(() => {
      response.emit("end");
      response.emit("error", new Error("late response error"));
      request.emit("error", new Error("late request error"));
    });

    await Effect.runPromise(postJson("host", 1, "/post", {}));
    vi.restoreAllMocks();

    expect(response.resume).toHaveBeenCalledExactlyOnceWith();
  });

  it("destroys an unfinished POST when its Effect is interrupted", async () => {
    const request = mockHttpPostRequest();
    await Effect.runPromise(
      Effect.gen(function* () {
        const fiber = yield* Effect.fork(postJson("host", 1, "/post", {}));
        yield* Effect.sleep("1 millis");
        yield* Fiber.interrupt(fiber);
      })
    );
    vi.restoreAllMocks();

    expect(request.destroy).toHaveBeenCalledExactlyOnceWith();
  });

  it.each([
    [false, 1],
    [true, 0]
  ])("destroys pending requests only when settled=%s", (isSettled, calls) => {
    const request = { destroy: vi.fn() };

    destroyPendingRequest(request, isSettled);

    expect(request.destroy).toHaveBeenCalledTimes(calls);
  });

  it("maps unreachable SSE connections to McpConnectionError", async () => {
    const endpoint = await startMockServer(noop);
    const deadPort = endpoint.port;
    endpoint.close();

    const error = await Effect.runPromise(
      openSse("127.0.0.1", deadPort, "/sse").pipe(Effect.flip)
    );

    expect(error).toBeInstanceOf(McpConnectionError);
  });
});

describe("mCP client response collectors", () => {
  it("collects split paths and response frames while ignoring malformed and empty data", async () => {
    let dataListener: ((chunk: string) => void) | undefined;
    const connection: SseConnection = {
      destroy: vi.fn(),
      on: (_event, listener) => {
        dataListener = listener;
      },
      setEncoding: vi.fn()
    };
    const responses = new Map<number, McpResponse>();
    const path = createDeferred<string>();
    attachFrameCollectors(connection, responses, path);

    dataListener?.("data: /messages/split\n\ndata: ");
    dataListener?.(
      'not json\n\ndata: \n\ndata: {"id":2,"jsonrpc":"2.0","result":{}}\n\n'
    );

    await expect(path.promise).resolves.toBe("/messages/split");
    expect(responses.has(REQUEST_ID_TOOL_CALL)).toBe(true);
  });

  it.each([
    ["stores a valid response", '{"id":2,"jsonrpc":"2.0"}', true],
    ["rejects malformed JSON", "not JSON", false],
    ["rejects response without an id", '{"jsonrpc":"2.0"}', false]
  ])("%s", (_name, data, expected) => {
    const responses = new Map<number, McpResponse>();

    expect(tryStoreResponse(data, responses)).toBe(expected);
    expect(responses.has(REQUEST_ID_TOOL_CALL)).toBe(expected);
  });

  it.each([
    ["no tool response", new Map<number, McpResponse>(), []],
    [
      "null result",
      new Map<number, McpResponse>([
        [2, { result: null } as unknown as McpResponse]
      ]),
      []
    ],
    [
      "null content",
      new Map<number, McpResponse>([
        [2, { result: { content: null } } as unknown as McpResponse]
      ]),
      []
    ],
    [
      "tool content",
      new Map<number, McpResponse>([
        [
          2,
          {
            id: 2,
            result: { content: [{ text: "{}", type: "text" }] }
          }
        ]
      ]),
      [{ text: "{}", type: "text" }]
    ]
  ])("returns %s", (_name, responses, expected) => {
    expect(findContent(responses)).toStrictEqual(expected);
  });

  it("preserves MCP failures and wraps other deferred rejections", async () => {
    const original = new McpConnectionError("timeout");
    const preserved = {
      ...createDeferred<string>(),
      promise: Promise.reject(original)
    };
    const wrapped = {
      ...createDeferred<string>(),
      promise: Promise.reject(new Error("boom"))
    };

    const preservedError = await Effect.runPromise(
      waitForMessagePath(1000)(preserved).pipe(Effect.flip)
    );
    const wrappedError = await Effect.runPromise(
      waitForMessagePath(1000)(wrapped).pipe(Effect.flip)
    );

    expect(preservedError).toMatchObject({ message: original.message });
    expect(wrappedError.message).toContain("boom");
  });

  it("waits for present responses and returns after the response deadline", async () => {
    await Effect.runPromise(
      waitForToolResponse(1, new Map([[2, { id: 2, jsonrpc: "2.0" }]]))
    );

    await expect(
      Effect.runPromise(waitForToolResponse(1, new Map<number, McpResponse>()))
    ).resolves.toBeUndefined();
  });
});
