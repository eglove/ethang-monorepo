import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Data, Effect, Match, Schema } from "effect";
import isEmpty from "lodash/isEmpty.js";
import join from "lodash/join.js";
import map from "lodash/map.js";
import replace from "lodash/replace.js";
import trim from "lodash/trim.js";
import path from "node:path";

const serverUrl = "http://127.0.0.1:64506/stream";
const projectPath = "C:/Users/glove/projects/ethang-monorepo";

export class MCPToolExecutionError extends Data.TaggedError(
  "MCPToolExecutionError"
)<{
  cause: unknown;
}> {}

export const FileItemSchema = Schema.Struct({
  filePath: Schema.String
});

export const FileListSchema = Schema.Struct({
  items: Schema.Array(FileItemSchema)
});

export const ErrorSeveritySchema = Schema.Literal("ERROR", "WARNING", "INFO");

export const FileDiagnosticSchema = Schema.Struct({
  column: Schema.Number,
  description: Schema.String,
  line: Schema.Number,
  lineContent: Schema.String,
  severity: ErrorSeveritySchema
});

export const FileReportSchema = Schema.Struct({
  errors: Schema.Array(FileDiagnosticSchema),
  filePath: Schema.String
});

const normalizePathToGlob = (inputPath: string, rootDirectory: string) => {
  const absolutePath = path.resolve(rootDirectory, inputPath);
  let relativePath = path.relative(rootDirectory, absolutePath);
  relativePath = replace(relativePath, /\\/gu, "/");

  if ("" === relativePath || "." === relativePath) {
    return "**/*";
  }

  return relativePath;
};

export function* runWebstormInspections(targets: string[]) {
  yield* Effect.log(`🔌 Connecting to WebStorm MCP at \`${serverUrl}\`...`);

  const client = yield* Effect.tryPromise({
    catch: (error) => {
      return new MCPToolExecutionError({ cause: error });
    },
    try: async () => {
      const transport = new StreamableHTTPClientTransport(new URL(serverUrl), {
        requestInit: {
          headers: {
            IJ_MCP_SERVER_PROJECT_PATH: projectPath
          }
        }
      });

      const mcpClient = new Client(
        {
          name: "webstorm-inspections",
          version: "0.0.0"
        },
        {
          capabilities: {}
        }
      );

      // @ts-expect-error bad typings
      await mcpClient.connect(transport);
      return mcpClient;
    }
  });

  yield* Effect.log("✅ Connected to WebStorm MCP server.");
  yield* Effect.log(
    `🔍 Querying IDE problems for: \`${join(targets, ", ")}\`...`
  );

  const queryGlob = (globPattern: string) => {
    return Effect.tryPromise({
      catch: (error) => {
        Effect.logError(error);
        return new MCPToolExecutionError({ cause: error });
      },
      try: async () => {
        const normalizedGlob = normalizePathToGlob(globPattern, projectPath);

        const searchResult = await client.callTool({
          arguments: {
            q: normalizedGlob
          },
          name: "search_file"
        });

        const content = Schema.decodeUnknownSync(FileListSchema)(
          searchResult.structuredContent
        );

        return map(content.items, "filePath");
      }
    });
  };

  const fileProgram = Effect.forEach(targets, (target) => {
    return queryGlob(target);
  });
  const filePaths = yield* Effect.map(fileProgram, (results) => {
    return results.flat();
  });

  const errors: string[] = [];

  yield* Effect.forEach(
    filePaths,
    (filePath) => {
      return Effect.gen(function* () {
        const rawResult = yield* Effect.tryPromise({
          catch: (error) => {
            return new MCPToolExecutionError({ cause: error });
          },
          try: async () => {
            return client.callTool({
              arguments: {
                errorsOnly: false,
                filePath,
                projectPath
              },
              name: "get_file_problems"
            });
          }
        });

        const isFileReport = Schema.is(FileReportSchema);

        if (isFileReport(rawResult.structuredContent)) {
          const report = Schema.decodeUnknownSync(FileReportSchema)(
            rawResult.structuredContent
          );

          if (0 < report.errors.length) {
            for (const error of report.errors) {
              const partialMessage = `${filePath}:${error.line}:${error.column} - ${error.description}\n  | ${trim(error.lineContent)}`;
              const message = `[${error.severity}] ${partialMessage}`;
              errors.push(message);

              yield* Match.value(error.severity).pipe(
                Match.when("ERROR", () => {
                  return Effect.logError(message);
                }),
                Match.when("INFO", () => {
                  return Effect.log(message);
                }),
                Match.when("WARNING", () => {
                  return Effect.logWarning(message);
                }),
                Match.orElse(() => {
                  return Effect.logError(`[UNKNOWN] ${partialMessage}`);
                })
              );
            }
          }
        }
      });
    },
    { concurrency: "unbounded" }
  );

  if (isEmpty(errors)) {
    yield* Effect.log("✅ No WebStorm MCP issues found.");
  }

  return errors;
}
