import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { PipelineState } from "../state-machine/pipeline-state.js";

import { startPipeline } from "./pipeline-engine.js";
import { parseAndExecute } from "./pipeline-runner.js";

const PHASE_1 = "PHASE_1_QUESTIONER";
const PHASE_2 = "PHASE_2_DESIGN_DEBATE";
const PHASE_3 = "PHASE_3_TLA_WRITER";
const EXIT_CODE_ERROR = 1;
const EXIT_CODE_SUCCESS = 0;
const USAGE_MARKER = "Usage:";
const STATE_JSON = "state.json";
const STATE_LOCK = "state.lock";
const NO_SESSION_SLUG = "no-session";
const LOCKED_SLUG = "locked-slug";

const writeStateDirectly = async (
  directory: string,
  state: PipelineState,
): Promise<void> => {
  await writeFile(
    path.join(directory, STATE_JSON),
    JSON.stringify(state, null, 2),
    "utf8",
  );
  await writeFile(
    path.join(directory, STATE_LOCK),
    String(process.pid),
    "utf8",
  );
};

let stateDirectory: string;

const coreCommandTests = (): void => {
  it("start command returns phase PHASE_1_QUESTIONER", async () => {
    const result = await parseAndExecute(
      ["start", "test-slug"],
      stateDirectory,
    );

    expect(result.exitCode).toBe(EXIT_CODE_SUCCESS);

    const parsed: unknown = JSON.parse(result.stdout);
    expect(parsed).toHaveProperty("phase", PHASE_1);
  });

  it("start with questioner JSON advances directly to PHASE_2", async () => {
    const questionerJson = JSON.stringify({
      briefingPath: "/fixtures/briefing.md",
      experts: ["expert-a", "expert-b"],
    });

    const result = await parseAndExecute(
      ["start", "start-with-json-slug", questionerJson],
      stateDirectory,
    );

    expect(result.exitCode).toBe(EXIT_CODE_SUCCESS);

    const parsed: unknown = JSON.parse(result.stdout);
    expect(parsed).toHaveProperty("phase", PHASE_2);
  });

  it("start with invalid JSON returns exit code 1 and error in body", async () => {
    const result = await parseAndExecute(
      ["start", "start-bad-json-slug", "not-valid-json{{{"],
      stateDirectory,
    );

    expect(result.exitCode).toBe(EXIT_CODE_ERROR);

    const parsed: unknown = JSON.parse(result.stdout);
    expect(parsed).toHaveProperty("error");
  });

  it("start with non-object JSON returns exit code 1 and error in body", async () => {
    const result = await parseAndExecute(
      ["start", "start-array-json-slug", JSON.stringify([1, 2, 3])],
      stateDirectory,
    );

    expect(result.exitCode).toBe(EXIT_CODE_ERROR);

    const parsed: unknown = JSON.parse(result.stdout);
    expect(parsed).toHaveProperty("error");
  });

  it("status command returns current pipeline state", async () => {
    await startPipeline("status-slug", stateDirectory);

    const result = await parseAndExecute(
      ["status", "status-slug"],
      stateDirectory,
    );

    expect(result.exitCode).toBe(EXIT_CODE_SUCCESS);

    const parsed: unknown = JSON.parse(result.stdout);
    expect(parsed).toHaveProperty("phase", PHASE_1);
  });

  it("halt command returns halted phase", async () => {
    await startPipeline("halt-slug", stateDirectory);

    const result = await parseAndExecute(
      ["halt", "halt-slug", "USER_HALT"],
      stateDirectory,
    );

    expect(result.exitCode).toBe(EXIT_CODE_SUCCESS);

    const parsed: unknown = JSON.parse(result.stdout);
    expect(parsed).toHaveProperty("phase", "HALTED");
  });

  it("advance command with nonexistent file returns validation error", async () => {
    await startPipeline("advance-slug", stateDirectory);

    const result = await parseAndExecute(
      ["advance", "advance-slug", "/nonexistent/output.json"],
      stateDirectory,
    );

    expect(result.exitCode).toBe(EXIT_CODE_SUCCESS);

    const parsed: unknown = JSON.parse(result.stdout);
    expect(parsed).toHaveProperty("valid", false);
  });
};

const usageErrorTests = (): void => {
  it("no arguments exits with code 1 and prints usage", async () => {
    const result = await parseAndExecute([], stateDirectory);

    expect(result.exitCode).toBe(EXIT_CODE_ERROR);
    expect(result.stderr).toContain(USAGE_MARKER);
    expect(result.stdout).toBe("");
  });

  it("unknown command without slug prints usage", async () => {
    const result = await parseAndExecute(["bogus"], stateDirectory);

    expect(result.exitCode).toBe(EXIT_CODE_ERROR);
    expect(result.stderr).toContain(USAGE_MARKER);
  });

  it("unknown command with slug hits default case and prints usage", async () => {
    const result = await parseAndExecute(
      ["bogus", "some-slug"],
      stateDirectory,
    );

    expect(result.exitCode).toBe(EXIT_CODE_ERROR);
    expect(result.stderr).toContain(USAGE_MARKER);
  });

  it("start missing slug exits with code 1", async () => {
    const result = await parseAndExecute(["start"], stateDirectory);

    expect(result.exitCode).toBe(EXIT_CODE_ERROR);
    expect(result.stderr).toContain(USAGE_MARKER);
  });

  it("advance missing args exits with code 1", async () => {
    const result = await parseAndExecute(["advance"], stateDirectory);

    expect(result.exitCode).toBe(EXIT_CODE_ERROR);
    expect(result.stderr).toContain(USAGE_MARKER);
  });

  it("advance missing output path exits with code 1", async () => {
    const result = await parseAndExecute(
      ["advance", "some-slug"],
      stateDirectory,
    );

    expect(result.exitCode).toBe(EXIT_CODE_ERROR);
    expect(result.stderr).toContain(USAGE_MARKER);
  });

  it("halt missing reason exits with code 1", async () => {
    const result = await parseAndExecute(["halt", "some-slug"], stateDirectory);

    expect(result.exitCode).toBe(EXIT_CODE_ERROR);
    expect(result.stderr).toContain(USAGE_MARKER);
  });

  it("retry missing target phase exits with code 1", async () => {
    const result = await parseAndExecute(
      ["retry", "some-slug"],
      stateDirectory,
    );

    expect(result.exitCode).toBe(EXIT_CODE_ERROR);
    expect(result.stderr).toContain(USAGE_MARKER);
  });
};

