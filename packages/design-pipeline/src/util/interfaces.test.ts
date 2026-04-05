import constant from "lodash/constant.js";
import { describe, expect, it } from "vitest";

import type {
  FileOperations,
  GitOperations,
  LlmProvider,
} from "./interfaces.ts";

import { ok, type Result } from "./result.ts";

const DEFAULT_MODEL = "test-model";
const DONE_CHUNK = { content: "", done: true };

// eslint-disable-next-line @typescript-eslint/require-await
async function* noopStream() {
  yield DONE_CHUNK;
}

const createMockLlmProvider = (model = DEFAULT_MODEL): LlmProvider => {
  return {
    // eslint-disable-next-line @typescript-eslint/require-await
    chat: async () => ok(noopStream()),
    getModel: constant(model),
  };
};

const QUESTIONER_MODEL = "model-for-questioner";

describe("LlmProvider interface", () => {
  it("mock object satisfies interface", () => {
    const mock = createMockLlmProvider(QUESTIONER_MODEL);
    expect(mock.getModel("questioner")).toBe(QUESTIONER_MODEL);
  });

  it("chat returns Promise<Result<AsyncIterable>>", async () => {
    const mock = createMockLlmProvider();
    const result = await mock.chat({
      messages: [{ content: "hi", role: "user" }],
      model: "test",
    });
    expect(result.ok).toBe(true);
  });

  it("getModel returns string for stage name", () => {
    const mock = createMockLlmProvider("anthropic/claude-sonnet");
    const model: string = mock.getModel("questioner");
    expect(model).toBe("anthropic/claude-sonnet");
  });
});

describe("GitOperations interface", () => {
  it("mock satisfies GitOperations interface", () => {
    const mock: GitOperations = {
      // eslint-disable-next-line @typescript-eslint/require-await
      add: async () => ok("added"),
      // eslint-disable-next-line @typescript-eslint/require-await
      commit: async () => ok("committed"),
      // eslint-disable-next-line @typescript-eslint/require-await
      createBranch: async () => ok("created"),
      // eslint-disable-next-line @typescript-eslint/require-await
      diff: async () => ok("diff output"),
      // eslint-disable-next-line @typescript-eslint/require-await
      status: async () => ok("clean"),
    };

    expect(mock).toBeDefined();
  });

  it("methods return Promise<Result<string>>", async () => {
    const mock: GitOperations = {
      // eslint-disable-next-line @typescript-eslint/require-await
      add: async () => ok("added"),
      // eslint-disable-next-line @typescript-eslint/require-await
      commit: async () => ok("sha123"),
      // eslint-disable-next-line @typescript-eslint/require-await
      createBranch: async () => ok("branch-name"),
      // eslint-disable-next-line @typescript-eslint/require-await
      diff: async () => ok(""),
      // eslint-disable-next-line @typescript-eslint/require-await
      status: async () => ok("nothing to commit"),
    };

    const statusResult: Result<string> = await mock.status();
    expect(statusResult.ok).toBe(true);

    const commitResult: Result<string> = await mock.commit("test");
    expect(commitResult.ok).toBe(true);

    const branchResult: Result<string> = await mock.createBranch("feat");
    expect(branchResult.ok).toBe(true);

    const diffResult: Result<string> = await mock.diff();
    expect(diffResult.ok).toBe(true);

    const addResult: Result<string> = await mock.add(["file.ts"]);
    expect(addResult.ok).toBe(true);
  });
});

describe("FileOperations interface", () => {
  it("mock satisfies FileOperations interface", () => {
    const mock: FileOperations = {
      // eslint-disable-next-line @typescript-eslint/require-await
      exists: async () => ok(true),
      // eslint-disable-next-line @typescript-eslint/require-await
      mkdir: async () => ok(),
      // eslint-disable-next-line @typescript-eslint/require-await
      readFile: async () => ok("content"),
      // eslint-disable-next-line @typescript-eslint/require-await
      writeFile: async () => ok(),
    };

    expect(mock).toBeDefined();
  });

  it("methods return correct Result types", async () => {
    const mock: FileOperations = {
      // eslint-disable-next-line @typescript-eslint/require-await
      exists: async () => ok(false),
      // eslint-disable-next-line @typescript-eslint/require-await
      mkdir: async () => ok(),
      // eslint-disable-next-line @typescript-eslint/require-await
      readFile: async () => ok("file content"),
      // eslint-disable-next-line @typescript-eslint/require-await
      writeFile: async () => ok(),
    };

    const existsResult: Result<boolean> = await mock.exists("/test");
    expect(existsResult.ok).toBe(true);

    const readResult: Result<string> = await mock.readFile("/test");
    expect(readResult.ok).toBe(true);

    const writeResult: Result<void> = await mock.writeFile("/test", "data");
    expect(writeResult.ok).toBe(true);

    const mkdirResult: Result<void> = await mock.mkdir("/test");
    expect(mkdirResult.ok).toBe(true);
  });
});
