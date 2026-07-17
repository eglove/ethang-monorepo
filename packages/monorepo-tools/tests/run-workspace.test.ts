import { Effect } from "effect";
import process from "node:process";
import { describe, expect, it, vi } from "vitest";

const { execFile, runAutofix } = vi.hoisted(() => {
  return { execFile: vi.fn(), runAutofix: vi.fn() };
});

vi.mock(import("node:child_process"), async (importOriginal) => {
  const actual = await importOriginal();
  const mocked = { ...actual };
  Object.defineProperty(mocked, "execFile", { value: execFile });
  return mocked;
});
vi.mock(import("../src/application/run-autofix.ts"), async (importOriginal) => {
  return { ...(await importOriginal()), runAutofix };
});

import isEmpty from "lodash/isEmpty.js";

import {
  main,
  packageManagerExecutable,
  parseArguments,
  runMainFromProcess,
  runWorkspace,
  toTscResult,
  toVitestResult
} from "../src/cli/run-workspace.cli.ts";

const WORKSPACE = "workspace";
const REPO = "repo";
const CWD_ARGUMENT = ["--cwd", REPO] as const;
const SKIP_CHECKS_FLAG = "--skip-checks";
const SKIP_TSC_AND_TEST = "tsc,test";
const RUN_TEST_FLAG = "--test";
const ALL_CHECK_NAMES = ["lint", "tsc", "test"] as const;
const SELECTED_TEST_FILE = "tests/a.test.ts";
const SUCCESS_REPORT = '{"success":true}';

const cleanPayload = {
  cwd: WORKSPACE,
  files: [],
  results: []
};

const command = (
  overrides?: Partial<{ exitCode: number; stderr: string; stdout: string }>
) => {
  return {
    exitCode: overrides?.exitCode ?? 0,
    stderr: overrides?.stderr ?? "",
    stdout: overrides?.stdout ?? ""
  };
};

vi.spyOn(process.stdout, "write").mockReturnValue(true);
vi.spyOn(process.stderr, "write").mockReturnValue(true);

describe(packageManagerExecutable, () => {
  it.each([
    ["win32", "pnpm.cmd"],
    ["linux", "pnpm"]
  ])("returns %s's package-manager executable", (platform, executable) => {
    expect(packageManagerExecutable(platform)).toBe(executable);
  });
});

describe(parseArguments, () => {
  it.each([
    ["--help", 0],
    ["-h", 0],
    ["", 1],
    ["--files", 1],
    ["--checks", 1],
    ["--unknown", 1]
  ])("exits for terminal argument %j", (argument, code) => {
    const exit = vi.spyOn(process, "exit").mockImplementation((value) => {
      throw new Error(`exit:${value}`);
    });

    expect(() => {
      return parseArguments([argument]);
    }).toThrow(`exit:${code}`);

    exit.mockRestore();
  });

  it.each([
    [
      ["--cwd", REPO],
      {
        checks: [...ALL_CHECK_NAMES],
        cwd: REPO,
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
        REPO
      ],
      {
        checks: ["lint", "test"],
        cwd: REPO,
        files: ["a.ts"],
        fix: true,
        targetedFiles: ["src/a.ts"],
        testFiles: ["a.test.ts"]
      }
    ],
    [
      [...CWD_ARGUMENT, SKIP_CHECKS_FLAG, SKIP_TSC_AND_TEST, RUN_TEST_FLAG],
      {
        checks: [ALL_CHECK_NAMES[0], ALL_CHECK_NAMES[2]],
        cwd: REPO,
        files: [],
        fix: false,
        targetedFiles: [],
        testFiles: []
      }
    ]
  ])("parses reachable option states %j", (argv, expected) => {
    expect(parseArguments(argv)).toStrictEqual(expected);
  });

  it.each([
    ["--lint", ["lint", "tsc", "test"]],
    ["--test", ["lint", "tsc", "test"]],
    ["--tsc", ["lint", "tsc", "test"]],
    ["--no-lint", ["tsc", "test"]],
    ["--no-test", ["lint", "tsc"]],
    ["--no-tsc", ["lint", "test"]]
  ])("parses single toggle %s", (flag, checks) => {
    expect(parseArguments(["--cwd", REPO, flag]).checks).toStrictEqual(checks);
  });
});

