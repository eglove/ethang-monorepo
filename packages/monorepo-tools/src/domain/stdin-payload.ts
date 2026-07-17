import { Effect, Schema } from "effect";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";

const PostToolUsePayloadSchema = Schema.Struct({
  cwd: Schema.optional(Schema.String),
  toolArgs: Schema.optional(Schema.Union(Schema.String, Schema.Unknown)),
  toolName: Schema.String
});

const NestedArgumentsSchema = Schema.Struct({
  file_path: Schema.optional(Schema.String)
});

const ToolArgumentsSchema = Schema.Struct({
  args: Schema.optional(NestedArgumentsSchema),
  file_path: Schema.optional(Schema.String),
  filePath: Schema.optional(Schema.String),
  path: Schema.optional(Schema.String)
});

const SUPPORTED_TOOL_NAMES = ["edit", "create"] as const;

export type PostToolUseFile = {
  readonly absFilePath: string;
  readonly relFilePath: string;
  readonly repoRoot: string;
};

const stripTrailingSlashes = (value: string) => {
  let result = value;
  while (result.endsWith("/")) {
    result = result.slice(0, -1);
  }
  return result;
};

const normalizeSlashes = (value: string) => {
  let result = "";
  for (const ch of value) {
    result += "\\" === ch ? "/" : ch;
  }
  return result;
};

const parseToolArguments = (raw: unknown) => {
  return Effect.runSync(
    Schema.decodeUnknown(ToolArgumentsSchema)(raw).pipe(
      Effect.mapError((error) => {
        return new Error(`stdin-payload: toolArgs: ${String(error)}`);
      })
    )
  );
};

const parseToolArgumentsFromString = (raw: string) => {
  return Effect.runSync(
    Schema.decodeUnknown(Schema.parseJson(ToolArgumentsSchema))(raw).pipe(
      Effect.mapError((error) => {
        return new Error(`stdin-payload: toolArgs JSON: ${String(error)}`);
      })
    )
  );
};

const decodeToolArguments = (raw: unknown) => {
  if (isNil(raw)) {
    return null;
  }
  if (isString(raw)) {
    return parseToolArgumentsFromString(raw);
  }
  return parseToolArguments(raw);
};

const extractFilePathFromArguments = (argumentsValue: unknown) => {
  const decoded = parseToolArguments(argumentsValue);
  const candidates: readonly (null | string)[] = [
    decoded.file_path ?? null,
    decoded.filePath ?? null,
    decoded.path ?? null,
    decoded.args?.file_path ?? null
  ];
  for (const candidate of candidates) {
    if (isString(candidate) && 0 < candidate.length) {
      return candidate;
    }
  }
  return null;
};

const extractArgumentPath = (decoded: null | object) => {
  if (isNil(decoded)) {
    return null;
  }
  return extractFilePathFromArguments(decoded);
};

const isSupportedToolName = (value: string) => {
  return (SUPPORTED_TOOL_NAMES as readonly string[]).includes(value);
};

const computeRelativePath = (filePath: string, repoRoot: string) => {
  const normalizedRoot = stripTrailingSlashes(repoRoot);
  if (filePath.startsWith(`${normalizedRoot}/`)) {
    return filePath.slice(normalizedRoot.length + 1);
  }
  return filePath;
};

const resolveAbsolutePath = (filePath: string, repoRoot: string) => {
  const normalizedRoot = stripTrailingSlashes(repoRoot);
  if (filePath.startsWith(`${normalizedRoot}/`)) {
    return filePath;
  }
  return `${normalizedRoot}/${filePath}`;
};

const parsePayload = (raw: string) => {
  return Effect.runSync(
    Schema.decodeUnknown(Schema.parseJson(PostToolUsePayloadSchema))(raw).pipe(
      Effect.mapError((error) => {
        return new Error(`stdin-payload: ${String(error)}`);
      })
    )
  );
};

const buildFileFromArguments = (
  argumentPath: string,
  payloadCwd: null | string,
  fallbackCwd: string
) => {
  const repoRoot = stripTrailingSlashes(
    normalizeSlashes(payloadCwd ?? fallbackCwd)
  );
  const filePath = normalizeSlashes(argumentPath);
  return {
    absFilePath: resolveAbsolutePath(filePath, repoRoot),
    relFilePath: computeRelativePath(filePath, repoRoot),
    repoRoot
  };
};

export const parsePostToolUseFile = (raw: string, fallbackCwd: string) => {
  const payload = parsePayload(raw);
  if (!isSupportedToolName(payload.toolName)) {
    return null;
  }
  const decodedArguments = decodeToolArguments(payload.toolArgs);
  const argumentPath = extractArgumentPath(decodedArguments);
  if (isNil(argumentPath)) {
    return null;
  }
  return buildFileFromArguments(argumentPath, payload.cwd ?? null, fallbackCwd);
};
