import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import {
  buildGetFileProblemsRequest,
  buildInitializedNotification,
  buildInitializeRequest,
  collectInspectionErrors,
  decodeContentItem,
  extractMessagePath,
  findResponse,
  formatInspectionsAsMarkdown,
  McpContentEnvelopeSchema,
  McpContentItemSchema,
  McpContentListSchema,
  McpGetFileProblemsParametersSchema,
  McpGetFileProblemsRequestSchema,
  McpInitializedNotificationSchema,
  McpInitializeRequestSchema,
  McpInspectionErrorSchema,
  McpInspectionErrorsSchema,
  McpJsonRpcBodySchema,
  McpResponseSchema,
  McpToolResultSchema,
  splitSseBuffer,
  tryParseResponse
} from "../src/domain/mcp-protocol.ts";

const decode = <Value, Encoded>(
  schema: Schema.Schema<Value, Encoded>,
  value: unknown
) => {
  return Schema.decodeUnknownSync(schema)(value);
};

const JSON_RPC_VERSION = "2.0";
const FILE_PATH = "src/file.ts";
const TEXT_TYPE = "text";
const TOOL_CALL_METHOD = "tools/call";

const inspection = {
  column: 2,
  description: "message",
  inspectionId: "inspection",
  line: 1,
  severity: "warning"
};
const content = [
  { text: JSON.stringify({ errors: [inspection] }), type: TEXT_TYPE }
];
const toolParameters = {
  errorsOnly: true,
  filePath: FILE_PATH,
  projectPath: "C:/repo",
  timeout: 15_000
};

describe("mCP protocol schemas", () => {
  it("decodes content and inspection schemas", () => {
    expect(decode(McpContentItemSchema, content[0])).toStrictEqual(content[0]);
    expect(decode(McpContentListSchema, content)).toStrictEqual(content);
    expect(decode(McpInspectionErrorSchema, inspection)).toStrictEqual(
      inspection
    );
    expect(decode(McpInspectionErrorsSchema, [inspection])).toStrictEqual([
      inspection
    ]);
    expect(
      decode(McpContentEnvelopeSchema, { errors: [inspection] })
    ).toStrictEqual({ errors: [inspection] });
  });

  it("decodes JSON-RPC result and tool parameter schemas", () => {
    const toolResult = { content };
    const response = { id: 7, result: toolResult };

    expect(decode(McpJsonRpcBodySchema, { arbitrary: [null] })).toStrictEqual({
      arbitrary: [null]
    });
    expect(decode(McpToolResultSchema, toolResult)).toStrictEqual(toolResult);
    expect(decode(McpResponseSchema, response)).toStrictEqual(response);
    expect(
      decode(McpGetFileProblemsParametersSchema, toolParameters)
    ).toStrictEqual(toolParameters);
  });

  it("decodes initialize and tool-call request schemas", () => {
    expect(
      decode(McpInitializeRequestSchema, buildInitializeRequest(1))
    ).toStrictEqual(buildInitializeRequest(1));
    expect(
      decode(McpInitializedNotificationSchema, buildInitializedNotification())
    ).toStrictEqual(buildInitializedNotification());
    expect(
      decode(McpGetFileProblemsRequestSchema, {
        id: 2,
        jsonrpc: JSON_RPC_VERSION,
        method: TOOL_CALL_METHOD,
        params: { arguments: toolParameters, name: "get_file_problems" }
      })
    ).toStrictEqual({
      id: 2,
      jsonrpc: JSON_RPC_VERSION,
      method: TOOL_CALL_METHOD,
      params: { arguments: toolParameters, name: "get_file_problems" }
    });
  });

  it.each([
    [McpContentItemSchema, { type: 1 }],
    [McpContentListSchema, { type: "text" }],
    [McpInspectionErrorSchema, { line: "one" }],
    [McpInspectionErrorsSchema, [{ column: "two" }]],
    [McpContentEnvelopeSchema, { errors: {} }],
    [McpToolResultSchema, { content: [{ type: 1 }] }],
    [McpResponseSchema, { id: "one" }],
    [McpInitializeRequestSchema, { jsonrpc: "1.0", method: "initialize" }],
    [
      McpInitializedNotificationSchema,
      { jsonrpc: JSON_RPC_VERSION, method: "wrong" }
    ],
    [McpGetFileProblemsParametersSchema, { errorsOnly: "yes" }],
    [McpGetFileProblemsRequestSchema, { method: TOOL_CALL_METHOD }]
  ])("rejects malformed schema input %#", (schema, value) => {
    expect(() => {
      Schema.decodeUnknownSync(schema as never)(value);
    }).toThrow(/.+/u);
  });
});