describe(toTscResult, () => {
  it("projects every supported TypeScript diagnostic severity", () => {
    expect(
      toTscResult(
        command({
          exitCode: 1,
          stderr: "b.ts(2,3): warning TS2: warning text",
          stdout:
            "a.ts(1,2): error TS1: error text\nc.ts(3,4): info TS3: info text\ninvalid.ts(unknown,4): error TS4: ignored"
        })
      )
    ).toStrictEqual({
      diagnostics: [
        {
          code: "TS1",
          column: 2,
          file: "a.ts",
          line: 1,
          message: "error text",
          severity: "error"
        },
        {
          code: "TS3",
          column: 4,
          file: "c.ts",
          line: 3,
          message: "info text",
          severity: "info"
        },
        {
          code: "TS2",
          column: 3,
          file: "b.ts",
          line: 2,
          message: "warning text",
          severity: "warning"
        }
      ],
      errorCount: 1,
      exitCode: 1,
      passed: false,
      ran: true,
      scopedDiagnostics: false,
      warningCount: 1
    });
  });

  it("filters scoped diagnostics while retaining total counts", () => {
    expect(
      toTscResult(
        command({
          exitCode: 1,
          stdout:
            "src/a.ts(1,2): error TS1: first\nsrc/b.ts(3,4): warning TS2: second"
        }),
        ["src/b.ts"]
      )
    ).toStrictEqual({
      diagnostics: [
        {
          code: "TS2",
          column: 4,
          file: "src/b.ts",
          line: 3,
          message: "second",
          severity: "warning"
        }
      ],
      errorCount: 1,
      exitCode: 1,
      passed: false,
      ran: true,
      scopedDiagnostics: true,
      warningCount: 1
    });
  });

  it("passes a clean successful compiler command", () => {
    expect(toTscResult(command())).toMatchObject({
      diagnostics: [],
      errorCount: 0,
      passed: true,
      warningCount: 0
    });
  });
});

describe(toVitestResult, () => {
  it("projects failed assertions and all report totals", () => {
    expect(
      toVitestResult(
        command({
          stdout:
            '{"numFailedTests":1,"numPassedTests":2,"numSkippedTests":3,"numTodoTests":4,"numTotalTests":10,"success":false,"testResults":[{"name":"a.test.ts","assertionResults":[{"ancestorTitles":["suite"],"duration":7,"failureMessages":["failed"],"status":"failed","title":"case"},{"status":"passed","title":"pass"}]}]}'
        }),
        ["a.test.ts"],
        false
      )
    ).toStrictEqual({
      exitCode: 0,
      failingTests: [
        {
          durationMs: 7,
          failureMessages: ["failed"],
          file: "a.test.ts",
          name: "suite > case"
        }
      ],
      parseError: null,
      passed: false,
      ran: true,
      ranFullWorkspace: false,
      scopedToTestFiles: ["a.test.ts"],
      totals: { failed: 1, passed: 2, skipped: 3, todo: 4, total: 10 }
    });
  });

  it("accepts newline-delimited reports with omitted optional result fields", () => {
    expect(
      toVitestResult(
        command({
          stdout:
            'not json\n{"success":true,"testResults":[{"name":"a.test.ts"}]}'
        })
      )
    ).toMatchObject({
      failingTests: [],
      parseError: null,
      passed: true,
      totals: { failed: 0, passed: 0, skipped: 0, todo: 0, total: 0 }
    });
  });

  it("defaults omitted failed assertion metadata", () => {
    expect(
      toVitestResult(
        command({
          stdout:
            '{"testResults":[{"name":"a.test.ts","assertionResults":[{"status":"failed","title":"case"}]}]}'
        })
      )
    ).toMatchObject({
      failingTests: [
        {
          durationMs: 0,
          failureMessages: [],
          file: "a.test.ts",
          name: "case"
        }
      ]
    });
  });

  it.each([
    [0, "", true, [], 0],
    [1, "configuration failed", false, ["configuration failed"], 1]
  ])(
    "handles a report-free command exit %i",
    (exitCode, stderr, passed, failureMessages, failed) => {
      expect(toVitestResult(command({ exitCode, stderr }))).toMatchObject({
        failingTests: isEmpty(failureMessages)
          ? []
          : [
              {
                failureMessages,
                name: "vitest did not produce JSON output"
              }
            ],
        parseError: "Vitest did not produce a JSON report",
        passed,
        totals: { failed }
      });
    }
  );
});

