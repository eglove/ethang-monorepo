import { Effect } from "effect";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { describe, expect, it, vi } from "vitest";

import {
  buildCliArguments,
  discoverWorkspaces,
  failedWorkspaceReport,
  findTestSiblings,
  main,
  parseArguments,
  resolveFileTargets,
  runWithThrottle,
  runWorkspace,
  testSiblingsInWorkspace,
  toWorkspaceReport,
  writeProgress
} from "../src/cli/repo-ai-check.cli.ts";

const { join } = path;
const ARG_FORMAT = "--format";
const ARG_TIMEOUT = "--timeout-seconds";
const ARG_WORKSPACE = "--workspace";
const PACKAGE_JSON = "package.json";
const SOURCE_FILE = "src/a.ts";

const workspace = (name: string, workspacePath: string) => {
  return {
    hasLint: true,
    hasTest: true,
    hasTsconfig: true,
    name,
    path: workspacePath,
    relativePath: `packages/${name}`,
    type: "package" as const
  };
};

describe("repo-ai-check argument parsing", () => {
  it.each([
    [
      [
        "--throttle",
        "2",
        ARG_TIMEOUT,
        "60",
        ARG_WORKSPACE,
        "alpha,beta",
        "--file",
        SOURCE_FILE,
        "--skip-fix",
        ARG_FORMAT,
        "Json"
      ],
      {
        files: [SOURCE_FILE],
        format: "Json",
        skipFix: true,
        throttle: 2,
        timeoutSeconds: 60,
        workspaces: ["alpha", "beta"]
      }
    ],
    [
      [],
      {
        files: [],
        format: "Markdown",
        skipFix: false,
        throttle: 1,
        timeoutSeconds: 600,
        workspaces: []
      }
    ]
  ])("parses CLI state %j", (argv, expected) => {
    expect(parseArguments(argv)).toStrictEqual(expected);
  });

  it("skips an absent runtime argument", () => {
    expect(parseArguments(Array.from({ length: 1 }))).toMatchObject({
      format: "Markdown"
    });
  });

  it.each([
    [["--throttle", "0"], "--throttle must be a positive integer"],
    [[ARG_TIMEOUT, "nope"], "--timeout-seconds must be a positive integer"],
    [[ARG_FORMAT, "XML"], "--format must be Json or Markdown"],
    [["--unknown"], "Unknown argument: --unknown"],
    [["--file"], "Missing value after --file"]
  ])("rejects invalid CLI state %j", (argv, message) => {
    expect(() => {
      return parseArguments(argv);
    }).toThrow(message);
  });
});

describe("repo-ai-check target mapping", () => {
  const root = String.raw`C:\repo`;
  const workspaces = [
    workspace("alpha", String.raw`C:\repo\packages\alpha`),
    workspace("beta", String.raw`C:\repo\packages\beta`)
  ];

  it("preserves selected workspaces without file targets", () => {
    expect(resolveFileTargets([], root, workspaces, [])).toStrictEqual({
      selected: workspaces,
      targetsByWorkspace: new Map()
    });
  });

  it("maps files to their owning workspace and retains selected intersections", () => {
    expect(
      resolveFileTargets(
        [String.raw`C:\repo\packages\alpha\src\a.ts`],
        root,
        workspaces,
        ["alpha"]
      )
    ).toStrictEqual({
      selected: [workspaces[0]],
      targetsByWorkspace: new Map([["alpha", [SOURCE_FILE]]])
    });
  });

  it("chooses the deepest owner and deduplicates repeated targets", () => {
    const nested = workspace(
      "nested",
      String.raw`C:\repo\packages\alpha\nested`
    );
    const file = String.raw`C:\repo\packages\alpha\nested\src\a.ts`;

    expect(
      resolveFileTargets([file, file], root, [...workspaces, nested], [])
    ).toStrictEqual({
      selected: [nested],
      targetsByWorkspace: new Map([["nested", [SOURCE_FILE]]])
    });
  });

  it.each([
    [String.raw`C:\repo\other.ts`, [], "is not inside any workspace"],
    [
      String.raw`C:\repo\packages\beta\src\b.ts`,
      ["alpha"],
      "selected workspace"
    ]
  ])("rejects target %s outside scope", (file, selected, message) => {
    expect(() => {
      return resolveFileTargets([file], root, workspaces, selected);
    }).toThrow(message);
  });

  it("deduplicates sibling tests in the target directories", () => {
    const files = [
      String.raw`C:\repo\packages\alpha\src\a.ts`,
      String.raw`C:\repo\packages\alpha\src\b.ts`
    ];
    const listed = new Map([
      [
        String.raw`C:\repo\packages\alpha\src`,
        ["a.test.ts", "a.test.tsx", "readme.md"]
      ]
    ]);

    expect(
      findTestSiblings(files, (directory) => {
        return listed.get(directory) ?? [];
      })
    ).toStrictEqual([
      String.raw`C:\repo\packages\alpha\src\a.test.ts`,
      String.raw`C:\repo\packages\alpha\src\a.test.tsx`
    ]);
  });
});