const engineErrorTests = (): void => {
  it("status with no session returns error", async () => {
    const result = await parseAndExecute(
      ["status", "nonexistent-slug"],
      stateDirectory,
    );

    expect(result.exitCode).toBe(EXIT_CODE_ERROR);

    const parsed: unknown = JSON.parse(result.stdout);
    expect(parsed).toHaveProperty("error");
  });

  it("advance with no session returns error", async () => {
    const result = await parseAndExecute(
      ["advance", NO_SESSION_SLUG, "/some/path.json"],
      stateDirectory,
    );

    expect(result.exitCode).toBe(EXIT_CODE_ERROR);

    const parsed: unknown = JSON.parse(result.stdout);
    expect(parsed).toHaveProperty("error");
  });

  it("halt with no session returns error", async () => {
    const result = await parseAndExecute(
      ["halt", NO_SESSION_SLUG, "USER_HALT"],
      stateDirectory,
    );

    expect(result.exitCode).toBe(EXIT_CODE_ERROR);

    const parsed: unknown = JSON.parse(result.stdout);
    expect(parsed).toHaveProperty("error");
  });

  it("retry with no session returns error", async () => {
    const result = await parseAndExecute(
      ["retry", NO_SESSION_SLUG, PHASE_1],
      stateDirectory,
    );

    expect(result.exitCode).toBe(EXIT_CODE_ERROR);

    const parsed: unknown = JSON.parse(result.stdout);
    expect(parsed).toHaveProperty("error");
  });

  it("halt engine error returns exit code 1", async () => {
    const result = await parseAndExecute(
      ["halt", "halt-no-session", "AGENT_FAILURE"],
      stateDirectory,
    );

    expect(result.exitCode).toBe(EXIT_CODE_ERROR);

    const parsed: unknown = JSON.parse(result.stdout);
    expect(parsed).toHaveProperty("error");
  });

  it("start locked pipeline returns exit code 1", async () => {
    await startPipeline(LOCKED_SLUG, stateDirectory);
    await startPipeline(LOCKED_SLUG, stateDirectory);

    const result = await parseAndExecute(
      ["start", LOCKED_SLUG],
      stateDirectory,
    );

    expect(result.exitCode).toBe(EXIT_CODE_ERROR);

    const parsed: unknown = JSON.parse(result.stdout);
    expect(parsed).toHaveProperty("error");
  });

  it("retry invalid backward transition returns error", async () => {
    await startPipeline("retry-slug", stateDirectory);

    const result = await parseAndExecute(
      ["retry", "retry-slug", PHASE_1],
      stateDirectory,
    );

    expect(result.exitCode).toBe(EXIT_CODE_ERROR);

    const parsed: unknown = JSON.parse(result.stdout);
    expect(parsed).toHaveProperty("error");
  });

  it("halt with invalid reason returns error", async () => {
    await startPipeline("invalid-reason", stateDirectory);

    const result = await parseAndExecute(
      ["halt", "invalid-reason", "BOGUS_REASON"],
      stateDirectory,
    );

    expect(result.exitCode).toBe(EXIT_CODE_ERROR);

    const parsed: unknown = JSON.parse(result.stdout);
    expect(parsed).toHaveProperty("error");
  });

  it("retry with invalid phase returns error", async () => {
    await startPipeline("invalid-phase", stateDirectory);

    const result = await parseAndExecute(
      ["retry", "invalid-phase", "BOGUS_PHASE"],
      stateDirectory,
    );

    expect(result.exitCode).toBe(EXIT_CODE_ERROR);

    const parsed: unknown = JSON.parse(result.stdout);
    expect(parsed).toHaveProperty("error");
  });

  it("retry succeeds when backward transition is valid", async () => {
    const state: PipelineState = {
      accumulatedContext: {
        briefingPath: "/b.md",
        designConsensusPath: "/d.md",
        experts: ["alice"],
      },
      haltReason: "NONE",
      phase: PHASE_3,
      retries: { PHASE_1_QUESTIONER: 0, PHASE_3_TLA_WRITER: 0 },
      slug: "retry-ok",
      startedAt: new Date().toISOString(),
      validationAttempts: 0,
    };
    await writeStateDirectly(stateDirectory, state);

    const result = await parseAndExecute(
      ["retry", "retry-ok", PHASE_1],
      stateDirectory,
    );

    expect(result.exitCode).toBe(EXIT_CODE_SUCCESS);

    const parsed: unknown = JSON.parse(result.stdout);
    expect(parsed).toHaveProperty("phase", PHASE_1);
  });
};

describe("parseAndExecute", () => {
  beforeEach(async () => {
    stateDirectory = await mkdtemp(path.join(tmpdir(), "runner-test-"));
  });

  afterEach(async () => {
    await rm(stateDirectory, { force: true, recursive: true });
  });

  describe("core commands", coreCommandTests);
  describe("usage errors", usageErrorTests);
  describe("engine errors", engineErrorTests);
});