describe(runWorkspace, () => {
  const runner = (tsc = command(), test = command()) => {
    return {
      run: vi
        .fn()
        .mockReturnValueOnce(Effect.succeed(tsc))
        .mockReturnValueOnce(Effect.succeed(test))
    };
  };

  it.each([
    [
      true,
      ["a.ts"],
      {
        byFile: [],
        byRule: [],
        fixedErrorCount: 0,
        fixedWarningCount: 0,
        unfixableButFixableCount: 0
      }
    ],
    [false, [], null]
  ])("runs lint with isFix=%s and files=%j", async (fix, files, autofix) => {
    runAutofix.mockReturnValueOnce(Effect.succeed(cleanPayload));
    const workspaceRunner = runner(
      command(),
      command({ stdout: SUCCESS_REPORT })
    );

    const result = await Effect.runPromise(
      runWorkspace(
        {
          checks: [...ALL_CHECK_NAMES],
          cwd: WORKSPACE,
          files,
          fix,
          targetedFiles: [],
          testFiles: []
        },
        workspaceRunner
      )
    );

    expect(runAutofix).toHaveBeenCalledWith({
      cwd: WORKSPACE,
      files: isEmpty(files) ? ["."] : files,
      fix
    });
    expect(runAutofix).toHaveBeenCalledWith({
      cwd: WORKSPACE,
      files: isEmpty(files) ? ["."] : files,
      fix
    });
    expect(result).toMatchObject({
      lint: { autofix, durationMs: expect.any(Number) },
      test: { durationMs: expect.any(Number) },
      tsc: { durationMs: expect.any(Number) }
    });
    expect(workspaceRunner.run).toHaveBeenNthCalledWith(1, {
      arguments: ["exec", "tsc", "--noEmit", "--pretty", "false"],
      cwd: WORKSPACE
    });
    expect(workspaceRunner.run).toHaveBeenNthCalledWith(2, {
      arguments: [
        "exec",
        "vitest",
        "run",
        "--reporter=json",
        "--coverage=false"
      ],
      cwd: WORKSPACE
    });
  });

  it("supports explicit vitest file selection and skipped checks", async () => {
    const workspaceRunner = {
      run: vi
        .fn()
        .mockReturnValueOnce(
          Effect.succeed(command({ stdout: SUCCESS_REPORT }))
        )
    };

    const result = await Effect.runPromise(
      runWorkspace(
        {
          checks: ["test"],
          cwd: WORKSPACE,
          files: [],
          fix: false,
          targetedFiles: [],
          testFiles: [SELECTED_TEST_FILE]
        },
        workspaceRunner
      )
    );

    expect(workspaceRunner.run).toHaveBeenCalledWith({
      arguments: [
        "exec",
        "vitest",
        "run",
        "--reporter=json",
        "--coverage=false",
        SELECTED_TEST_FILE
      ],
      cwd: WORKSPACE
    });
    expect(result).toMatchObject({
      lint: { exitCode: -1, ran: false },
      test: {
        ran: true,
        ranFullWorkspace: false,
        scopedToTestFiles: [SELECTED_TEST_FILE]
      },
      tsc: { exitCode: -1, ran: false }
    });
  });

  it("projects post-fix lint errors and warnings", async () => {
    runAutofix.mockReturnValueOnce(
      Effect.succeed({
        ...cleanPayload,
        results: [
          {
            filePath: "a.ts",
            postFixMessages: [
              {
                column: 1,
                fixable: true,
                line: 2,
                message: "error",
                ruleId: "error-rule",
                severity: 2
              },
              {
                column: 3,
                fixable: true,
                line: 4,
                message: "warning",
                ruleId: "warning-rule",
                severity: 1
              }
            ],
            preFixMessages: []
          }
        ]
      })
    );

    const result = await Effect.runPromise(
      runWorkspace(
        {
          checks: [...ALL_CHECK_NAMES],
          cwd: WORKSPACE,
          files: ["a.ts"],
          fix: false,
          targetedFiles: [],
          testFiles: []
        },
        runner(command(), command({ stdout: SUCCESS_REPORT }))
      )
    );

    expect(result.lint).toMatchObject({
      autofix: null,
      errorCount: 1,
      exitCode: 0,
      fixableErrorCount: 1,
      fixableWarningCount: 1,
      passed: false,
      warningCount: 1
    });
    expect(result.lint.issues).toHaveLength(2);
  });

  it("converts a lint infrastructure failure into a visible lint issue", async () => {
    runAutofix.mockReturnValueOnce(Effect.fail(new Error("unavailable")));

    const result = await Effect.runPromise(
      runWorkspace(
        {
          checks: [...ALL_CHECK_NAMES],
          cwd: WORKSPACE,
          files: ["a.ts"],
          fix: false,
          targetedFiles: [],
          testFiles: []
        },
        runner(command(), command({ stdout: SUCCESS_REPORT }))
      )
    );

    expect(result.lint).toMatchObject({
      autofix: null,
      errorCount: 1,
      exitCode: 1,
      passed: false,
      warningCount: 0
    });
    expect(result.lint.issues[0]?.message).toContain("unavailable");
  });
});

