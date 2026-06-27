import { DateTime } from "luxon";
import { appendFile, writeFile } from "node:fs/promises";
import path from "node:path";

const LOG_FILE = path.resolve("chat.log");

export async function initializeLogFile(): Promise<void> {
  try {
    await writeFile(LOG_FILE, "", "utf8");
  } catch {
    // Silently ignore — logging errors must never crash the app
  }
}

export async function logChatMessage(entry: string): Promise<void> {
  try {
    const timestamp = DateTime.now().toISO();
    await appendFile(LOG_FILE, `[${timestamp}] ${entry}\n`, "utf8");
  } catch {
    // Silently ignore — logging errors must never crash the app
  }
}
