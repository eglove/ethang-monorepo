/**
Pure JSON-RPC / MCP protocol schemas.
*/

import { Effect, Either, Schema } from "effect";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import split from "lodash/split.js";
import trim from "lodash/trim.js";

export const McpContentItemSchema = Schema.Struct({
  text: Schema.optional(Schema.String),
  type: Schema.String
});

export const McpContentListSchema = Schema.Array(McpContentItemSchema);

export const McpJsonRpcBodySchema = Schema.Unknown;

export const McpInspectionErrorSchema = Schema.Struct({
  column: Schema.optional(Schema.Number),
  description: Schema.optional(Schema.String),
  inspectionId: Schema.optional(Schema.String),
  line: Schema.optional(Schema.Number),
  severity: Schema.optional(Schema.String)
});

export const McpInspectionErrorsSchema = Schema.Array(McpInspectionErrorSchema);

export const McpContentEnvelopeSchema = Schema.Struct({
  errors: Schema.optional(McpInspectionErrorsSchema)
});

export type McpContentItem = McpContentList[number];

export type McpContentList = Schema.Schema.Type<typeof McpContentListSchema>;

export type McpInspectionErrors = Schema.Schema.Type<
  typeof McpInspectionErrorsSchema
>;

export const McpToolResultSchema = Schema.Struct({
  content: Schema.optional(McpContentListSchema)
});

export type McpToolResult = Schema.Schema.Type<typeof McpToolResultSchema>;

export const McpResponseSchema = Schema.Struct({
  id: Schema.optional(Schema.Number),
  result: Schema.optional(McpToolResultSchema)
});

export type McpResponse = Schema.Schema.Type<typeof McpResponseSchema>;

export const McpInitializeRequestSchema = Schema.Struct({
  id: Schema.Number,
  jsonrpc: Schema.Literal("2.0"),
  method: Schema.Literal("initialize"),
  params: Schema.Struct({
    capabilities: Schema.Unknown,
    clientInfo: Schema.Struct({
      name: Schema.String,
      version: Schema.String
    }),
    protocolVersion: Schema.String
  })
});

export type McpInitializeRequest = Schema.Schema.Type<
  typeof McpInitializeRequestSchema
>;

export const McpInitializedNotificationSchema = Schema.Struct({
  jsonrpc: Schema.Literal("2.0"),
  method: Schema.Literal("notifications/initialized"),
  params: Schema.Unknown
});

export type McpInitializedNotification = Schema.Schema.Type<
  typeof McpInitializedNotificationSchema
>;

export const McpGetFileProblemsParametersSchema = Schema.Struct({
  errorsOnly: Schema.Boolean,
  filePath: Schema.String,
  projectPath: Schema.String,
  timeout: Schema.Number
});

export type McpGetFileProblemsParameters = Schema.Schema.Type<
  typeof McpGetFileProblemsParametersSchema
>;

export const McpGetFileProblemsRequestSchema = Schema.Struct({
  id: Schema.Number,
  jsonrpc: Schema.Literal("2.0"),
  method: Schema.Literal("tools/call"),
  params: Schema.Struct({
    arguments: McpGetFileProblemsParametersSchema,
    name: Schema.Literal("get_file_problems")
  })
});

export type McpGetFileProblemsRequest = Schema.Schema.Type<
  typeof McpGetFileProblemsRequestSchema
>;

const MCP_PROTOCOL_VERSION = "2024-11-05";
const MCP_CLIENT_NAME = "post-tool-inspect";
const MCP_CLIENT_VERSION = "1.0.0";

export const buildInitializeRequest = (id: number) => {
  return {
    id,
    jsonrpc: "2.0",
    method: "initialize",
    params: {
      capabilities: {},
      clientInfo: { name: MCP_CLIENT_NAME, version: MCP_CLIENT_VERSION },
      protocolVersion: MCP_PROTOCOL_VERSION
    }
  };
};

export const buildInitializedNotification = () => {
  return {
    jsonrpc: "2.0",
    method: "notifications/initialized",
    params: {}
  };
};

export const buildGetFileProblemsRequest = (
  id: number,
  parameters: McpGetFileProblemsParameters
) => {
  return {
    id,
    jsonrpc: "2.0",
    method: "tools/call",
    params: { arguments: parameters, name: "get_file_problems" }
  };
};

