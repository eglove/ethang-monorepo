import { Effect } from "effect";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { loadAutofixResults } from "../src/infrastructure/eslint-loader.ts";

const SEVERITY_ERROR = 2;
const SEVERITY_WARNING = 1;
const NULL_VALUE = null;

type MockState = {
  outputCalls: number;
  post: unknown;
  pre: unknown;
};

const mockState: MockState = {
  outputCalls: 0,
  post: [],
  pre: []
};

const stateReference: MockState = mockState;

vi.mock(import("eslint"), () => {
  const FakeEslint = class {
    private pass = 0;
    public lintFiles = vi.fn().mockImplementation(async () => {
      this.pass += 1;
      return 1 === this.pass ? stateReference.pre : stateReference.post;
    });
  };
  Object.assign(FakeEslint, {
    outputFixes: vi.fn().mockImplementation(async (rs: unknown) => {
      stateReference.outputCalls += 1;
      return rs;
    })
  });
  const ESLint = FakeEslint as unknown as new (options: {
    cwd: string;
    fix: boolean;
  }) => {
    lintFiles: () => Promise<unknown>;
  };
  return { default: { ESLint }, ESLint } as unknown as Partial<
    typeof import("eslint")
  >;
});

const createMockEslintModule = (ESLint: unknown) => {
  return { default: { ESLint }, ESLint } as unknown as Partial<
    typeof import("eslint")
  >;
};

const resetState = () => {
  mockState.outputCalls = 0;
  mockState.pre = [];
  mockState.post = [];
};

const runAutofix = async (cwd: string, files: readonly string[]) => {
  return Effect.runPromise(loadAutofixResults({ cwd, files }));
};

const resetTestState = () => {
  resetState();
  vi.clearAllMocks();
};

describe(loadAutofixResults, () => {
  const A_TS = path.resolve("a.ts");
  const CWD_DOT = path.resolve(".");
  const NO_CONSOLE = "no-console";
  const EMPTY_MESSAGES: { messages: [] } = { messages: [] };
  const EMPTY_LINT_ENTRY = (filePath: string) => {
    return { filePath, ...EMPTY_MESSAGES };
  };

  it("returns cwd/files normalized to POSIX and merges pre/post by absolute path", async () => {
    resetTestState();
    const fooSource = path.resolve("packages/foo/src/a.ts");
    const fooCwd = path.resolve("packages/foo");
    mockState.pre = [
      {
        filePath: fooSource,
        messages: [
          {
            column: 5,
            line: 1,
            message: NO_CONSOLE,
            ruleId: NO_CONSOLE,
            severity: SEVERITY_WARNING
          }
        ]
      }
    ];
    mockState.post = [EMPTY_LINT_ENTRY(fooSource)];

    const result = await runAutofix(fooCwd, [fooSource]);

    expect(result.cwd).toBe(fooCwd);
    expect(result.files).toStrictEqual(["src/a.ts"]);
    expect(result.results).toStrictEqual([
      {
        filePath: "src/a.ts",
        postFixMessages: [],
        preFixMessages: [
          {
            column: 5,
            fixable: false,
            line: 1,
            message: NO_CONSOLE,
            ruleId: NO_CONSOLE,
            severity: SEVERITY_WARNING
          }
        ]
      }
    ]);
    expect(mockState.outputCalls).toBe(1);
  });

  it("does not write fixes when explicitly disabled", async () => {
    resetTestState();
    mockState.pre = [EMPTY_LINT_ENTRY(A_TS)];
    mockState.post = [EMPTY_LINT_ENTRY(A_TS)];

    const result = await Effect.runPromise(
      loadAutofixResults({ cwd: CWD_DOT, files: [A_TS], fix: false })
    );

    expect(result.results).toHaveLength(1);
    expect(mockState.outputCalls).toBe(0);
  });

  it("propagates fixable=true when ESLint reported a fix", async () => {
    resetTestState();
    mockState.pre = [
      {
        filePath: A_TS,
        messages: [
          {
            column: 1,
            fix: { range: [0, 1], text: "" },
            line: 1,
            message: "msg",
            ruleId: "r",
            severity: SEVERITY_ERROR
          }
        ]
      }
    ];
    mockState.post = [EMPTY_LINT_ENTRY(A_TS)];

    const result = await runAutofix(CWD_DOT, [A_TS]);

    expect(result.results[0]?.preFixMessages[0]?.fixable).toBe(true);
  });

  it("clamps an unknown severity to warning", async () => {
    resetTestState();
    mockState.pre = [
      {
        filePath: A_TS,
        messages: [
          {
            column: 1,
            line: 1,
            message: "m",
            ruleId: NULL_VALUE,
            severity: 3
          }
        ]
      }
    ];
    mockState.post = [EMPTY_LINT_ENTRY(A_TS)];

    const result = await runAutofix(CWD_DOT, [A_TS]);

    expect(result.results[0]?.preFixMessages[0]?.severity).toBe(
      SEVERITY_WARNING
    );
  });
});

