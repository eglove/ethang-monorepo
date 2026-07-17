/* eslint-disable vitest/no-hooks, vitest/require-top-level-describe, vitest/expect-expect, vitest/require-to-throw-message, vitest/no-conditional-in-test, vitest/no-conditional-expect, sonar/no-duplicate-string */
import { Effect } from "effect";
import process from "node:process";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { execFile, loadAutofixResults, runAutofix, runCoverage } = vi.hoisted(
  () => {
    return {
      execFile: vi.fn(),
      loadAutofixResults: vi.fn(),
      runAutofix: vi.fn(),
      runCoverage: vi.fn()
    };
  }
);

vi.mock(import("node:child_process"), async (importOriginal) => {
  const actual = await importOriginal();
  const mocked = { ...actual };
  Object.defineProperty(mocked, "execFile", { value: execFile });
  return mocked;
});
vi.mock(import("../src/application/run-autofix.ts"), async (importOriginal) => {
  return { ...(await importOriginal()), runAutofix };
});
vi.mock(
  import("../src/application/run-coverage.ts"),
  async (importOriginal) => {
    return { ...(await importOriginal()), runCoverage };
  }
);
vi.mock(import("../src/infrastructure/eslint-loader.ts"), () => {
  return { loadAutofixResults };
});

import {
  parseArguments as parseAutofixArguments,
  main as runAutofixCli
} from "../src/cli/eslint-autofix.cli.ts";
import {
  main as inspectAfterTool,
  readStdinText as readInspectStdin
} from "../src/cli/post-tool-inspect.cli.ts";
import {
  readStdinText as readReportStdin,
  renderFromStdin
} from "../src/cli/render-check-report.cli.ts";
import {
  parseArguments as parseWorkspaceArguments,
  runWorkspace
} from "../src/cli/run-workspace.cli.ts";
import {
  parseArguments as parseCoverageArguments,
  main as runCoverageCli
} from "../src/cli/vitest-coverage.cli.ts";

const chunks = (...values: unknown[]) => {
  return {
    async *[Symbol.asyncIterator]() {
      yield* values;
    }
  };
};

const expectExit = (action: () => unknown, code: number, message: string) => {
  const exit = vi.spyOn(process, "exit").mockImplementation((exitCode) => {
    throw new Error(`exit:${exitCode}`);
  });

  expect(action).toThrow(`exit:${code}`);
  expect(process.stderr.write).toHaveBeenCalledWith(
    expect.stringContaining(message)
  );

  exit.mockRestore();
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(process.stdout, "write").mockReturnValue(true);
  vi.spyOn(process.stderr, "write").mockReturnValue(true);
});

