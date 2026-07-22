import { Effect, Schema } from "effect";
import { describe, expect, it, vi } from "vitest";

import {
  ErrorSeveritySchema,
  FileDiagnosticSchema,
  FileItemSchema,
  FileListSchema,
  FileReportSchema,
  MCPToolExecutionError,
  normalizePathToGlob,
  runWebstormInspections
} from "./run-webstorm-inspections.ts";

// Mock MCP SDK - use string paths to avoid hoisting issues
const mockCallTool = vi.fn();
const mockConnect = vi.fn();

// @ts-expect-error mock class signature differs from real MCP Client
vi.mock(import("@modelcontextprotocol/sdk/client/index.js"), () => {
  return {
    Client: class {
      public callTool = mockCallTool;
      public connect = mockConnect;
    }
  };
});

vi.mock(import("@modelcontextprotocol/sdk/client/streamableHttp.js"), () => {
  return {
    StreamableHTTPClientTransport: vi.fn()
  };
});

const ROOT = "C:/Users/glove/projects/ethang-monorepo";
const TS_PATH = "/c/Users/glove/projects/ethang-monorepo/src/foo.ts";
const SRC = "src";
const SRC_FOO_TS = "src/foo.ts";
const MOCK_SEARCH_FILE = {
  structuredContent: { items: [{ filePath: TS_PATH }] }
};

const makeMockFileReport = (
  errors: {
    column: number;
    description: string;
    line: number;
    lineContent: string;
    severity: string;
  }[]
) => {
  return {
    structuredContent: { errors, filePath: TS_PATH }
  };
};

describe(normalizePathToGlob, () => {
  it("normalizes '.' to '**/*'", () => {
    expect(normalizePathToGlob(".", ROOT)).toBe("**/*");
  });

  it("normalizes '' to '**/*'", () => {
    expect(normalizePathToGlob("", ROOT)).toBe("**/*");
  });

  it("normalizes relative path", () => {
    expect(normalizePathToGlob(SRC_FOO_TS, ROOT)).toBe(SRC_FOO_TS);
  });

  it("normalizes nested relative path", () => {
    expect(normalizePathToGlob("src/cli/file-check.ts", ROOT)).toBe(
      "src/cli/file-check.ts"
    );
  });
});

describe(runWebstormInspections, () => {
  const runInspections = (targets: string[]) => {
    return Effect.gen(function* () {
      return yield* runWebstormInspections(targets);
    });
  };

  it("queries files and returns errors when issues exist", async () => {
    mockCallTool.mockResolvedValueOnce(MOCK_SEARCH_FILE);
    mockCallTool.mockResolvedValueOnce(
      makeMockFileReport([
        {
          column: 1,
          description: "test error",
          line: 1,
          lineContent: "const x = 1",
          severity: "ERROR"
        }
      ])
    );
    mockConnect.mockResolvedValue(undefined);

    const result = await Effect.runPromise(runInspections([SRC]));

    expect(result).toHaveLength(1);
    expect(result[0]).toContain("ERROR");
    expect(result[0]).toContain("test error");
  });

  it("returns empty array when no issues found", async () => {
    mockCallTool.mockResolvedValueOnce(MOCK_SEARCH_FILE);
    mockCallTool.mockResolvedValueOnce(makeMockFileReport([]));
    mockConnect.mockResolvedValue(undefined);

    const result = await Effect.runPromise(runInspections([SRC]));

    expect(result).toStrictEqual([]);
  });

  it("handles WARNING severity", async () => {
    mockCallTool.mockResolvedValueOnce(MOCK_SEARCH_FILE);
    mockCallTool.mockResolvedValueOnce(
      makeMockFileReport([
        {
          column: 10,
          description: "warning msg",
          line: 5,
          lineContent: "const y = 2",
          severity: "WARNING"
        }
      ])
    );
    mockConnect.mockResolvedValue(undefined);

    const result = await Effect.runPromise(runInspections([SRC]));

    expect(result[0]).toContain("WARNING");
  });

  it("handles INFO severity", async () => {
    mockCallTool.mockResolvedValueOnce(MOCK_SEARCH_FILE);
    mockCallTool.mockResolvedValueOnce(
      makeMockFileReport([
        {
          column: 1,
          description: "info msg",
          line: 10,
          lineContent: "console.log(1)",
          severity: "INFO"
        }
      ])
    );
    mockConnect.mockResolvedValue(undefined);

    const result = await Effect.runPromise(runInspections([SRC]));

    expect(result[0]).toContain("INFO");
  });

  it("handles MCP connection failure", async () => {
    mockConnect.mockRejectedValue(new Error("connection refused"));

    const result = await Effect.runPromise(
      Effect.either(runInspections([SRC]))
    );

    expect(result._tag).toBe("Left");
    expect((result as any).left).toBeInstanceOf(MCPToolExecutionError);
  });

  it("handles search_file failure", async () => {
    mockConnect.mockResolvedValue(undefined);
    mockCallTool.mockRejectedValue(new Error("search failed"));

    const result = await Effect.runPromise(
      Effect.either(runInspections([SRC]))
    );

    expect(result._tag).toBe("Left");
    expect((result as any).left).toBeInstanceOf(MCPToolExecutionError);
  });

  it("handles root target '.' which normalizes to '**/*'", async () => {
    mockCallTool.mockResolvedValueOnce(MOCK_SEARCH_FILE);
    mockCallTool.mockResolvedValueOnce(makeMockFileReport([]));
    mockConnect.mockResolvedValue(undefined);

    const result = await Effect.runPromise(runInspections(["."]));

    expect(result).toStrictEqual([]);
    expect(mockCallTool).toHaveBeenCalledWith({
      arguments: { q: "**/*" },
      name: "search_file"
    });
  });

  it("handles get_file_problems failure", async () => {
    mockCallTool.mockResolvedValueOnce(MOCK_SEARCH_FILE);
    mockCallTool.mockRejectedValueOnce(new Error("get_file_problems failed"));
    mockConnect.mockResolvedValue(undefined);

    const result = await Effect.runPromise(
      Effect.either(runInspections([SRC]))
    );

    expect(result._tag).toBe("Left");
    expect((result as any).left).toBeInstanceOf(MCPToolExecutionError);
  });

  it("handles structuredContent not matching FileReportSchema", async () => {
    mockCallTool.mockResolvedValueOnce(MOCK_SEARCH_FILE);
    mockCallTool.mockResolvedValueOnce({
      structuredContent: { notValid: true }
    });
    mockConnect.mockResolvedValue(undefined);

    const result = await Effect.runPromise(runInspections([SRC]));

    expect(result).toStrictEqual([]);
  });
});