describe("repo-ai-check execution helpers", () => {
  it("caps concurrent work at the requested throttle and preserves input order", async () => {
    let active = 0;
    let maximum = 0;
    const result = await runWithThrottle([1, 2, 3], 2, async (value) => {
      active += 1;
      maximum = Math.max(maximum, active);
      await Promise.resolve();
      active -= 1;
      return value * 2;
    });

    expect(result).toStrictEqual([2, 4, 6]);
    expect(maximum).toBe(2);
  });

  it("builds runner flags for default and file-scoped workspaces", () => {
    expect(
      buildCliArguments(
        workspace("alpha", String.raw`C:\repo\packages\alpha`),
        [],
        false,
        []
      )
    ).toStrictEqual([
      "--cwd",
      String.raw`C:\repo\packages\alpha`,
      "--files",
      '["."]',
      "--checks",
      "lint,tsc,test"
    ]);
    expect(
      buildCliArguments(
        workspace("alpha", String.raw`C:\repo\packages\alpha`),
        [SOURCE_FILE],
        true,
        ["src/a.test.ts"]
      )
    ).toStrictEqual([
      "--cwd",
      String.raw`C:\repo\packages\alpha`,
      "--files",
      '["src/a.ts"]',
      "--checks",
      "lint,tsc,test",
      "--fix",
      "--targeted-files",
      '["src/a.ts"]',
      "--test-files",
      '["src/a.test.ts"]'
    ]);
  });
});

