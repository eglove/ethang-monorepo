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

import { existsSync, mkdirSync, appendFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { EdgeType, NodeType } from './types.js';

const NODE_TYPES: readonly NodeType[] = ['app', 'package', 'component', 'function', 'file'] as const;
const EDGE_TYPES: readonly EdgeType[] = [
  'calls',
  'imports',
  'exports',
  'depends_on',
  'contains',
  'tested_by',
  'test_for',
] as const;

export interface AddNodeRecord {
  kind: 'node';
  path: string;
  type: NodeType;
}

export interface AddEdgeRecord {
  kind: 'edge';
  from: string;
  to: string;
  type: EdgeType;
}

export type DiscoveryRecord = AddNodeRecord | AddEdgeRecord;

export function getDiscoveriesPath(): string {
  if (process.env.VIBE_CLI_GRAPH_DISCOVERIES) {
    return process.env.VIBE_CLI_GRAPH_DISCOVERIES;
  }
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, 'discoveries.jsonl');
}

export function appendRecord(record: DiscoveryRecord, path: string = getDiscoveriesPath()): void {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  appendFileSync(path, JSON.stringify(record) + '\n', 'utf8');
}

export function resetDiscoveries(path: string = getDiscoveriesPath()): void {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, '', 'utf8');
}

export function runCli(argv: readonly string[]): { code: number; message?: string } {
  const [cmd, ...rest] = argv;

  if (cmd === 'add-node') {
    const [path, type] = rest;
    if (!path || !type) {
      return { code: 2, message: 'usage: add-node <path> <type>' };
    }
    if (!NODE_TYPES.includes(type as NodeType)) {
      return { code: 2, message: `invalid node type '${type}' (expected: ${NODE_TYPES.join(', ')})` };
    }
    appendRecord({ kind: 'node', path, type: type as NodeType });
    return { code: 0 };
  }

  if (cmd === 'add-edge') {
    const [from, to, type] = rest;
    if (!from || !to || !type) {
      return { code: 2, message: 'usage: add-edge <from> <to> <type>' };
    }
    if (!EDGE_TYPES.includes(type as EdgeType)) {
      return { code: 2, message: `invalid edge type '${type}' (expected: ${EDGE_TYPES.join(', ')})` };
    }
    appendRecord({ kind: 'edge', from, to, type: type as EdgeType });
    return { code: 0 };
  }

  if (cmd === 'reset') {
    resetDiscoveries();
    return { code: 0 };
  }

  return {
    code: 2,
    message: 'usage: tsx graph/cli.ts <add-node|add-edge|reset> ...',
  };
}

const scriptArg = process.argv[1];
if (scriptArg && (scriptArg.endsWith('cli.ts') || scriptArg.endsWith('cli.js'))) {
  const { code, message } = runCli(process.argv.slice(2));
  if (message) {
    const stream = code === 0 ? process.stdout : process.stderr;
    stream.write(message + '\n');
  }
  process.exit(code);
}
