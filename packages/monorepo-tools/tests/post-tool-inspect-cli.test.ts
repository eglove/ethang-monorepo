import { Effect } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { inspectAfterTool } from "../src/application/inspect-after-tool.ts";
import {
  buildTransformedResult,
  extractFields,
  type HermesTransformPayload,
  main
} from "../src/cli/post-tool-inspect.cli.ts";

vi.mock(import("../src/application/inspect-after-tool.ts"), () => {
  return {
    inspectAfterTool: vi.fn()
  };
});

const mockInspect = vi.mocked(inspectAfterTool);

const createMockStdin = (content: string) => {
  return {
    async *[Symbol.asyncIterator]() {
      yield content;
    }
  };
};

const captureStdout = () => {
  const writes: string[] = [];
  const originalWrite = process.stdout.write;

  process.stdout.write = (chunk: string) => {
    writes.push(chunk);
    return true;
  };

  return {
    getWrites: () => {
      return writes;
    },
    restore: () => {
      process.stdout.write = originalWrite;
    }
  };
};

describe(buildTransformedResult, () => {
  it("returns originalResult when diagnostics is empty", () => {
    const original = "original tool output";
    const diagnostics = "";
    const result = buildTransformedResult(original, diagnostics);

    expect(result).toBe(original);
  });

  it("returns originalResult when diagnostics is falsy", () => {
    const original = "test output";
    const result = buildTransformedResult(original, "");

    expect(result).toBe(original);
  });

  it("appends diagnostics after double newline when diagnostics is non-empty", () => {
    const original = "original tool output";
    const diagnostics = "error on line 42";
    const result = buildTransformedResult(original, diagnostics);

    expect(result).toBe(`${original}\n\n${diagnostics}`);
  });

  it("handles multiline diagnostics", () => {
    const original = "file written";
    const diagnostics = "error 1\nerror 2\nerror 3";
    const result = buildTransformedResult(original, diagnostics);

    expect(result).toBe(`${original}\n\n${diagnostics}`);
  });

  it("handles empty originalResult with non-empty diagnostics", () => {
    const original = "";
    const diagnostics = "diagnostic info";
    const result = buildTransformedResult(original, diagnostics);

    expect(result).toBe(`\n\n${diagnostics}`);
  });
});

describe(extractFields, () => {
  const TEST_CWD = "/project";
  const INDEX_TS = "src/index.ts";

  it("extracts path from Hermes tool_input.path", () => {
    const payload: HermesTransformPayload = {
      cwd: TEST_CWD,
      extra: { result: "output" },
      tool_input: { path: INDEX_TS }
    };

    const fields = extractFields(payload);

    expect(fields).toStrictEqual({
      cwd: TEST_CWD,
      filePath: INDEX_TS,
      originalResult: "output"
    });
  });

  it("extracts pathInProject from WebStorm MCP tool_input", () => {
    const payload: HermesTransformPayload = {
      cwd: TEST_CWD,
      extra: { result: "webstorm output" },
      tool_input: { pathInProject: "packages/foo/src/bar.ts" }
    };

    const fields = extractFields(payload);

    expect(fields).toStrictEqual({
      cwd: TEST_CWD,
      filePath: "packages/foo/src/bar.ts",
      originalResult: "webstorm output"
    });
  });

  it("prefers path over pathInProject when both exist", () => {
    const payload: HermesTransformPayload = {
      cwd: TEST_CWD,
      extra: { result: "mixed output" },
      tool_input: { path: "src/priority.ts", pathInProject: "src/fallback.ts" }
    };

    const fields = extractFields(payload);

    expect(fields.filePath).toBe("src/priority.ts");
  });

  it("returns null filePath when tool_input is missing", () => {
    const payload: HermesTransformPayload = {
      cwd: TEST_CWD,
      extra: { result: "no path" }
    };

    const fields = extractFields(payload);

    expect(fields).toStrictEqual({
      cwd: TEST_CWD,
      filePath: null,
      originalResult: "no path"
    });
  });

  it("returns null cwd when missing", () => {
    const payload: HermesTransformPayload = {
      extra: { result: "no cwd" },
      tool_input: { path: "src/test.ts" }
    };

    const fields = extractFields(payload);

    expect(fields).toStrictEqual({
      cwd: null,
      filePath: "src/test.ts",
      originalResult: "no cwd"
    });
  });

  it("returns empty string for missing extra.result", () => {
    const payload: HermesTransformPayload = {
      cwd: TEST_CWD,
      tool_input: { path: INDEX_TS }
    };

    const fields = extractFields(payload);

    expect(fields).toStrictEqual({
      cwd: TEST_CWD,
      filePath: INDEX_TS,
      originalResult: ""
    });
  });
});

