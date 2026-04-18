import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { DedupStateMachine } from "./dedup.js";
import { writeGraph } from "./markdown.js";
import {
  getDiscoveriesPath,
  type DiscoveryRecord,
} from "./cli.js";

/**
 * Replays a discoveries NDJSON file into a state machine. Malformed lines
 * are skipped with a warning on stderr (non-fatal). Returns the number of
 * successfully applied records.
 */
export function replayDiscoveries(
  machine: DedupStateMachine,
  path: string,
): number {
  if (!existsSync(path)) return 0;

  const content = readFileSync(path, "utf8");
  if (!content.trim()) return 0;

  let applied = 0;
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let record: DiscoveryRecord;
    try {
      record = JSON.parse(trimmed) as DiscoveryRecord;
    } catch (error) {
      process.stderr.write(
        `[WARN: discoveries malformed line skipped] ${String(error)}\n`,
      );
      continue;
    }

    try {
      if (record.kind === "node") {
        machine.addNode(record.path, record.type);
      } else if (record.kind === "edge") {
        machine.addEdge(record.from, record.to, record.type);
      } else {
        process.stderr.write(
          `[WARN: discoveries unknown kind] ${JSON.stringify(record)}\n`,
        );
        continue;
      }
      applied++;
    } catch (error) {
      process.stderr.write(
        `[WARN: discoveries replay error] ${String(error)}\n`,
      );
    }
  }

  return applied;
}

// When run as a script (tsx graph/index.ts <outputPath> <maxAgents>)
const scriptArgument = process.argv[1];
if (
  scriptArgument &&
  (scriptArgument.endsWith("index.ts") || scriptArgument.endsWith("index.js"))
) {
  const outputPath = process.argv[2] || "CLAUDE.md";
  const maxAgents = Number.parseInt(process.argv[3] || "1", 10);
  const discoveriesPath = getDiscoveriesPath();

  const machine = new DedupStateMachine();
  replayDiscoveries(machine, discoveriesPath);

  writeGraph(machine, { maxAgents, outputPath })
    .then(() => {
      if (
        machine.markdownState === "current" &&
        existsSync(discoveriesPath)
      ) {
        writeFileSync(discoveriesPath, "", "utf8");
      }
    })
    .catch((error: unknown) => {
      process.stderr.write(
        `[graph/index] writeGraph failed: ${String(error)}\n`,
      );
      process.exit(1);
    });
}

export { DedupStateMachine } from "./dedup.js";
export { VibeGraph } from "./graph.js";
export { writeGraph } from "./markdown.js";
export type { InjectableFS, WriteOptions } from "./markdown.js";
export type { EdgeType, NodeType } from "./types.js";
export {
  runCli,
  appendRecord,
  resetDiscoveries,
  getDiscoveriesPath,
} from "./cli.js";
export type {
  DiscoveryRecord,
  AddNodeRecord,
  AddEdgeRecord,
} from "./cli.js";