const parseEnvelope = (raw: string) => {
  return Effect.runSync(
    Schema.decodeUnknown(Schema.parseJson(McpContentEnvelopeSchema))(raw).pipe(
      Effect.mapError((error) => {
        return new Error(`mcp-protocol: content: ${String(error)}`);
      })
    )
  );
};

export const decodeContentItem = (item: McpContentItem) => {
  if ("text" !== item.type) {
    return null;
  }
  if (!isString(item.text)) {
    return null;
  }
  return parseEnvelope(item.text);
};

export const collectInspectionErrors = (content: McpContentList) => {
  let errors: McpInspectionErrors = [];
  for (const item of content) {
    const envelope = decodeContentItem(item);
    if (!isNil(envelope) && envelope.errors) {
      errors = [...errors, ...envelope.errors];
    }
  }
  return errors;
};

export const findResponse = <T extends { id?: null | number }>(
  responses: ReadonlyMap<number, T>,
  id: number
) => {
  return responses.get(id) ?? null;
};

const ResponseJsonSchema = Schema.parseJson(McpResponseSchema);

const ResponseDecoder = Schema.decodeUnknownEither(ResponseJsonSchema);

const decodeResponse = (raw: string) => {
  return ResponseDecoder(raw) as Either.Either<McpResponse, unknown>;
};

const getOrNull = (either: Either.Either<McpResponse, unknown>) => {
  return Either.isRight(either) ? either.right : null;
};

const decodeToOption = (raw: string) => {
  return getOrNull(decodeResponse(raw));
};

export const tryParseResponse = (raw: string) => {
  return decodeToOption(raw);
};

export type SseFrame = { data: string; event: null | string };

const FRAME_DELIMITER = /\r?\n\r?\n/u;
const DATA_PREFIX = "data:";
const EVENT_PREFIX = "event:";

const parseFrame = (frame: string) => {
  let dataLines: string[] = [];
  let event: null | string = null;
  for (const line of split(frame, /\r?\n/u)) {
    if (line.startsWith(DATA_PREFIX)) {
      dataLines = [...dataLines, trim(line.slice(DATA_PREFIX.length))];
    } else if (line.startsWith(EVENT_PREFIX)) {
      event = trim(line.slice(EVENT_PREFIX.length));
    } else {
      // unknown field (id:, retry:, etc.) — ignored
    }
  }
  const data = dataLines.join("\n");
  if (isEmpty(dataLines) && isNil(event)) {
    return null;
  }
  return { data, event };
};

export const splitSseBuffer = (buffer: string, chunk: string) => {
  const combined = `${buffer}${chunk}`;
  const parts = split(combined, FRAME_DELIMITER);
  const remaining = String(parts.pop());
  let frames: SseFrame[] = [];
  for (const part of parts) {
    const parsed = parseFrame(part);
    if (!isNil(parsed)) {
      frames = [...frames, parsed];
    }
  }
  return { frames, remaining };
};

export const extractMessagePath = (text: string) => {
  const match = /^(\/\S+)$/u.exec(text);
  if (match) {
    return match[1];
  }
  return null;
};

const SAFE_FALLBACK_INSPECTION = "WebStormInspection";
const SAFE_FALLBACK_SEVERITY = "WARNING";

const upperSeverity = (value: string) => {
  return value.toUpperCase();
};

const formatErrorLine = (error: McpInspectionErrors[number]) => {
  const severity = isString(error.severity)
    ? upperSeverity(error.severity)
    : SAFE_FALLBACK_SEVERITY;
  const inspectionId = isString(error.inspectionId)
    ? error.inspectionId
    : SAFE_FALLBACK_INSPECTION;
  const loc = `L${error.line ?? "?"}:C${error.column ?? "?"}`;
  const desc = isString(error.description)
    ? trim(error.description.replaceAll(/\s+/gu, " "))
    : "";
  return `- [${severity}] \`${inspectionId}\` at ${loc} — ${desc}`;
};

export const formatInspectionsAsMarkdown = (
  relativeFilePath: string,
  errors: McpInspectionErrors
) => {
  if (isEmpty(errors)) {
    return null;
  }
  const lines = [`WebStorm MCP inspections for \`${relativeFilePath}\`:`];
  for (const error of errors) {
    lines.push(formatErrorLine(error));
  }
  return lines.join("\n");
};