describe("mCP request builders", () => {
  it("builds each handshake request with supplied identifiers and parameters", () => {
    const parameters = {
      errorsOnly: false,
      filePath: FILE_PATH,
      projectPath: "C:/repo",
      timeout: 123
    };

    expect(buildInitializeRequest(8)).toStrictEqual({
      id: 8,
      jsonrpc: "2.0",
      method: "initialize",
      params: {
        capabilities: {},
        clientInfo: { name: "post-tool-inspect", version: "1.0.0" },
        protocolVersion: "2024-11-05"
      }
    });
    expect(buildInitializedNotification()).toStrictEqual({
      jsonrpc: "2.0",
      method: "notifications/initialized",
      params: {}
    });
    expect(buildGetFileProblemsRequest(9, parameters)).toStrictEqual({
      id: 9,
      jsonrpc: "2.0",
      method: "tools/call",
      params: { arguments: parameters, name: "get_file_problems" }
    });
  });
});

describe("mCP response and content decoding", () => {
  it("decodes text envelopes, filters non-text or missing text, and collects every error", () => {
    const firstError = { description: "first" };
    const secondError = { severity: "error" };

    expect(
      decodeContentItem({
        text: JSON.stringify({ errors: [firstError] }),
        type: "text"
      })
    ).toStrictEqual({ errors: [firstError] });
    expect(decodeContentItem({ text: "ignored", type: "image" })).toBeNull();
    expect(decodeContentItem({ type: "text" })).toBeNull();
    expect(
      collectInspectionErrors([
        { text: JSON.stringify({ errors: [firstError] }), type: "text" },
        { text: JSON.stringify({}), type: "text" },
        { text: JSON.stringify({ errors: [secondError] }), type: "text" },
        { type: "image" }
      ])
    ).toStrictEqual([firstError, secondError]);
  });

  it("throws for malformed or schema-invalid text envelopes", () => {
    for (const raw of [
      "not json",
      JSON.stringify({ errors: [{ line: "one" }] })
    ]) {
      expect(() => {
        decodeContentItem({ text: raw, type: "text" });
      }).toThrow(/mcp-protocol: content/u);
    }
  });

  it("parses valid JSON-RPC responses and returns null for malformed or invalid responses", () => {
    const response = {
      id: 3,
      result: { content: [{ text: "{}", type: "text" }] }
    };

    expect(tryParseResponse(JSON.stringify(response))).toStrictEqual(response);
    expect(tryParseResponse("not json")).toBeNull();
    expect(tryParseResponse(JSON.stringify({ id: "three" }))).toBeNull();
  });

  it("finds only matching response identifiers", () => {
    const responses = new Map([
      [4, { id: 4, value: "found" }],
      [5, { id: null, value: "also present" }]
    ]);

    expect(findResponse(responses, 4)).toStrictEqual({ id: 4, value: "found" });
    expect(findResponse(responses, 9)).toBeNull();
  });
});

describe("sSE framing", () => {
  it("retains incomplete content and parses data, event, unknown, and empty frames", () => {
    const first = splitSseBuffer(
      "",
      "data: one\ndata: two\nevent: update\nid: 1\n\n\n\npartial"
    );

    expect(first).toStrictEqual({
      frames: [{ data: "one\ntwo", event: "update" }],
      remaining: "partial"
    });
    expect(
      splitSseBuffer(first.remaining, " frame\r\nevent: done\r\n\r\n")
    ).toStrictEqual({
      frames: [{ data: "", event: "done" }],
      remaining: ""
    });
  });

  it("does not emit a frame until its delimiter arrives", () => {
    expect(splitSseBuffer("data: waiting", " for delimiter")).toStrictEqual({
      frames: [],
      remaining: "data: waiting for delimiter"
    });
  });
});

describe("mCP presentation helpers", () => {
  it("extracts only a complete slash-prefixed message path", () => {
    expect(extractMessagePath("/messages/abc")).toBe("/messages/abc");
    expect(extractMessagePath("/messages/a b")).toBeNull();
    expect(extractMessagePath("path /messages/abc")).toBeNull();
    expect(extractMessagePath("")).toBeNull();
  });

  it("formats empty, complete, and incomplete inspection errors", () => {
    expect(formatInspectionsAsMarkdown(FILE_PATH, [])).toBeNull();
    expect(
      formatInspectionsAsMarkdown(FILE_PATH, [
        {
          column: 4,
          description: "  Bad\n  formatting  ",
          inspectionId: "Style",
          line: 2,
          severity: "error"
        },
        {}
      ])
    ).toBe(
      `WebStorm MCP inspections for \`${FILE_PATH}\`:\n` +
        "- [ERROR] `Style` at L2:C4 — Bad formatting\n" +
        "- [WARNING] `WebStormInspection` at L?:C? — "
    );
  });
});