describe(main, () => {
  it("runs the default subprocess adapter and writes its result", async () => {
    runAutofix.mockReturnValueOnce(Effect.succeed(cleanPayload));
    execFile.mockImplementation((_file, arguments_, _options, callback) => {
      const stdout =
        Array.isArray(arguments_) && arguments_.includes("vitest")
          ? SUCCESS_REPORT
          : "";
      callback(null, stdout, "");
    });

    await main(["--cwd", WORKSPACE]);

    expect(execFile).toHaveBeenCalledTimes(2);
    expect(process.stdout.write).toHaveBeenCalledWith(
      expect.stringContaining(`"cwd":"${WORKSPACE}"`)
    );
  });

  it("exits when a subprocess reports a failed check", async () => {
    runAutofix.mockReturnValueOnce(Effect.succeed(cleanPayload));
    execFile.mockImplementation((_file, arguments_, _options, callback) => {
      callback(
        new Error("failed"),
        Array.isArray(arguments_) && arguments_.includes("vitest")
          ? SUCCESS_REPORT
          : "",
        "failed"
      );
    });
    const exit = vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`exit:${code}`);
    });

    await expect(main(["--cwd", WORKSPACE])).rejects.toThrow("exit:1");

    exit.mockRestore();
  });

  it("propagates process-launch failures", async () => {
    runAutofix.mockReturnValueOnce(Effect.succeed(cleanPayload));
    execFile.mockImplementation(() => {
      throw new Error("pnpm unavailable");
    });

    await expect(main(["--cwd", WORKSPACE])).rejects.toThrow(
      "pnpm unavailable"
    );
  });

  it("writes output and exits when a subprocess reports a failed check", async () => {
    const exit = vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`exit:${code}`);
    });

    runAutofix.mockReturnValueOnce(Effect.succeed(cleanPayload));
    execFile
      .mockImplementationOnce((_, __, ___, callback) => {
        callback(null, "", "a.ts(1,1): error TS1: broken");
      })
      .mockImplementationOnce((_, __, ___, callback) => {
        callback(null, SUCCESS_REPORT, "");
      });

    await expect(main(["--cwd", WORKSPACE])).rejects.toThrow("exit:1");
    expect(process.stdout.write).toHaveBeenCalledWith(
      expect.stringContaining('"passed":false')
    );

    exit.mockRestore();
  });

  it("main skips exit when all checks are disabled", async () => {
    const exit = vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`exit:${code}`);
    });

    await expect(
      main(["--cwd", WORKSPACE, SKIP_CHECKS_FLAG, "lint,tsc,test"])
    ).resolves.toBeUndefined();
    expect(exit).not.toHaveBeenCalled();

    exit.mockRestore();
  });

  it("runs the process entry helper with supplied arguments", async () => {
    await expect(
      runMainFromProcess([
        "--cwd",
        WORKSPACE,
        SKIP_CHECKS_FLAG,
        "lint,tsc,test"
      ])
    ).resolves.toBeUndefined();
  });
});

describe("coverage helpers", () => {
  const makeRunner = (...results: ReturnType<typeof command>[]) => {
    let index = 0;
    return {
      run: vi.fn().mockImplementation(() => {
        const next = results[index];
        index += 1;
        return Effect.succeed(next ?? command());
      })
    };
  };

  it.each([
    [
      ["lint", "tsc", "test", "lint"],
      ["lint", "tsc", "test"]
    ],
    [[], []]
  ])("deduplicates checks %j", (checks, expected) => {
    expect(
      parseArguments(["--cwd", REPO, "--checks", checks.join(",")]).checks
    ).toStrictEqual(expected);
  });

  it("keeps all checks when skipping nothing", () => {
    expect(
      parseArguments(["--cwd", REPO, SKIP_CHECKS_FLAG, ""]).checks
    ).toStrictEqual(["lint", "tsc", "test"]);
  });

  it("writes usage for help", () => {
    const writeSpy = vi
      .spyOn(process.stdout, "write")
      .mockReturnValueOnce(true);
    const exitSpy = vi.spyOn(process, "exit").mockImplementationOnce(((
      code?: number
    ) => {
      throw new Error(`exit:${code ?? 0}`);
    }) as never);

    const beforeWriteCount = writeSpy.mock.calls.length;

    expect(() => {
      parseArguments(["--help"]);
    }).toThrow("exit:0");
    expect(writeSpy).toHaveBeenCalledTimes(beforeWriteCount + 1);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it.each([
    [["lint", "tsc", "test"], { lint: true, test: true, tsc: true }],
    [["tsc"], { lint: false, test: false, tsc: true }]
  ])("projects disabled checks for %j", async (checks, expected) => {
    runAutofix.mockReturnValueOnce(Effect.succeed(cleanPayload));

    const result = await Effect.runPromise(
      runWorkspace(
        {
          checks: checks as readonly ("lint" | "test" | "tsc")[],
          cwd: WORKSPACE,
          files: [],
          fix: false,
          targetedFiles: [],
          testFiles: []
        },
        makeRunner(command(), command({ stdout: SUCCESS_REPORT }))
      )
    );

    expect(result.lint.ran).toBe(expected.lint);
    expect(result.tsc.ran).toBe(expected.tsc);
    expect(result.test.ran).toBe(expected.test);
  });
});
