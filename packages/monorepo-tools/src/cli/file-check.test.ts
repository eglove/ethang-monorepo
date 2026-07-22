import { Effect, Schema } from "effect";
import { describe, expect, it, vi } from "vitest";

import {
  buildOutput,
  collectDiagnostics,
  extractTargetPath,
  HermesHookInput,
  runInspections
} from "./file-check.ts";

// Mock the infrastructure deps - use generator mocks to match real signatures
const mockRunEslint = vi.fn();
const mockRunWebstorm = vi.fn();

vi.mock(import("./run-eslint.ts"), () => {
  return {
    *runEslint(targets: string[]) {
      return yield* mockRunEslint(targets);
    }
  };
});

vi.mock(import("./run-webstorm-inspections.ts"), () => {
  return {
    *runWebstormInspections(targets: string[]) {
      return yield* mockRunWebstorm(targets);
    }
  };
});

const TEST_PATH = "src/foo.ts";
const TEST_TARGET = "src/bar.ts";
const FIXED_MSG = "FIXED: file1.ts";
const ERROR_MSG = "ERROR: line 1";

describe(extractTargetPath, () => {
  it("extracts path from tool_input with path field", () => {
    expect(extractTargetPath({ path: TEST_PATH })).toBe(TEST_PATH);
  });

  it("extracts target from tool_input with target field", () => {
    expect(extractTargetPath({ target: TEST_TARGET })).toBe(TEST_TARGET);
  });

  it("prefers path over target when both present", () => {
    expect(extractTargetPath({ path: TEST_PATH, target: TEST_TARGET })).toBe(
      TEST_PATH
    );
  });

  it("defaults to '.' when neither path nor target present", () => {
    expect(extractTargetPath({})).toBe(".");
  });

  it("defaults to '.' for null input", () => {
    expect(extractTargetPath(null)).toBe(".");
  });

  it("defaults to '.' for undefined input", () => {
    expect(extractTargetPath(undefined)).toBe(".");
  });

  it("defaults to '.' for non-object input", () => {
    expect(extractTargetPath(42)).toBe(".");
    expect(extractTargetPath("string")).toBe(".");
  });

  it("ignores non-string path/target values", () => {
    expect(extractTargetPath({ path: 42, target: true })).toBe(".");
  });
});

describe(collectDiagnostics, () => {
  it("returns empty array when both inputs are empty", () => {
    expect(collectDiagnostics([], [])).toStrictEqual([]);
  });

  it("collects fixed files only", () => {
    const fixed = [FIXED_MSG, "FIXED: file2.ts"];

    expect(collectDiagnostics(fixed, [])).toStrictEqual(fixed);
  });

  it("collects errors only", () => {
    const errors = [ERROR_MSG, "ERROR: line 2"];

    expect(collectDiagnostics([], errors)).toStrictEqual(errors);
  });

  it("collects both fixed files and errors", () => {
    expect(collectDiagnostics([FIXED_MSG], [ERROR_MSG])).toStrictEqual([
      FIXED_MSG,
      ERROR_MSG
    ]);
  });

  it("preserves order: fixed files before errors", () => {
    const fixed = ["A", "B"];
    const errors = ["C", "D"];

    expect(collectDiagnostics(fixed, errors)).toStrictEqual([
      "A",
      "B",
      "C",
      "D"
    ]);
  });
});

describe(buildOutput, () => {
  it("returns JSON with original result when no diagnostics", () => {
    const output = buildOutput("original result", []);

    expect(JSON.parse(output)).toStrictEqual({ result: "original result" });
  });

  it("appends diagnostics to result", () => {
    const output = buildOutput("result", [ERROR_MSG, FIXED_MSG]);
    const parsed: any = JSON.parse(output);

    expect(parsed.result).toBe(
      `result\n\n[hook:eslint-autofix+webstorm] ${ERROR_MSG}\n${FIXED_MSG}`
    );
  });

  it("handles empty result string with no diagnostics", () => {
    const output = buildOutput("", []);

    expect(JSON.parse(output)).toStrictEqual({ result: "" });
  });

  it("handles empty result string with diagnostics", () => {
    const output = buildOutput("", [FIXED_MSG]);
    const parsed: any = JSON.parse(output);

    expect(parsed.result).toBe(
      `\n\n[hook:eslint-autofix+webstorm] ${FIXED_MSG}`
    );
  });

  it("escapes special characters in diagnostics", () => {
    const output = buildOutput("test", ['line with "quotes"']);
    const parsed: any = JSON.parse(output);

    expect(parsed.result).toContain('line with "quotes"');
  });
});

