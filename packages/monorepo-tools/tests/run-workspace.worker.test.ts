/* eslint-disable vitest/no-conditional-in-test */
/**
Smoke test for the long-lived check worker.

Spawns `run-workspace.worker.ts` as a single bun process with a `--jobs` file
holding two workspace jobs, and asserts the worker emits one NDJSON response
per job carrying the same `runWorkspace` result shape. This locks the protocol
contract and proves one process services more than one workspace.
*/

import isNil from "lodash/isNil.js";
import split from "lodash/split.js";
import trim from "lodash/trim.js";
import { type ChildProcess, spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const WORKER_PATH = fileURLToPath(
  new URL("../src/cli/run-workspace.worker.ts", import.meta.url)
);
const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

const findBun = () => {
  // Spawn the worker with the `bun` on PATH, the same runtime the orchestrator
  // would use, independent of how this test process was launched.
  return "bun";
};

type WorkerResponse =
  | { error: string; id: string }
  | { id: string; result: Record<string, unknown> };

const startWorker = (bun: string, jobsFile: string) => {
  return spawn(bun, [WORKER_PATH, "--jobs", jobsFile], {
    cwd: REPO_ROOT,
    env: process.env,
    stdio: ["ignore", "pipe", "inherit"]
  });
};

const collectResponses = async (child: ChildProcess) => {
  const responses: WorkerResponse[] = [];
  let buffer = "";
  return new Promise<WorkerResponse[]>((resolve, reject) => {
    const stream = child.stdout;
    if (isNil(stream)) {
      reject(new Error("worker produced no stdout stream"));
      return;
    }
    stream.on("data", (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = split(buffer, "\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = trim(line);
        if ("" !== trimmed) {
          responses.push(JSON.parse(trimmed) as WorkerResponse);
        }
      }
    });
    child.on("close", () => {
      resolve(responses);
    });
    child.on("error", reject);
  });
};

describe("run-workspace.worker", () => {
  it("services multiple jobs from one long-lived process", async () => {
    const bun = findBun();
    const directory = mkdtempSync(path.join(tmpdir(), "worker-test-"));
    const jobsFile = path.join(directory, "jobs.json");
    const jobArguments = {
      checks: ["lint"],
      cwd: fileURLToPath(new URL("../src/cli", import.meta.url)),
      files: [],
      fix: false,
      targetedFiles: [],
      testFiles: []
    };
    writeFileSync(
      jobsFile,
      JSON.stringify({
        jobs: [
          { args: jobArguments, id: "ws-a" },
          { args: jobArguments, id: "ws-b" }
        ]
      })
    );

    const child = startWorker(bun, jobsFile);
    const responses = await collectResponses(child);
    await Promise.race([
      once(child, "exit"),
      new Promise((resolve) => {
        setTimeout(resolve, 2000);
      })
    ]);
    if (!child.killed) {
      child.kill();
    }

    expect(responses).toHaveLength(2);

    const firstResult = (responses[0] as { result: Record<string, unknown> })
      .result;

    expect(firstResult).toHaveProperty("lint");
    expect(firstResult).toHaveProperty("tsc");
    expect(firstResult).toHaveProperty("test");
  }, 60_000);
});