describe(main, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("outputs {} when stdin JSON is invalid", async () => {
    const stdout = captureStdout();
    try {
      await main(createMockStdin("not valid json"));

      expect(stdout.getWrites()).toStrictEqual(["{}\n"]);
    } finally {
      stdout.restore();
    }
  });

  it("outputs {} when tool_input is missing", async () => {
    const stdout = captureStdout();
    try {
      await main(
        createMockStdin(
          JSON.stringify({ cwd: "/project", extra: { result: "original" } })
        )
      );

      expect(stdout.getWrites()).toStrictEqual(["{}\n"]);
    } finally {
      stdout.restore();
    }
  });

  it("outputs {} when filePath is empty string", async () => {
    const stdout = captureStdout();
    try {
      await main(
        createMockStdin(
          JSON.stringify({
            cwd: "/project",
            extra: { result: "original" },
            tool_input: { path: "" }
          })
        )
      );

      expect(stdout.getWrites()).toStrictEqual(["{}\n"]);
    } finally {
      stdout.restore();
    }
  });

  it("outputs {} when cwd is null", async () => {
    const stdout = captureStdout();
    try {
      await main(
        createMockStdin(
          JSON.stringify({
            extra: { result: "original" },
            tool_input: { path: "src/index.ts" }
          })
        )
      );

      expect(stdout.getWrites()).toStrictEqual(["{}\n"]);
    } finally {
      stdout.restore();
    }
  });

  it("outputs {} when inspectAfterTool returns empty string", async () => {
    mockInspect.mockReturnValue(Effect.succeed(""));

    const stdout = captureStdout();
    try {
      await main(
        createMockStdin(
          JSON.stringify({
            cwd: "/project",
            extra: { result: "original output" },
            tool_input: { path: "src/index.ts" }
          })
        )
      );

      expect(stdout.getWrites()).toStrictEqual(["{}\n"]);
    } finally {
      stdout.restore();
    }
  });

  it("outputs transformed result when diagnostics are present", async () => {
    mockInspect.mockReturnValue(Effect.succeed("error: something wrong"));

    const stdout = captureStdout();
    try {
      await main(
        createMockStdin(
          JSON.stringify({
            cwd: "/project",
            extra: { result: "file created" },
            tool_input: { pathInProject: "src/foo.ts" }
          })
        )
      );

      const output = stdout.getWrites()[0] ?? "";
      const parsed = JSON.parse(output) as { result: string };

      expect(parsed.result).toBe("file created\n\nerror: something wrong");
    } finally {
      stdout.restore();
    }
  });

  it("outputs {} when inspectAfterTool throws", async () => {
    mockInspect.mockReturnValue(
      Effect.fail(new Error("inspection failed")) as unknown as ReturnType<
        typeof inspectAfterTool
      >
    );

    const stdout = captureStdout();
    try {
      await main(
        createMockStdin(
          JSON.stringify({
            cwd: "/project",
            extra: { result: "original" },
            tool_input: { path: "src/index.ts" }
          })
        )
      );

      expect(stdout.getWrites()).toStrictEqual(["{}\n"]);
    } finally {
      stdout.restore();
    }
  });

  it("extracts pathInProject from WebStorm MCP payload", async () => {
    mockInspect.mockReturnValue(Effect.succeed("warning: unused variable"));

    const stdout = captureStdout();
    try {
      await main(
        createMockStdin(
          JSON.stringify({
            cwd: "/monorepo",
            extra: { result: "file updated" },
            tool_input: { pathInProject: "apps/api/src/handler.ts" }
          })
        )
      );

      const output = stdout.getWrites()[0] ?? "";
      const parsed = JSON.parse(output) as { result: string };

      expect(parsed.result).toBe("file updated\n\nwarning: unused variable");
      expect(mockInspect).toHaveBeenCalledWith({
        cwd: "/monorepo",
        filePath: "apps/api/src/handler.ts"
      });
    } finally {
      stdout.restore();
    }
  });
});