describe("schema validation", () => {
  it("fileItemSchema validates filePath", () => {
    const valid = Schema.decodeUnknownEither(FileItemSchema)({
      filePath: SRC_FOO_TS
    });

    expect(valid._tag).toBe("Right");

    const invalid = Schema.decodeUnknownEither(FileItemSchema)({});

    expect(invalid._tag).toBe("Left");
  });

  it("fileListSchema validates items array", () => {
    const valid = Schema.decodeUnknownEither(FileListSchema)({
      items: [{ filePath: SRC_FOO_TS }]
    });

    expect(valid._tag).toBe("Right");

    const empty = Schema.decodeUnknownEither(FileListSchema)({ items: [] });

    expect(empty._tag).toBe("Right");

    const noItems = Schema.decodeUnknownEither(FileListSchema)({});

    expect(noItems._tag).toBe("Left");
  });

  it("errorSeveritySchema validates severity levels", () => {
    const decode = Schema.decodeUnknownEither(ErrorSeveritySchema);

    expect(decode("ERROR")._tag).toBe("Right");
    expect(decode("WARNING")._tag).toBe("Right");
    expect(decode("INFO")._tag).toBe("Right");
    expect(decode("DEBUG")._tag).toBe("Left");
  });

  it("fileDiagnosticSchema validates diagnostic shape", () => {
    const valid = Schema.decodeUnknownEither(FileDiagnosticSchema)({
      column: 1,
      description: "error",
      line: 1,
      lineContent: "code",
      severity: "ERROR"
    });

    expect(valid._tag).toBe("Right");

    const invalid = Schema.decodeUnknownEither(FileDiagnosticSchema)({});

    expect(invalid._tag).toBe("Left");
  });

  it("fileReportSchema validates report shape", () => {
    const valid = Schema.decodeUnknownEither(FileReportSchema)({
      errors: [],
      filePath: SRC_FOO_TS
    });

    expect(valid._tag).toBe("Right");

    const withErrors = Schema.decodeUnknownEither(FileReportSchema)({
      errors: [
        {
          column: 1,
          description: "err",
          line: 1,
          lineContent: "x",
          severity: "ERROR"
        }
      ],
      filePath: SRC_FOO_TS
    });

    expect(withErrors._tag).toBe("Right");

    const invalid = Schema.decodeUnknownEither(FileReportSchema)({});

    expect(invalid._tag).toBe("Left");
  });
});
