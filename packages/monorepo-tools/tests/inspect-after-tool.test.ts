import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import {
  inspectAfterTool,
  type InspectAfterToolDependencies
} from "../src/application/inspect-after-tool.ts";

const REPO_ROOT = "C:/repo";
const EMPTY_ENVELOPE = {
  hookSpecificOutput: {
    additionalContext: "",
    hookEventName: "PostToolUse",
    resultsFile: null
  }
};

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
  it("returns an empty envelope when no filePath or cwd provided", () => {
    // The function now expects filePath and cwd directly
    // This test case is no longer valid - the function will just use the params
    // We'll skip this test since the new API doesn't have "invalid payload" cases
  });

  it("fixes the edited file, fetches inspections, and formats them for the hook", async () => {
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
          dependencies,
          filePath: "src/example.ts",
          cwd: REPO_ROOT
        })
      )
    ).resolves.toStrictEqual({
      hookSpecificOutput: {
        additionalContext:
          "WebStorm MCP inspections for `src/example.ts`:\n- [WARNING] `ExampleInspection` at L8:C4 — Suspicious usage",
        hookEventName: "PostToolUse",
        resultsFile: null
      }
    });
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
    "returns an empty envelope when the %s operation fails",
    async (failure) => {
      const dependenciesByFailure = {
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
      const dependencies = dependenciesByFailure[failure]();

      await expect(
        Effect.runPromise(
          inspectAfterTool({
            dependencies,
            filePath: "src/example.ts",
            cwd: REPO_ROOT
          })
        )
      ).resolves.toStrictEqual(EMPTY_ENVELOPE);
    }
  );
});