describe("loadAutofixResults - defaults", () => {
  const A_TS = path.resolve("a.ts");
  const CWD_DOT = path.resolve(".");
  const EMPTY_MESSAGES: { messages: [] } = { messages: [] };
  const EMPTY_LINT_ENTRY = (filePath: string) => {
    return { filePath, ...EMPTY_MESSAGES };
  };

  it("fills in 0 defaults for missing line/column/message", async () => {
    resetTestState();
    mockState.pre = [{ filePath: A_TS, messages: [{}] }];
    mockState.post = [{ filePath: A_TS, messages: [{}] }];

    const result = await runAutofix(CWD_DOT, [A_TS]);

    expect(result.results[0]?.preFixMessages[0]).toStrictEqual({
      column: 0,
      fixable: false,
      line: 0,
      message: "",
      ruleId: NULL_VALUE,
      severity: SEVERITY_WARNING
    });
    expect(result.results[0]?.postFixMessages[0]?.severity).toBe(
      SEVERITY_WARNING
    );
  });

  it("resolves relative file inputs against cwd before normalizing", async () => {
    resetTestState();
    const packageSource = path.resolve("pkg/src/b.ts");
    const packageCwd = path.resolve("pkg");
    mockState.pre = [EMPTY_LINT_ENTRY(packageSource)];
    mockState.post = [EMPTY_LINT_ENTRY(packageSource)];

    const result = await runAutofix(packageCwd, ["src/b.ts"]);

    expect(result.files).toStrictEqual(["src/b.ts"]);
    expect(result.results[0]?.filePath).toBe("src/b.ts");
  });

  it("returns an empty result when no files are provided", async () => {
    resetTestState();
    const result = await runAutofix(CWD_DOT, []);

    expect(result.results).toStrictEqual([]);
    expect(result.files).toStrictEqual([]);
  });
});

describe("loadAutofixResults - empty fallback", () => {
  const A_TS = path.resolve("a.ts");
  const B_TS = path.resolve("b.ts");
  const CWD_DOT = path.resolve(".");
  const EMPTY_MESSAGES: { messages: [] } = { messages: [] };

  it("uses empty postFixMessages when the post-run result omits messages", async () => {
    resetTestState();
    mockState.pre = [{ filePath: A_TS, ...EMPTY_MESSAGES }];
    mockState.post = [{ filePath: A_TS }];

    const result = await runAutofix(CWD_DOT, [A_TS]);

    expect(result.results[0]?.postFixMessages).toStrictEqual([]);
  });

  it("falls back to empty preFixMessages when the pre-run result omits messages", async () => {
    resetTestState();
    mockState.pre = [{ filePath: A_TS }];
    mockState.post = [{ filePath: A_TS }];

    const result = await runAutofix(CWD_DOT, [A_TS]);

    expect(result.results[0]?.preFixMessages).toStrictEqual([]);
  });

  it("falls back to empty postFixMessages when the post-run omits the file entirely", async () => {
    resetTestState();
    mockState.pre = [{ filePath: A_TS, ...EMPTY_MESSAGES }];
    mockState.post = [{ filePath: B_TS, ...EMPTY_MESSAGES }];

    const result = await runAutofix(CWD_DOT, [A_TS]);

    expect(result.results[0]?.postFixMessages).toStrictEqual([]);
    expect(result.results[0]?.preFixMessages).toStrictEqual([]);
  });
});

describe("loadAutofixResults - module mock failures", () => {
  const A_TS = path.resolve("a.ts");
  const CWD_DOT = path.resolve(".");

  it("rejects when the eslint module does not export ESLint", async () => {
    resetTestState();
    vi.resetModules();
    vi.doMock(import("eslint"), () => {
      return createMockEslintModule(NULL_VALUE);
    });
    const module = await import("../src/infrastructure/eslint-loader.ts");

    await expect(
      Effect.runPromise(
        module.loadAutofixResults({ cwd: CWD_DOT, files: [A_TS] })
      )
    ).rejects.toThrow(/ESLint class not found/u);

    vi.doUnmock("eslint");
    vi.resetModules();
  });

  it("skips outputFixes when ESLint.outputFixes is missing", async () => {
    resetTestState();
    vi.resetModules();
    function FakeEslint() {
      return { lintFiles: vi.fn().mockResolvedValue([]) };
    }
    vi.doMock(import("eslint"), () => {
      return createMockEslintModule(FakeEslint);
    });
    const module = await import("../src/infrastructure/eslint-loader.ts");

    const result = await Effect.runPromise(
      module.loadAutofixResults({ cwd: CWD_DOT, files: [] })
    );

    expect(result.results).toStrictEqual([]);
    expect(mockState.outputCalls).toBe(0);

    vi.doUnmock("eslint");
    vi.resetModules();
  });

  it("ignores errors thrown by outputFixes", async () => {
    resetTestState();
    vi.resetModules();
    function FakeEslint() {
      return { lintFiles: vi.fn().mockResolvedValue([]) };
    }
    Object.assign(FakeEslint, {
      outputFixes: vi.fn().mockRejectedValue(new Error("outputFixes boom"))
    });
    vi.doMock(import("eslint"), () => {
      return createMockEslintModule(FakeEslint);
    });
    const module = await import("../src/infrastructure/eslint-loader.ts");

    const result = await Effect.runPromise(
      module.loadAutofixResults({ cwd: CWD_DOT, files: [] })
    );

    expect(result.results).toStrictEqual([]);

    vi.doUnmock("eslint");
    vi.resetModules();
  });

  it("rejects with the lintFiles error when ESLint.lintFiles fails on pre-run", async () => {
    resetTestState();
    vi.resetModules();
    function FakeEslint() {
      return {
        lintFiles: vi.fn().mockRejectedValueOnce(new Error("pre failed"))
      };
    }
    Object.assign(FakeEslint, { outputFixes: vi.fn() });
    vi.doMock(import("eslint"), () => {
      return createMockEslintModule(FakeEslint);
    });
    const module = await import("../src/infrastructure/eslint-loader.ts");

    await expect(
      Effect.runPromise(module.loadAutofixResults({ cwd: CWD_DOT, files: [] }))
    ).rejects.toThrow(/pre failed/u);

    vi.doUnmock("eslint");
    vi.resetModules();
  });
});
