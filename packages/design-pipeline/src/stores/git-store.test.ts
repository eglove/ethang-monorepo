import { describe, expect, it } from "vitest";

import { isOk, isResultError } from "../util/result.ts";
import { createTestGitStore, GitStore } from "./git-store.ts";

describe("GitStore", () => {
  describe("initial state", () => {
    it("has idle status", () => {
      const store = new GitStore();
      expect(store.state.status).toBe("idle");
    });
  });

  describe("base implementation returns not-implemented", () => {
    it("status returns error", async () => {
      const store = new GitStore();
      expect(isResultError(await store.status())).toBe(true);
    });

    it("commit returns error", async () => {
      const store = new GitStore();
      expect(isResultError(await store.commit("test"))).toBe(true);
    });

    it("createBranch returns error", async () => {
      const store = new GitStore();
      expect(isResultError(await store.createBranch("test"))).toBe(true);
    });

    it("diff returns error", async () => {
      const store = new GitStore();
      expect(isResultError(await store.diff())).toBe(true);
    });

    it("add returns error", async () => {
      const store = new GitStore();
      expect(isResultError(await store.add(["file"]))).toBe(true);
    });
  });
});

describe("createTestGitStore", () => {
  it("status returns ok with mock output", async () => {
    const { store } = createTestGitStore();
    const result = await store.status();
    expect(isOk(result)).toBe(true);
  });

  it("commit returns ok with mock output", async () => {
    const { store } = createTestGitStore();
    const result = await store.commit("test message");
    expect(isOk(result)).toBe(true);
  });

  it("createBranch returns ok with mock output", async () => {
    const { store } = createTestGitStore();
    const result = await store.createBranch("feature");
    expect(isOk(result)).toBe(true);
  });

  it("diff returns ok with mock output", async () => {
    const { store } = createTestGitStore();
    const result = await store.diff();
    expect(isOk(result)).toBe(true);
  });

  it("add returns ok with mock output", async () => {
    const { store } = createTestGitStore();
    const result = await store.add(["file.ts"]);
    expect(isOk(result)).toBe(true);
  });

  it("injectOutput customizes command results", async () => {
    const { injectOutput, store } = createTestGitStore();
    injectOutput("status", "modified: file.ts");
    const result = await store.status();
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toBe("modified: file.ts");
    }
  });
});
