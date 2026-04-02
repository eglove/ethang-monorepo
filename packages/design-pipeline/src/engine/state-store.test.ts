import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createSession, loadSession, saveSession } from "./state-store.js";

const TEST_SLUG = "test-project";
const STATE_JSON = "state.json";
const STATE_TMP_JSON = "state.tmp.json";
const STATE_LOCK = "state.lock";
const PIPELINE_LOCKED = "PIPELINE_LOCKED";
const VALIDATION_ERROR = "VALIDATION_ERROR";

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

let testDirectory: string;

beforeEach(async () => {
  testDirectory = await mkdtemp(path.join(tmpdir(), "state-store-"));
});

afterEach(async () => {
  await rm(testDirectory, { force: true, recursive: true });
});

describe("createSession + loadSession round-trip", () => {
  it("creates state.json with valid IDLE state; loadSession reads it back identically", async () => {
    const created = await createSession(TEST_SLUG, testDirectory);

    expect(created).not.toHaveProperty("error");
    if ("error" in created) return;

    expect(created.phase).toBe("IDLE");
    expect(created.slug).toBe(TEST_SLUG);
    expect(created.haltReason).toBe("NONE");
    expect(created.retries).toStrictEqual({
      PHASE_1_QUESTIONER: 0,
      PHASE_3_TLA_WRITER: 0,
    });
    expect(created.accumulatedContext).toStrictEqual({});
    expect(created.validationAttempts).toBe(0);
    expect(created.startedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/u);

    const loaded = await loadSession(TEST_SLUG, testDirectory);

    expect(loaded).not.toHaveProperty("error");
    if ("error" in loaded) return;

    expect(loaded).toStrictEqual(created);
  });
});

describe("saveSession + loadSession", () => {
  it("saves valid state and loadSession returns updated state", async () => {
    const created = await createSession(TEST_SLUG, testDirectory);

    expect(created).not.toHaveProperty("error");
    if ("error" in created) return;

    const updated = {
      ...created,
      haltReason: "NONE" as const,
      phase: "PHASE_1_QUESTIONER" as const,
    };

    const saveResult = await saveSession(updated, testDirectory);

    expect(saveResult).toBeUndefined();

    const loaded = await loadSession(TEST_SLUG, testDirectory);

    expect(loaded).not.toHaveProperty("error");
    if ("error" in loaded) return;

    expect(loaded.phase).toBe("PHASE_1_QUESTIONER");
  });

  it("rejects invalid state with VALIDATION_ERROR", async () => {
    const result = await saveSession({ phase: "BOGUS" }, testDirectory);

    expect(result).toHaveProperty("error");
    expect(result?.error).toContain(VALIDATION_ERROR);
  });
});

describe("loadSession error handling", () => {
  it("returns parse error for corrupted JSON", async () => {
    await createSession(TEST_SLUG, testDirectory);
    await writeFile(path.join(testDirectory, STATE_JSON), "NOT_VALID_JSON{{{");

    const result = await loadSession(TEST_SLUG, testDirectory);

    expect(result).toHaveProperty("error");
    if (!("error" in result)) return;

    expect(result.error).toContain("PARSE_ERROR");
  });

  it("returns validation error for schema-invalid JSON", async () => {
    await createSession(TEST_SLUG, testDirectory);
    await writeFile(
      path.join(testDirectory, STATE_JSON),
      JSON.stringify({ phase: "INVALID", slug: TEST_SLUG }),
    );

    const result = await loadSession(TEST_SLUG, testDirectory);

    expect(result).toHaveProperty("error");
    if (!("error" in result)) return;

    expect(result.error).toContain(VALIDATION_ERROR);
  });
});

describe("atomic write behavior", () => {
  it("after saveSession, state.tmp.json does NOT exist but state.json DOES", async () => {
    const created = await createSession(TEST_SLUG, testDirectory);

    expect(created).not.toHaveProperty("error");
    if ("error" in created) return;

    await saveSession(created, testDirectory);

    const stateExists = await fileExists(path.join(testDirectory, STATE_JSON));
    const temporaryExists = await fileExists(
      path.join(testDirectory, STATE_TMP_JSON),
    );

    expect(stateExists).toBe(true);
    expect(temporaryExists).toBe(false);
  });
});

describe("recovery: missing state files", () => {
  it("loadSession returns error when neither state.json nor state.tmp.json exists", async () => {
    const result = await loadSession(TEST_SLUG, testDirectory);

    expect(result).toHaveProperty("error");
    if (!("error" in result)) return;

    expect(result.error).toContain("NO_STATE_FILE");
  });

  it("state.json missing but state.tmp.json exists — loadSession deletes temp, returns error", async () => {
    await writeFile(
      path.join(testDirectory, STATE_TMP_JSON),
      JSON.stringify({ phase: "IDLE" }),
    );

    const result = await loadSession(TEST_SLUG, testDirectory);

    expect(result).toHaveProperty("error");
    if (!("error" in result)) return;

    expect(result.error).toContain("NO_STATE_FILE");

    const temporaryExists = await fileExists(
      path.join(testDirectory, STATE_TMP_JSON),
    );

    expect(temporaryExists).toBe(false);
  });
});

describe("lock file behavior", () => {
  it("createSession writes state.lock; second createSession returns PIPELINE_LOCKED", async () => {
    const first = await createSession(TEST_SLUG, testDirectory);

    expect(first).not.toHaveProperty("error");

    const lockExists = await fileExists(path.join(testDirectory, STATE_LOCK));

    expect(lockExists).toBe(true);

    const second = await createSession(TEST_SLUG, testDirectory);

    expect(second).toHaveProperty("error");
    if (!("error" in second)) return;

    expect(second.error).toBe(PIPELINE_LOCKED);
    expect(second).toHaveProperty("pid");
  });

  it("stale lock with dead PID is overwritten by new session", async () => {
    const deadPid = 2_147_483_647;

    await writeFile(
      path.join(testDirectory, STATE_LOCK),
      String(deadPid),
      "utf8",
    );

    const result = await createSession(TEST_SLUG, testDirectory);

    expect(result).not.toHaveProperty("error");
    if ("error" in result) return;

    expect(result.phase).toBe("IDLE");
  });

  it("lock file cleaned up when saveSession writes COMPLETE state", async () => {
    const created = await createSession(TEST_SLUG, testDirectory);

    expect(created).not.toHaveProperty("error");
    if ("error" in created) return;

    const completeState = {
      ...created,
      accumulatedContext: {
        briefingPath: "/b.md",
        designConsensusPath: "/d.md",
        experts: ["Alice"],
        implementationPlanPath: "/i.md",
        tlaReviewPath: "/r.md",
        tlaSpecPath: "/t.tla",
        tlcResult: "PASS",
      },
      haltReason: "NONE" as const,
      phase: "COMPLETE" as const,
    };

    await saveSession(completeState, testDirectory);

    const lockExists = await fileExists(path.join(testDirectory, STATE_LOCK));

    expect(lockExists).toBe(false);
  });

  it("lock file cleaned up when saveSession writes HALTED state", async () => {
    const created = await createSession(TEST_SLUG, testDirectory);

    expect(created).not.toHaveProperty("error");
    if ("error" in created) return;

    const haltedState = {
      ...created,
      haltReason: "USER_HALT" as const,
      phase: "HALTED" as const,
    };

    await saveSession(haltedState, testDirectory);

    const lockExists = await fileExists(path.join(testDirectory, STATE_LOCK));

    expect(lockExists).toBe(false);
  });
});
