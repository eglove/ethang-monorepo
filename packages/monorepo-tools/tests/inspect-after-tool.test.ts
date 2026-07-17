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

const editedFilePayload = JSON.stringify({
  cwd: REPO_ROOT,
  toolArgs: { file_path: "src/example.ts" },
  toolName: "edit"
});

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
  it.each(["", "not json", JSON.stringify({ toolName: "edit" })])(
    "returns an empty envelope for ignored or invalid stdin payload %j",
    (stdinPayload) => {
      const dependencies = makeDependencies();

      expect(
        Effect.runSync(inspectAfterTool({ dependencies, stdinPayload }))
      ).toStrictEqual(EMPTY_ENVELOPE);
      expect(dependencies.applyEslintFix).not.toHaveBeenCalled();
      expect(dependencies.loadFileProblems).not.toHaveBeenCalled();
    }
  );

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
        inspectAfterTool({ dependencies, stdinPayload: editedFilePayload })
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
          inspectAfterTool({ dependencies, stdinPayload: editedFilePayload })
        )
      ).resolves.toStrictEqual(EMPTY_ENVELOPE);
    }
  );
});
