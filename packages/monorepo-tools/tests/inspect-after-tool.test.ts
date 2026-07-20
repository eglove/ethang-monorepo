import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import {
  inspectAfterTool,
  type InspectAfterToolDependencies
} from "../src/application/inspect-after-tool.ts";

const REPO_ROOT = "C:/repo";
const SAMPLE_REL_PATH = "src/example.ts";
const SAMPLE_ABS_PATH = `${REPO_ROOT}/${SAMPLE_REL_PATH}`;

const makeDependencies = (
  overrides: Partial<InspectAfterToolDependencies> = {}
) => {
  return {
    applyEslintFix:
      overrides.applyEslintFix ??
      vi.fn(() => {
        return Effect.void;
      }),
    fallbackCwd: overrides.fallbackCwd ?? REPO_ROOT,
    loadFileProblems:
      overrides.loadFileProblems ??
      vi.fn(() => {
        return Effect.succeed({
          errors: [],
          messagePath: "/messages/test"
        });
      })
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
          filePath: SAMPLE_REL_PATH
        })
      )
    ).resolves.toBe("");

    expect(dependencies.applyEslintFix).toHaveBeenCalledWith({
      cwd: REPO_ROOT,
      files: [SAMPLE_ABS_PATH]
    });
    expect(dependencies.loadFileProblems).toHaveBeenCalledWith({
      filePath: SAMPLE_REL_PATH,
      projectPath: REPO_ROOT
    });
  });

  it("returns WebStorm inspection markdown when MCP reports errors", async () => {
    const dependencies = makeDependencies({
      loadFileProblems: vi.fn(() => {
        return Effect.succeed({
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
        });
      })
    });

    await expect(
      Effect.runPromise(
        inspectAfterTool({
          cwd: REPO_ROOT,
          dependencies,
          filePath: SAMPLE_REL_PATH
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
        filePath: SAMPLE_ABS_PATH
      })
    );

    expect(dependencies.applyEslintFix).toHaveBeenCalledWith({
      cwd: REPO_ROOT,
      files: [SAMPLE_ABS_PATH]
    });
    expect(dependencies.loadFileProblems).toHaveBeenCalledWith({
      filePath: SAMPLE_REL_PATH,
      projectPath: REPO_ROOT
    });
  });

  it.each(["lint", "inspection"] as const)(
    "returns an empty string when the %s operation fails",
    async (failure) => {
      const dependenciesForFailure = {
        inspection: () => {
          return makeDependencies({
            loadFileProblems: vi.fn(() => {
              return Effect.die(new Error("MCP unavailable"));
            })
          });
        },
        lint: () => {
          return makeDependencies({
            applyEslintFix: vi.fn(() => {
              return Effect.fail(new Error("lint unavailable"));
            })
          });
        }
      };

      await expect(
        Effect.runPromise(
          inspectAfterTool({
            cwd: REPO_ROOT,
            dependencies: dependenciesForFailure[failure](),
            filePath: SAMPLE_REL_PATH
          })
        )
      ).resolves.toBe("");
    }
  );
});
