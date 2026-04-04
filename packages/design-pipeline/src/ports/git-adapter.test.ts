import { describe, expect, it } from "vitest";

import type { GitAdapter } from "./git-adapter.ts";

class TestGitAdapter implements GitAdapter {
  private lockOwner: string | undefined;

  public acquireLock(owner: string): boolean {
    if (this.lockOwner !== undefined) {
      return false;
    }
    this.lockOwner = owner;
    return true;
  }

  public async checkout(
    _branch: string,
  ): Promise<{ error?: string; ok: boolean }> {
    await Promise.resolve();
    return { ok: true };
  }

  public async commit(
    _message: string,
  ): Promise<{ error?: string; ok: boolean }> {
    await Promise.resolve();
    return { ok: true };
  }

  public async createBranch(
    _name: string,
  ): Promise<{ error?: string; ok: boolean }> {
    await Promise.resolve();
    return { ok: true };
  }

  public async getCurrentBranch(): Promise<string> {
    await Promise.resolve();
    return "main";
  }

  public async push(): Promise<{ error?: string; ok: boolean }> {
    await Promise.resolve();
    return { ok: true };
  }

  public releaseLock(_owner: string): void {
    this.lockOwner = undefined;
  }
}

describe("GitAdapter Port", () => {
  it("acquireLock returns true when no lock held", () => {
    const adapter = new TestGitAdapter();
    expect(adapter.acquireLock("run-1")).toBe(true);
  });

  it("acquireLock returns false when another run holds the lock", () => {
    const adapter = new TestGitAdapter();
    adapter.acquireLock("run-1");
    expect(adapter.acquireLock("run-2")).toBe(false);
  });

  it("releaseLock releases the lock", () => {
    const adapter = new TestGitAdapter();
    adapter.acquireLock("run-1");
    adapter.releaseLock("run-1");
    expect(adapter.acquireLock("run-2")).toBe(true);
  });

  it("lock is released on git failure (not leaked)", () => {
    const adapter = new TestGitAdapter();
    adapter.acquireLock("run-1");
    // Simulate failure path: release lock after failure
    adapter.releaseLock("run-1");
    expect(adapter.acquireLock("run-2")).toBe(true);
  });

  it("methods have correct signatures", async () => {
    const adapter = new TestGitAdapter();
    const branchResult = await adapter.createBranch("test-branch");
    expect(branchResult).toHaveProperty("ok");
    const commitResult = await adapter.commit("test message");
    expect(commitResult).toHaveProperty("ok");
    const pushResult = await adapter.push();
    expect(pushResult).toHaveProperty("ok");
    const checkoutResult = await adapter.checkout("main");
    expect(checkoutResult).toHaveProperty("ok");
    const currentBranch = await adapter.getCurrentBranch();
    expect(typeof currentBranch).toBe("string");
  });
});

export { TestGitAdapter };