describe("hermesHookInput schema", () => {
  const decodeJson = Schema.decodeUnknownEither(
    Schema.parseJson(HermesHookInput)
  );

  it("decodes valid payload with extra", () => {
    const payload = {
      extra: { result: "ok", task_id: "abc" },
      tool_input: { path: TEST_PATH },
      tool_name: "patch"
    };

    expect(decodeJson(JSON.stringify(payload))._tag).toBe("Right");
  });

  it("decodes valid payload without extra", () => {
    const payload = {
      tool_input: { path: TEST_TARGET },
      tool_name: "write_file"
    };

    expect(decodeJson(JSON.stringify(payload))._tag).toBe("Right");
  });

  it("decodes valid payload with extra but no task_id", () => {
    const payload = {
      extra: { result: "ok" },
      tool_input: { path: TEST_PATH },
      tool_name: "patch"
    };

    expect(decodeJson(JSON.stringify(payload))._tag).toBe("Right");
  });

  it("rejects payload with missing tool_name", () => {
    const payload = { tool_input: { path: TEST_PATH } };

    expect(decodeJson(JSON.stringify(payload))._tag).toBe("Left");
  });

  it("rejects payload with non-string tool_name", () => {
    const payload = {
      tool_input: { path: TEST_PATH },
      tool_name: 42
    };

    expect(decodeJson(JSON.stringify(payload))._tag).toBe("Left");
  });

  it("rejects invalid JSON", () => {
    expect(decodeJson("not json")._tag).toBe("Left");
  });

  it("rejects payload with non-string result in extra", () => {
    const payload = {
      extra: { result: 123 },
      tool_input: { path: TEST_PATH },
      tool_name: "patch"
    };

    expect(decodeJson(JSON.stringify(payload))._tag).toBe("Left");
  });

  it("accepts any type for tool_input", () => {
    const payloads = [
      { tool_input: {}, tool_name: "patch" },
      { tool_input: null, tool_name: "patch" },
      { tool_input: "string", tool_name: "patch" },
      { tool_input: [1, 2], tool_name: "patch" }
    ];

    for (const payload of payloads) {
      expect(decodeJson(JSON.stringify(payload))._tag).toBe("Right");
    }
  });
});

describe(runInspections, () => {
  it("runs eslint and webstorm inspections and collects diagnostics", async () => {
    mockRunEslint.mockReturnValue(Effect.succeed([FIXED_MSG]));
    mockRunWebstorm.mockReturnValue(Effect.succeed([ERROR_MSG]));

    const result = await Effect.runPromise(runInspections(TEST_PATH));

    expect(mockRunEslint).toHaveBeenCalledWith([TEST_PATH]);
    expect(mockRunWebstorm).toHaveBeenCalledWith([TEST_PATH]);
    expect(result).toStrictEqual([FIXED_MSG, ERROR_MSG]);
  });

  it("returns empty array when no issues found", async () => {
    mockRunEslint.mockReturnValue(Effect.succeed([]));
    mockRunWebstorm.mockReturnValue(Effect.succeed([]));

    const result = await Effect.runPromise(runInspections("."));

    expect(result).toStrictEqual([]);
  });

  it("handles webstorm errors only", async () => {
    mockRunEslint.mockReturnValue(Effect.succeed([]));
    mockRunWebstorm.mockReturnValue(Effect.succeed(["ERROR: a", "ERROR: b"]));

    const result = await Effect.runPromise(runInspections(TEST_TARGET));

    expect(result).toStrictEqual(["ERROR: a", "ERROR: b"]);
  });

  it("handles eslint fixes only", async () => {
    mockRunEslint.mockReturnValue(Effect.succeed(["FIXED: a", "FIXED: b"]));
    mockRunWebstorm.mockReturnValue(Effect.succeed([]));

    const result = await Effect.runPromise(runInspections("src/baz.ts"));

    expect(result).toStrictEqual(["FIXED: a", "FIXED: b"]);
  });
});
