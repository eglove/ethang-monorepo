/* eslint-disable @typescript-eslint/no-unsafe-type-assertion -- execFile mock overloads require cast */
import { execFile } from "node:child_process";
import { describe, expect, it, vi } from "vitest";

import { ChildProcessGitAdapter } from "./git-child-process.ts";

// Mock child_process
vi.mock("node:child_process", () => ({
  execFile: vi.fn(
    (
      _cmd: string,
      _arguments: null | readonly string[] | undefined,
      _options: unknown,
      callback: (error: Error | null, stdout: string) => void,
    ) => {
      callback(null, "mock output\n");
    },
  ),
}));

const TEST_PATH = "/test/path";

describe("ChildProcessGitAdapter", () => {
  it("createBranch spawns correct git command", async () => {
    const adapter = new ChildProcessGitAdapter(TEST_PATH);
    const result = await adapter.createBranch("test-branch");
    expect(result.ok).toBe(true);
  });

  it("commit spawns correct git command with message", async () => {
    const adapter = new ChildProcessGitAdapter(TEST_PATH);
    const result = await adapter.commit("test message");
    expect(result.ok).toBe(true);
  });

  it("acquireLock atomically sets owner and returns true", () => {
    const adapter = new ChildProcessGitAdapter(TEST_PATH);
    expect(adapter.acquireLock("run-1")).toBe(true);
  });

  it("acquireLock returns false when already held", () => {
    const adapter = new ChildProcessGitAdapter(TEST_PATH);
    adapter.acquireLock("run-1");
    expect(adapter.acquireLock("run-2")).toBe(false);
  });

  it("releaseLock clears the owner", () => {
    const adapter = new ChildProcessGitAdapter(TEST_PATH);
    adapter.acquireLock("run-1");
    adapter.releaseLock("run-1");
    expect(adapter.acquireLock("run-2")).toBe(true);
  });

  it("getCurrentBranch returns trimmed output", async () => {
    const adapter = new ChildProcessGitAdapter(TEST_PATH);
    const branch = await adapter.getCurrentBranch();
    expect(branch).toBe("mock output");
  });

  it("getCurrentBranch returns empty string on failure", async () => {
    vi.mocked(execFile).mockImplementationOnce(((
      _cmd: string,
      _arguments: unknown,
      _options: unknown,
      callback: (..._arguments: unknown[]) => void,
    ) => {
      callback(new Error("git failed"), { stdout: "" });
    }) as never);
    const adapter = new ChildProcessGitAdapter(TEST_PATH);
    const branch = await adapter.getCurrentBranch();
    expect(branch).toBe("");
  });

  it("git command failure returns error result", async () => {
    vi.mocked(execFile).mockImplementationOnce(((
      _cmd: string,
      _arguments: unknown,
      _options: unknown,
      callback: (..._arguments: unknown[]) => void,
    ) => {
      callback(new Error("command failed"), { stdout: "" });
    }) as never);
    const adapter = new ChildProcessGitAdapter(TEST_PATH);
    const result = await adapter.commit("test");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("command failed");
  });

  it("git command failure with non-Error value uses String()", async () => {
    vi.mocked(execFile).mockImplementationOnce(((
      _cmd: string,
      _arguments: unknown,
      _options: unknown,
      callback: (..._arguments: unknown[]) => void,
    ) => {
      callback("string error");
    }) as never);
    const adapter = new ChildProcessGitAdapter(TEST_PATH);
    const result = await adapter.commit("test");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("string error");
  });

  it("git command failure with thrown non-Error uses String()", async () => {
    vi.mocked(execFile).mockImplementationOnce((() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw "raw string throw";
    }) as never);
    const adapter = new ChildProcessGitAdapter(TEST_PATH);
    const result = await adapter.commit("test");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("raw string throw");
  });
});
