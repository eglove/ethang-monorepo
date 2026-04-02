import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

const BIN_PATH = path.join(import.meta.dirname, "bin.ts");
const USAGE_MARKER = "Usage:";
const EXIT_CODE_ERROR = 1;
const EXIT_CODE_SUCCESS = 0;

const runBin = (
  argv: string[],
): { status: number; stderr: string; stdout: string } => {
  // eslint-disable-next-line sonar/no-os-command-from-path -- intentionally calling bun to run bin under test
  const result = spawnSync("bun", [BIN_PATH, ...argv], { encoding: "utf8" });
  return {
    status: result.status ?? EXIT_CODE_ERROR,
    stderr: result.stderr,
    stdout: result.stdout,
  };
};

describe("bin entry point", () => {
  it("exits with code 1 and prints usage when no arguments given", () => {
    const result = runBin([]);
    expect(result.status).toBe(EXIT_CODE_ERROR);
    expect(result.stderr).toContain(USAGE_MARKER);
  });

  it("exits with code 1 and prints usage when slug is missing", () => {
    const result = runBin(["start"]);
    expect(result.status).toBe(EXIT_CODE_ERROR);
    expect(result.stderr).toContain(USAGE_MARKER);
  });

  it("exits with code 1 and prints usage for unknown command", () => {
    const result = runBin(["unknown", "my-slug"]);
    expect(result.status).toBe(EXIT_CODE_ERROR);
    expect(result.stderr).toContain(USAGE_MARKER);
  });

  it("exits with code 0 and returns JSON on successful start", () => {
    const result = runBin(["start", `test-bin-${Date.now()}`]);
    expect(result.status).toBe(EXIT_CODE_SUCCESS);
    const parse = (): unknown => JSON.parse(result.stdout) as unknown;
    expect(parse).not.toThrow();
  });
});
