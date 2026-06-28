import { DateTime } from "luxon";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const LOG_FILE = path.resolve("chat.log");

describe("chat-logger", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    await writeFile(LOG_FILE, "", "utf8");
  });

  afterEach(async () => {
    vi.useRealTimers();
    await writeFile(LOG_FILE, "", "utf8");
  });

  describe("initializeLogFile", () => {
    it("creates/truncates the log file", async () => {
      await writeFile(LOG_FILE, "old content", "utf8");

      const { initializeLogFile } = await import("./chat-logger.js");
      await initializeLogFile();

      const content = await readFile(LOG_FILE, "utf8");
      expect(content).toBe("");
    });

    it("does not throw if the file cannot be written", async () => {
      const { initializeLogFile } = await import("./chat-logger.js");
      // Should resolve without throwing even on permission errors
      await expect(initializeLogFile()).resolves.toBeUndefined();
    });
  });

  describe("logChatMessage", () => {
    it("appends a timestamped entry to the log file", async () => {
      const fixedNow = DateTime.fromISO("2026-06-27T12:00:00.000Z");
      vi.setSystemTime(fixedNow.toMillis());

      const { logChatMessage } = await import("./chat-logger.js");
      await logChatMessage("user: Hello");

      const content = await readFile(LOG_FILE, "utf8");
      expect(content).toContain(`[${fixedNow.toISO()}] user: Hello`);
    });

    it("appends multiple entries in order", async () => {
      const { logChatMessage } = await import("./chat-logger.js");
      await logChatMessage("first");
      await logChatMessage("second");

      const content = await readFile(LOG_FILE, "utf8");
      const firstIndex = content.indexOf("first");
      const secondIndex = content.indexOf("second");
      expect(firstIndex).toBeLessThan(secondIndex);
    });

    it("does not throw if the file cannot be appended", async () => {
      const { logChatMessage } = await import("./chat-logger.js");
      await expect(logChatMessage("test")).resolves.toBeUndefined();
    });
  });
});
