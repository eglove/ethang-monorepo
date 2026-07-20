import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import {
  inspectAfterTool,
  type InspectAfterToolDependencies
} from "../src/application/inspect-after-tool.ts";

const REPO_ROOT = "C:/repo";

const makeDependencies = (
  overrides: Partial<InspectAfterToolDependencies> = {}
) => {
  return {
    applyEslintFix:
      overrides.applyEslintFix ??
      vi.fn(() => Effect.void),
    fallbackCwd: overrides.fallbackCwd ?? REPO_ROOT,
    loadFileProblems:
      overrides.loadFileProblems ??
      vi.fn(() =>
        Effect.succeed({
          errors: [],
          messagePath: "/messages/test"
        })
      )
  };
};

describe(inspectAfterTool, () => {
  it("returns an empty string when file is clean (no lint issues, no inspections)", async () => {
    const dependencies = makeDependencies();
    await expect(
      Effect.runPromise(
        inspectAfterTool({
          cwd: REPO_ROOT,
          dependencies,
          filePath: "src/example.ts"
        })
      )
    ).resolves.toBe("");
    expect(dependencies.applyEslintFix).toHaveBeenCalledWith({
      cwd: REPO_ROOT,
      files: ["C:/repo/src/example.ts"]
    });
    expect(dependencies.loadFileProblems).toHaveBeenCalledWith({
      filePath: "src/example.ts",
      projectPath: REPO_ROOT
    });
  });

  it("returns WebStorm inspection markdown when MCP reports errors", async () => {
    const dependencies = makeDependencies({
      loadFileProblems: vi.fn(() =>
        Effect.succeed({
          errors: [
            {
              column: 4,
              description: " Suspicious   usage ",
              inspectionId: "ExampleInspection",
              line: 8,
              severity: "warning"
            }
          ],
          messagePath: "/messages/test"
        })
      )
    });

    await expect(
      Effect.runPromise(
        inspectAfterTool({
          cwd: REPO_ROOT,
          dependencies,
          filePath: "src/example.ts"
        })
      )
    ).resolves.toContain(
      "- [WARNING] `ExampleInspection` at L8:C4 — Suspicious usage"
    );
  });

  it("normalizes absolute paths that already start with repoRoot", async () => {
    const dependencies = makeDependencies();
    await Effect.runPromise(
      inspectAfterTool({
        cwd: REPO_ROOT,
        dependencies,
        filePath: "C:/repo/src/example.ts"
      })
    );
    expect(dependencies.applyEslintFix).toHaveBeenCalledWith({
      cwd: REPO_ROOT,
      files: ["C:/repo/src/example.ts"]
    });
    expect(dependencies.loadFileProblems).toHaveBeenCalledWith({
      filePath: "src/example.ts",
      projectPath: REPO_ROOT
    });
  });

  it.each(["lint", "inspection"] as const)(
    "returns an empty string when the %s operation fails",
    async (failure) => {
      const deps = {
        inspection: () =>
          makeDependencies({
            loadFileProblems: vi.fn(() =>
              Effect.die(new Error("MCP unavailable"))
            )
          }),
        lint: () =>
          makeDependencies({
            applyEslintFix: vi.fn(() =>
              Effect.fail(new Error("lint unavailable"))
            )
          })
      };
      await expect(
        Effect.runPromise(
          inspectAfterTool({
            cwd: REPO_ROOT,
            dependencies: deps[failure](),
            filePath: "src/example.ts"
          })
        )
      ).resolves.toBe("");
    }
  );
});