describe("run-workspace CLI", () => {
  const modulePath = "../src/cli/run-workspace.cli.ts";

  it.each([
    [[], "Missing --cwd <directory>"],
    [["--cwd"], "Missing value after flag"],
    [["--unknown"], "Unknown argument: --unknown"]
  ])("rejects invalid argument state %j", (argv, message) => {
    expectExit(
      () => {
        return parseWorkspaceArguments(argv);
      },
      1,
      message
    );
  });

  it.each([["--help"], ["-h"]])("prints usage for %s", (flag) => {
    const exit = vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`exit:${code}`);
    });

    expect(() => {
      return parseWorkspaceArguments([flag]);
    }).toThrow("exit:0");
    expect(process.stdout.write).toHaveBeenCalledWith(
      expect.stringContaining("Usage:")
    );

    exit.mockRestore();
  });

  it.each([
    [
      ["--cwd", "repo"],
      {
        checks: ["lint", "tsc", "test"],
        cwd: "repo",
        files: [],
        fix: false,
        targetedFiles: [],
        testFiles: []
      }
    ],
    [
      [
        "--fix",
        "--files",
        '["a.ts"]',
        "--test-files",
        '["a.test.ts"]',
        "--targeted-files",
        '["src/a.ts"]',
        "--checks",
        "lint,test",
        "--cwd",
        "repo"
      ],
      {
        checks: ["lint", "test"],
        cwd: "repo",
        files: ["a.ts"],
        fix: true,
        targetedFiles: ["src/a.ts"],
        testFiles: ["a.test.ts"]
      }
    ],
    [
      ["--cwd", "first", "--cwd", "last", "--skip-checks", "test", "--test"],
      {
        checks: ["lint", "tsc", "test"],
        cwd: "last",
        files: [],
        fix: false,
        targetedFiles: [],
        testFiles: []
      }
    ]
  ])("parses reachable option transitions %j", (argv, expected) => {
    expect(parseWorkspaceArguments(argv)).toStrictEqual(expected);
  });

  it.each([
    ["--files", "not-json"],
    ["--files", "[1]"],
    ["--test-files", "not-json"],
    ["--targeted-files", "[1]"]
  ])("rejects invalid JSON for %s", (flag, value) => {
    expect(() => {
      return parseWorkspaceArguments(["--cwd", "repo", flag, value]);
    }).toThrow();
  });

  it("exports a process entry helper", async () => {
    vi.resetModules();

    const imported = await import(modulePath);

    expect(imported.runMainFromProcess).toBeTypeOf("function");
  });

  it("runs each workspace check and returns the structured result", async () => {
    runAutofix.mockReturnValueOnce(
      Effect.succeed({ cwd: "repo", files: ["a.ts"], results: [] })
    );
    const runner = {
      run: vi.fn().mockImplementation((command: { arguments: string[] }) => {
        return Effect.succeed({
          exitCode: 0,
          stderr: "",
          stdout: command.arguments.includes("tsc")
            ? ""
            : '{"numFailedTests":0,"numPassedTests":1,"numSkippedTests":0,"numTodoTests":0,"numTotalTests":1,"success":true,"testResults":[]}'
        });
      })
    };

    await expect(
      Effect.runPromise(
        runWorkspace(
          parseWorkspaceArguments([
            "--cwd",
            "repo",
            "--fix",
            "--files",
            '["a.ts"]'
          ]),
          runner
        )
      )
    ).resolves.toStrictEqual({
      checks: ["lint", "tsc", "test"],
      cwd: "repo",
      files: ["a.ts"],
      lint: {
        autofix: {
          byFile: [],
          byRule: [],
          fixedErrorCount: 0,
          fixedWarningCount: 0,
          unfixableButFixableCount: 0
        },
        durationMs: expect.any(Number),
        errorCount: 0,
        exitCode: 0,
        fixableErrorCount: 0,
        fixableWarningCount: 0,
        issues: [],
        passed: true,
        ran: true,
        warningCount: 0
      },
      targetedFiles: [],
      test: {
        durationMs: expect.any(Number),
        exitCode: 0,
        failingTests: [],
        parseError: null,
        passed: true,
        ran: true,
        ranFullWorkspace: true,
        scopedToTestFiles: [],
        totals: { failed: 0, passed: 1, skipped: 0, todo: 0, total: 1 }
      },
      testFiles: [],
      tsc: {
        diagnostics: [],
        durationMs: expect.any(Number),
        errorCount: 0,
        exitCode: 0,
        passed: true,
        ran: true,
        scopedDiagnostics: false,
        warningCount: 0
      }
    });
    expect(runner.run).toHaveBeenCalledTimes(2);
  });
});

describe("vitest-coverage CLI", () => {
  it.each([
    [[], "Missing --cwd <directory>"],
    [["--cwd"], "Missing value after flag"],
    [["--unknown"], "Unknown argument: --unknown"]
  ])("rejects invalid argument state %j", (argv, message) => {
    expectExit(
      () => {
        return parseCoverageArguments(argv);
      },
      1,
      message
    );
  });

  it.each([["--help"], ["-h"]])("prints usage for %s", (flag) => {
    const exit = vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`exit:${code}`);
    });

    expect(() => {
      return parseCoverageArguments([flag]);
    }).toThrow("exit:0");
    expect(process.stdout.write).toHaveBeenCalledWith(
      expect.stringContaining("Usage:")
    );

    exit.mockRestore();
  });

  it.each([
    [
      ["--cwd", "repo"],
      {
        coverageFile: "coverage/coverage-summary.json",
        cwd: "repo",
        thresholds: null
      }
    ],
    [
      [
        "--thresholds",
        '{"branches":1,"functions":2,"lines":3,"statements":4}',
        "--coverage-file",
        "summary.json",
        "--cwd",
        "repo"
      ],
      {
        coverageFile: "summary.json",
        cwd: "repo",
        thresholds: { branches: 1, functions: 2, lines: 3, statements: 4 }
      }
    ]
  ])("parses option transitions %j", (argv, expected) => {
    expect(parseCoverageArguments(argv)).toStrictEqual(expected);
  });

  it.each([
    "not-json",
    "{}",
    '{"branches":1,"functions":2,"lines":3,"statements":"4"}'
  ])("rejects invalid thresholds %s", (thresholds) => {
    expect(() => {
      return parseCoverageArguments([
        "--cwd",
        "repo",
        "--thresholds",
        thresholds
      ]);
    }).toThrow();
  });

  it("passes parsed thresholds to coverage", async () => {
    runCoverage.mockReturnValueOnce(
      Effect.succeed({
        coverage: { covered: 1, total: 1 },
        passed: true,
        violations: []
      })
    );
    vi.spyOn(process, "chdir").mockReturnValue(undefined);

    await runCoverageCli([
      "--cwd",
      "repo",
      "--thresholds",
      '{"branches":1,"functions":2,"lines":3,"statements":4}'
    ]);

    expect(runCoverage).toHaveBeenCalledWith({
      filePath: "coverage/coverage-summary.json",
      thresholds: { branches: 1, functions: 2, lines: 3, statements: 4 }
    });
  });

  it.each([
    [true, 0],
    [false, 1]
  ])(
    "runs coverage and exits only on a failed result",
    async (passed, exitCode) => {
      runCoverage.mockReturnValueOnce(
        Effect.succeed({
          coverage: { covered: 1, total: 1 },
          passed,
          violations: []
        })
      );
      const chdir = vi.spyOn(process, "chdir").mockReturnValue(undefined);
      const exit = vi.spyOn(process, "exit").mockImplementation((code) => {
        throw new Error(`exit:${code}`);
      });

      const action = runCoverageCli(["--cwd", "repo"]);
      if (passed) {
        await expect(action).resolves.toBeUndefined();
      } else {
        await expect(action).rejects.toThrow(`exit:${exitCode}`);
      }

      expect(runCoverage).toHaveBeenCalledWith({
        filePath: "coverage/coverage-summary.json"
      });
      expect(chdir).toHaveBeenCalledWith("repo");

      exit.mockRestore();
    }
  );
});

