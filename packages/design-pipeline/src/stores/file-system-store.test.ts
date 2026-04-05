import { describe, expect, it } from "vitest";

import { isOk, isResultError } from "../util/result.ts";
import {
  createTestFileSystemStore,
  FileSystemStore,
} from "./file-system-store.ts";

describe("FileSystemStore", () => {
  describe("initial state", () => {
    it("has idle status", () => {
      const store = new FileSystemStore();
      expect(store.state.status).toBe("idle");
    });
  });

  describe("base implementation returns not-implemented", () => {
    it("readFile returns error", async () => {
      const store = new FileSystemStore();
      expect(isResultError(await store.readFile("/test"))).toBe(true);
    });

    it("writeFile returns error", async () => {
      const store = new FileSystemStore();
      expect(isResultError(await store.writeFile("/test", "data"))).toBe(true);
    });

    it("mkdir returns error", async () => {
      const store = new FileSystemStore();
      expect(isResultError(await store.mkdir("/test"))).toBe(true);
    });

    it("exists returns error", async () => {
      const store = new FileSystemStore();
      expect(isResultError(await store.exists("/test"))).toBe(true);
    });
  });
});

describe("createTestFileSystemStore", () => {
  it("readFile returns content for existing file", async () => {
    const { setFile, store } = createTestFileSystemStore();
    setFile("/test.txt", "hello");
    const result = await store.readFile("/test.txt");
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toBe("hello");
    }
  });

  it("readFile returns error for missing file", async () => {
    const { store } = createTestFileSystemStore();
    const result = await store.readFile("/missing.txt");
    expect(isResultError(result)).toBe(true);
  });

  it("writeFile stores content that readFile returns", async () => {
    const { store } = createTestFileSystemStore();
    await store.writeFile("/out.txt", "written");
    const result = await store.readFile("/out.txt");
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toBe("written");
    }
  });

  it("exists returns true for existing file", async () => {
    const { setFile, store } = createTestFileSystemStore();
    setFile("/exists.txt", "data");
    const result = await store.exists("/exists.txt");
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toBe(true);
    }
  });

  it("exists returns false for missing file", async () => {
    const { store } = createTestFileSystemStore();
    const result = await store.exists("/nope.txt");
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toBe(false);
    }
  });

  it("mkdir returns ok", async () => {
    const { store } = createTestFileSystemStore();
    const result = await store.mkdir("/dir");
    expect(isOk(result)).toBe(true);
  });

  it("re-writing same content is idempotent", async () => {
    const { store } = createTestFileSystemStore();
    await store.writeFile("/file.txt", "content");
    await store.writeFile("/file.txt", "content");
    const result = await store.readFile("/file.txt");
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toBe("content");
    }
  });
});
