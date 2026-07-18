#!/usr/bin/env bun

/**
Long-lived worker for the monorepo check.

The PowerShell orchestrator (`repo-ai-check.cli.ps1`) launches this process
once, passing a `--jobs <path>` file that contains the full list of workspace
jobs (each `{ id, args }`). Reusing a single process removes the per-workspace
`bun` cold start that the previous "spawn bun per workspace" design paid.
Because the worker is one persistent process, it is also the natural home for
a future shared WebStorm MCP connection (one SSE session reused across every
workspace) — see the design note in the plan. This change keeps the check
lint/tsc/test only; no MCP calls are made here.

Jobs run with bounded internal concurrency (the `--throttle` value passed via
the CHECK_WORKER_THROTTLE env var, defaulting to the logical CPU count), so
the worker replaces N parallel bun processes with N concurrent tasks inside
one process.

Response protocol (newline-delimited JSON on stdout):
  { "id": string, "result": <RunnerResult> }
  { "id": string, "error": string }   -> emitted as a failed-workspace
                                         report by the orchestrator
*/

import { Effect, Schema } from "effect";
import isNil from "lodash/isNil.js";
import { readFileSync } from "node:fs";
import process from "node:process";

import { type ParsedArguments, runWorkspace } from "./run-workspace.cli.ts";

const EXIT_FAIL = 1;

const JobRequestSchema = Schema.Struct({
  args: Schema.Unknown,
  id: Schema.String
});

const JobFileSchema = Schema.Struct({
  jobs: Schema.Array(JobRequestSchema)
});

const resolveThrottle = () => {
  const raw = Number(process.env["CHECK_WORKER_THROTTLE"]);
  if (Number.isSafeInteger(raw) && 0 < raw) {
    return raw;
  }
  const cpus = Number(process.env["NUMBER_OF_PROCESSORS"]);
  return Number.isSafeInteger(cpus) && 0 < cpus ? cpus : 1;
};

const parseJobsFile = (jobsPath: string) => {
  const decoded = Schema.decodeUnknownSync(JobFileSchema)(
    JSON.parse(readFileSync(jobsPath, "utf8"))
  );
  return decoded.jobs;
};

const writeResponse = (payload: unknown) => {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
};

const runJob = (request: Schema.Schema.Type<typeof JobRequestSchema>) => {
  return Effect.gen(function* () {
    // The orchestrator writes the jobs file, so `args` is trusted structured
    // input rather than untrusted external data.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const result = yield* runWorkspace(request.args as ParsedArguments);
    writeResponse({ id: request.id, result });
  }).pipe(
    Effect.catchAll((cause) => {
      const message = Error.isError(cause) ? cause.message : String(cause);
      writeResponse({ error: message, id: request.id });
      return Effect.void;
    })
  );
};

const main = async () => {
  const jobsIndex = process.argv.indexOf("--jobs");
  if (-1 === jobsIndex || jobsIndex + 1 >= process.argv.length) {
    process.stderr.write("run-workspace.worker: missing --jobs <path>\n");
    process.exit(EXIT_FAIL);
  }
  const jobsPath = process.argv[jobsIndex + 1];
  if (isNil(jobsPath)) {
    process.stderr.write("run-workspace.worker: missing --jobs <path>\n");
    process.exit(EXIT_FAIL);
  }
  const requests = parseJobsFile(jobsPath);
  await Effect.runPromise(
    Effect.forEach(requests, runJob, {
      concurrency: resolveThrottle()
    })
  );
};

await main();