describe("eslint-autofix CLI", () => {
  it.each([
    [[], "Missing --cwd <directory>"],
    [["--cwd"], "Missing --cwd <directory>"],
    [["--cwd", "repo"], "Missing --files <json-array>"],
    [["--cwd", "repo", "--files"], "Missing --files <json-array>"],
    [["--unknown"], "Unknown argument: --unknown"]
  ])("rejects invalid argument state %j", (argv, message) => {
    expectExit(
      () => {
        return parseAutofixArguments(argv);
      },
      1,
      message
    );
  });

  it.each([["--help"], ["-h"]])("prints usage for %s", (flag) => {
    const exit = vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`exit:${code}`);
    });

    expect(() => {
      return parseAutofixArguments([flag]);
    }).toThrow("exit:0");
    expect(process.stdout.write).toHaveBeenCalledWith(
      expect.stringContaining("Usage:")
    );

    exit.mockRestore();
  });

  it.each([
    [
      ["--cwd", "repo", "--files", '["a.ts"]'],
      { cwd: "repo", files: ["a.ts"] }
    ],
    [["--files", "[]", "--cwd", "repo"], { cwd: "repo", files: [] }]
  ])("parses option transitions %j", (argv, expected) => {
    expect(parseAutofixArguments(argv)).toStrictEqual(expected);
  });

  it.each(["not-json", "[1]"])("rejects invalid files %s", (files) => {
    expect(() => {
      return parseAutofixArguments(["--cwd", "repo", "--files", files]);
    }).toThrow();
  });

  it("runs the loader with parsed arguments", async () => {
    const result = { cwd: "repo", files: [], results: [] };
    loadAutofixResults.mockReturnValueOnce(Effect.succeed(result));

    await runAutofixCli(["--files", "[]", "--cwd", "repo"]);

    expect(loadAutofixResults).toHaveBeenCalledWith({ cwd: "repo", files: [] });
    expect(process.stdout.write).toHaveBeenCalledWith(
      `${JSON.stringify(result)}\n`
    );
  });
});

describe("stdin CLI adapters", () => {
  it.each([
    [readReportStdin, ["a", Buffer.from("b")], "ab"],
    [readInspectStdin, [], ""]
  ])("concatenates stdin chunks", async (read, input, expected) => {
    await expect(read(chunks(...input))).resolves.toBe(expected);
  });

  it("renders a valid report", async () => {
    await renderFromStdin(chunks(' {"summary":{},"workspaces":[]} '));

    expect(process.stdout.write).toHaveBeenCalledWith(
      expect.stringContaining("Exit code: 0")
    );
  });

  it("exits for whitespace-only report input", async () => {
    const exit = vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`exit:${code}`);
    });

    await expect(renderFromStdin(chunks(" \n "))).rejects.toThrow("exit:1");
    expect(process.stderr.write).toHaveBeenCalledWith(
      "render-check-report: empty stdin\n"
    );

    exit.mockRestore();
  });

  it("propagates report parsing failures", async () => {
    await expect(renderFromStdin(chunks("not-json"))).rejects.toThrow();
  });

  it("writes the inspection envelope", async () => {
    await inspectAfterTool(chunks("not json"));

    expect(process.stdout.write).toHaveBeenCalledWith(
      `${JSON.stringify({
        hookSpecificOutput: {
          additionalContext: "",
          hookEventName: "PostToolUse",
          resultsFile: null
        }
      })}\n`
    );
  });
});