describe("repo-ai-check workspace integration helpers", () => {
  const fixtureRoot = join(process.cwd(), ".repo-ai-check-fixture");

  it("discovers runnable workspaces and ignores files", () => {
    rmSync(fixtureRoot, { force: true, recursive: true });
    mkdirSync(join(fixtureRoot, "apps", "web"), { recursive: true });
    mkdirSync(join(fixtureRoot, "packages", "library"), { recursive: true });
    writeFileSync(
      join(fixtureRoot, "apps", "web", PACKAGE_JSON),
      JSON.stringify({ scripts: { lint: "eslint .", test: "vitest" } })
    );
    writeFileSync(join(fixtureRoot, "apps", "web", "tsconfig.json"), "{}");
    writeFileSync(
      join(fixtureRoot, "packages", "library", PACKAGE_JSON),
      JSON.stringify({ scripts: {} })
    );
    writeFileSync(join(fixtureRoot, "packages", "ignored.txt"), "ignored");
    try {
      expect(discoverWorkspaces(fixtureRoot)).toStrictEqual([
        {
          hasLint: true,
          hasTest: true,
          hasTsconfig: true,
          name: "web",
          path: join(fixtureRoot, "apps", "web"),
          relativePath: "apps/web",
          type: "app"
        },
        {
          hasLint: false,
          hasTest: false,
          hasTsconfig: false,
          name: "library",
          path: join(fixtureRoot, "packages", "library"),
          relativePath: "packages/library",
          type: "package"
        }
      ]);
    } finally {
      rmSync(fixtureRoot, { force: true, recursive: true });
    }
  });

  it("finds sibling test files from a workspace", () => {
    expect(
      testSiblingsInWorkspace(workspace("alpha", process.cwd()), [
        "tests/repo-ai-check.test.ts"
      ])
    ).toContain("tests/repo-ai-check.test.ts");
  });

  it("runs and parses a no-check workspace result", async () => {
    const result = await Effect.runPromise(
      runWorkspace(
        ["--cwd", process.cwd(), "--files", '["."]', "--checks", ""],
        30
      )
    );

    expect(result.lint.ran).toBe(false);
    expect(result.test.ran).toBe(false);
    expect(result.tsc.ran).toBe(false);
  });

  it("captures a runner failure with no JSON result", async () => {
    const outcome = await Effect.runPromiseExit(
      runWorkspace(["--unknown"], 30)
    );

    expect(outcome._tag).toBe("Failure");
  });

  it("creates reports for parsed and failed workspace runs", () => {
    const parsed = toWorkspaceReport(
      workspace("alpha", String.raw`C:\repo\alpha`),
      {
        lint: {
          autofix: null,
          errorCount: 0,
          fixableErrorCount: 0,
          fixableWarningCount: 0,
          issues: [],
          passed: true,
          ran: true,
          warningCount: 0
        },
        test: { failingTests: [], passed: true, ran: true },
        tsc: { errorCount: 0, passed: true, ran: true, warningCount: 0 }
      }
    );
    const failed = failedWorkspaceReport(
      workspace("alpha", String.raw`C:\repo\alpha`),
      new Error("boom")
    );

    expect(parsed.test.failedTests).toStrictEqual([]);
    expect(failed).toMatchObject({ error: "Error: boom", name: "alpha" });
  });

  it("writes progress only to stderr", () => {
    const stderr = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    try {
      writeProgress("checking");

      expect(stderr).toHaveBeenCalledWith("checking\n");
    } finally {
      stderr.mockRestore();
    }
  });

  it("emits an empty JSON report and progress for an unmatched workspace", async () => {
    const stderr = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    const stdout = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    try {
      await main([ARG_WORKSPACE, "does-not-exist", ARG_FORMAT, "Json"]);

      expect(stdout).toHaveBeenCalledWith(
        expect.stringContaining('"workspaces":[]')
      );
      expect(stderr).toHaveBeenCalledWith("All checks passed.\n");
    } finally {
      stderr.mockRestore();
      stdout.mockRestore();
    }
  });

  it("reports a workspace runner timeout as a failed check", async () => {
    const workspacePath = join(
      process.cwd(),
      "..",
      "..",
      "packages",
      ".checker-timeout"
    );
    mkdirSync(workspacePath, { recursive: true });
    writeFileSync(
      join(workspacePath, PACKAGE_JSON),
      JSON.stringify({
        scripts: { test: 'node -e "setTimeout(() => {}, 5000)"' }
      })
    );
    const stderr = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    const stdout = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    try {
      await main([
        ARG_WORKSPACE,
        ".checker-timeout",
        ARG_FORMAT,
        "Json",
        ARG_TIMEOUT,
        "1"
      ]);

      expect(stdout).toHaveBeenCalledWith(
        expect.stringContaining('"exitCode":1')
      );
      expect(stderr).toHaveBeenCalledWith("Checks failed.\n");
    } finally {
      rmSync(workspacePath, { force: true, recursive: true });
      stderr.mockRestore();
      stdout.mockRestore();
    }
  });

  it("runs a discovered no-check workspace and renders Markdown", async () => {
    const workspacePath = join(
      process.cwd(),
      "..",
      "..",
      "packages",
      ".checker-fixture"
    );
    mkdirSync(workspacePath, { recursive: true });
    writeFileSync(
      join(workspacePath, PACKAGE_JSON),
      JSON.stringify({ scripts: {} })
    );
    const stderr = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    const stdout = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    try {
      await main([
        ARG_WORKSPACE,
        ".checker-fixture",
        ARG_FORMAT,
        "Markdown",
        "--file",
        "packages/.checker-fixture/package.json",
        "--skip-fix"
      ]);

      expect(stdout).toHaveBeenCalledWith(
        expect.stringContaining("# Exit code: 0")
      );
      expect(stderr).toHaveBeenCalledWith("All checks passed.\n");
    } finally {
      rmSync(workspacePath, { force: true, recursive: true });
      stderr.mockRestore();
      stdout.mockRestore();
    }
  });
});
