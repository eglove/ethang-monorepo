#!/usr/bin/env tsx
/**
 * Agent-facing CLI for contributing nodes/edges to the knowledge graph.
 *
 *   tsx graph/cli.ts add-node <path> <type>
 *   tsx graph/cli.ts add-edge <from> <to> <type>
 *   tsx graph/cli.ts reset
 *
 * Each call appends a single JSON record (NDJSON) to the discoveries log.
 * The log path defaults to `packages/vibe-cli/graph/discoveries.jsonl`
 * and can be overridden with VIBE_CLI_GRAPH_DISCOVERIES.
 *
 * `tsx graph/index.ts` reads the log, replays the records into a fresh
 * state machine, writes CLAUDE.md, and clears the log on success.
 */

import endsWith from "lodash/endsWith.js";
import includes from "lodash/includes.js";
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { EdgeType, NodeType } from "./types.js";

const NODE_TYPES: readonly NodeType[] = [
  "app",
  "package",
  "component",
  "function",
  "file",
] as const;
const EDGE_TYPES: readonly EdgeType[] = [
  "calls",
  "imports",
  "exports",
  "depends_on",
  "contains",
  "tested_by",
  "test_for",
] as const;

export type AddEdgeRecord = {
  from: string;
  kind: "edge";
  to: string;
  type: EdgeType;
};

export type AddNodeRecord = {
  kind: "node";
  path: string;
  type: NodeType;
};

export type DiscoveryRecord = AddEdgeRecord | AddNodeRecord;

export function appendRecord(
  record: DiscoveryRecord,
  filePath: string = getDiscoveriesPath(),
): void {
  const directory = path.dirname(filePath);
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true });
  appendFileSync(filePath, `${JSON.stringify(record)}\n`, "utf8");
}

export function getDiscoveriesPath(): string {
  const override = process.env["VIBE_CLI_GRAPH_DISCOVERIES"];
  if (override !== undefined && "" !== override) {
    return override;
  }
  const here = import.meta.dirname;
  return path.resolve(here, "discoveries.jsonl");
}

export function resetDiscoveries(
  filePath: string = getDiscoveriesPath(),
): void {
  const directory = path.dirname(filePath);
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true });
  writeFileSync(filePath, "", "utf8");
}

export function runCli(argv: readonly string[]): {
  code: number;
  message?: string;
} {
  const [cmd, ...rest] = argv;

  if ("add-node" === cmd) return handleAddNode(rest);
  if ("add-edge" === cmd) return handleAddEdge(rest);

  if ("reset" === cmd) {
    resetDiscoveries();
    return { code: 0 };
  }

  return {
    code: 2,
    message: "usage: tsx graph/cli.ts <add-node|add-edge|reset> ...",
  };
}

function handleAddEdge(rest: readonly string[]): {
  code: number;
  message?: string;
} {
  const [from, to, type] = rest;
  if (!isPresent(from) || !isPresent(to) || !isPresent(type)) {
    return { code: 2, message: "usage: add-edge <from> <to> <type>" };
  }
  if (!isEdgeType(type)) {
    return {
      code: 2,
      message: `invalid edge type '${type}' (expected: ${EDGE_TYPES.join(", ")})`,
    };
  }
  appendRecord({ from, kind: "edge", to, type });
  return { code: 0 };
}

function handleAddNode(rest: readonly string[]): {
  code: number;
  message?: string;
} {
  const [nodePath, type] = rest;
  if (!isPresent(nodePath) || !isPresent(type)) {
    return { code: 2, message: "usage: add-node <path> <type>" };
  }
  if (!isNodeType(type)) {
    return {
      code: 2,
      message: `invalid node type '${type}' (expected: ${NODE_TYPES.join(", ")})`,
    };
  }
  appendRecord({ kind: "node", path: nodePath, type });
  return { code: 0 };
}

function isEdgeType(value: string): value is EdgeType {
  return includes(EDGE_TYPES, value);
}

function isNodeType(value: string): value is NodeType {
  return includes(NODE_TYPES, value);
}

function isPresent(value: string | undefined): value is string {
  return value !== undefined && "" !== value;
}

function runAsScript(): void {
  const [scriptArgument] = [process.argv[1]];
  if (
    scriptArgument !== undefined &&
    "" !== scriptArgument &&
    (endsWith(scriptArgument, "cli.ts") || endsWith(scriptArgument, "cli.js"))
  ) {
    const { code, message } = runCli(process.argv.slice(2));
    if (message !== undefined && "" !== message) {
      const stream = 0 === code ? process.stdout : process.stderr;
      stream.write(`${message}\n`);
    }
    process.exit(code);
  }
}

runAsScript();
