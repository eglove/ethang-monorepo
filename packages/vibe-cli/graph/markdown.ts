import type { DedupStateMachine } from './dedup.js';
import type { EdgeType, NodeType } from './types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WriteOptions {
  /** Absolute path to CLAUDE.md */
  outputPath: string;
  maxAgents: number;
  /** If true, calls haltCleanup instead of writeMarkdown/writeFail */
  pipelineHalted?: boolean;
}

export interface InjectableFS {
  writeFile: (path: string, content: string) => Promise<void>;
  rename: (from: string, to: string) => Promise<void>;
  unlink: (path: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Markdown generation — reads from the underlying VibeGraph (DirectedGraph).
// Groups nodes by NodeType and edges by EdgeType; emits a section only when
// at least one entry of that type exists.
//
// Format:
//   ## file
//   pkg/a.ts, pkg/b.ts
//
//   ## imports
//   pkg/a.ts -> pkg/b.ts
// ---------------------------------------------------------------------------

function generateMarkdown(machine: DedupStateMachine): string {
  const nodes = machine.graph.getNodes();
  const edges = machine.graph.getEdges();

  const nodesByType = new Map<NodeType, string[]>();
  for (const n of nodes) {
    const bucket = nodesByType.get(n.type) ?? [];
    bucket.push(n.path);
    nodesByType.set(n.type, bucket);
  }

  const edgesByType = new Map<EdgeType, string[]>();
  for (const e of edges) {
    const bucket = edgesByType.get(e.type) ?? [];
    bucket.push(`${e.from} -> ${e.to}`);
    edgesByType.set(e.type, bucket);
  }

  const sections: string[] = [];
  for (const [type, paths] of nodesByType) {
    sections.push(`## ${type}\n${paths.join(', ')}`);
  }
  for (const [type, pairs] of edgesByType) {
    sections.push(`## ${type}\n${pairs.join(', ')}`);
  }

  return sections.length === 0 ? '\n' : sections.join('\n\n') + '\n';
}

// ---------------------------------------------------------------------------
// Default filesystem (real Node.js fs)
// ---------------------------------------------------------------------------

function createDefaultFS(): InjectableFS {
  return {
    writeFile: async (path: string, content: string) => {
      const { writeFile } = await import('node:fs/promises');
      await writeFile(path, content, 'utf8');
    },
    rename: async (from: string, to: string) => {
      const { rename } = await import('node:fs/promises');
      await rename(from, to);
    },
    unlink: async (path: string) => {
      const { unlink } = await import('node:fs/promises');
      try {
        await unlink(path);
      } catch {
        // tmp may not exist — ignore
      }
    },
  };
}

// ---------------------------------------------------------------------------
// writeGraph — main entry point
// ---------------------------------------------------------------------------

/**
 * Performs the GraphWriteMarkdown → GraphWriteSuccess/GraphWriteFail lifecycle.
 *
 * Atomic write:
 *   1. Write content to CLAUDE.md.tmp
 *   2. Rename CLAUDE.md.tmp → CLAUDE.md
 *   3a. Success → writeMarkdown(maxAgents)
 *   3b. Temp write failure → writeFail(maxAgents), tmp may not exist
 *   3c. Rename failure → writeFail(maxAgents), tmp EXISTS, CLAUDE.md intact (D26)
 */
export async function writeGraph(
  machine: DedupStateMachine,
  options: WriteOptions,
  fs?: InjectableFS,
): Promise<void> {
  if (options.pipelineHalted) {
    machine.haltCleanup();
    return;
  }

  const fsImpl = fs ?? createDefaultFS();
  const { outputPath, maxAgents } = options;
  const tmpPath = `${outputPath}.tmp`;

  const content = generateMarkdown(machine);

  try {
    await fsImpl.writeFile(tmpPath, content);
  } catch (_err) {
    machine.writeFail(maxAgents);
    return;
  }

  try {
    await fsImpl.rename(tmpPath, outputPath);
  } catch (_err) {
    // D26: tmp EXISTS, CLAUDE.md intact — do NOT unlink tmp
    machine.writeFail(maxAgents);
    return;
  }

  machine.writeMarkdown(maxAgents);
}
