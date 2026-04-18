import endsWith from "lodash/endsWith.js";
import isObject from "lodash/isObject.js";
import split from "lodash/split.js";
import trim from "lodash/trim.js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { type DiscoveryRecord, getDiscoveriesPath } from "./cli.js";
import { DedupStateMachine } from "./dedup.js";
import { writeGraph } from "./markdown.js";

/**
 * Replays a discoveries NDJSON file into a state machine. Malformed lines
 * are skipped with a warning on stderr (non-fatal). Returns the number of
 * successfully applied records.
 */
export function replayDiscoveries(
  machine: DedupStateMachine,
  filePath: string,
): number {
  if (!existsSync(filePath)) return 0;

  const content = readFileSync(filePath, "utf8");
  if ("" === trim(content)) return 0;

  let applied = 0;
  const lines = split(content, /\r?\n/u);
  for (const line of lines) {
    const trimmed = trim(line);
    if ("" !== trimmed) {
      const record = parseRecord(trimmed);
      if (record !== undefined && applyRecord(machine, record)) {
        applied += 1;
      }
    }
  }

  return applied;
}

function applyRecord(
  machine: DedupStateMachine,
  record: DiscoveryRecord,
): boolean {
  try {
    if ("node" === record.kind) {
      machine.addNode(record.path, record.type);
      return true;
    }
    machine.addEdge(record.from, record.to, record.type);
    return true;
  } catch (error) {
    process.stderr.write(`[WARN: discoveries replay error] ${String(error)}\n`);
    return false;
  }
}

function isDiscoveryRecord(value: unknown): value is DiscoveryRecord {
  if (!isObject(value)) return false;
  const record = value as { kind?: unknown };
  return "node" === record.kind || "edge" === record.kind;
}

function parseRecord(line: string): DiscoveryRecord | undefined {
  try {
    const parsed: unknown = JSON.parse(line);
    if (isDiscoveryRecord(parsed)) return parsed;
    process.stderr.write(
      `[WARN: discoveries unknown kind] ${JSON.stringify(parsed)}\n`,
    );
    return undefined;
  } catch (error) {
    process.stderr.write(
      `[WARN: discoveries malformed line skipped] ${String(error)}\n`,
    );
    return undefined;
  }
}

async function runAsScript(): Promise<void> {
  const [scriptArgument] = [process.argv[1]];
  if (
    scriptArgument === undefined ||
    "" === scriptArgument ||
    (!endsWith(scriptArgument, "index.ts") &&
      !endsWith(scriptArgument, "index.js"))
  ) {
    return;
  }

  const outputPath = process.argv[2] ?? "CLAUDE.md";
  const maxAgentsRaw = process.argv[3] ?? "1";
  const maxAgents = Number.parseInt(maxAgentsRaw, 10);
  const discoveriesPath = getDiscoveriesPath();

  const machine = new DedupStateMachine();
  replayDiscoveries(machine, discoveriesPath);

  try {
    await writeGraph(machine, { maxAgents, outputPath });
    if ("current" === machine.markdownState && existsSync(discoveriesPath)) {
      writeFileSync(discoveriesPath, "", "utf8");
    }
  } catch (error) {
    process.stderr.write(`[graph/index] writeGraph failed: ${String(error)}\n`);
    process.exit(1);
  }
}

await runAsScript();

export {
  appendRecord,
  getDiscoveriesPath,
  resetDiscoveries,
  runCli,
} from "./cli.js";
export type { AddEdgeRecord, AddNodeRecord, DiscoveryRecord } from "./cli.js";
export { DedupStateMachine } from "./dedup.js";
export { VibeGraph } from "./graph.js";
export { writeGraph } from "./markdown.js";
export type { InjectableFS, WriteOptions } from "./markdown.js";
export type { EdgeType, NodeType } from "./types.js";
