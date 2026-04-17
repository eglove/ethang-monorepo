import type { DedupStateMachine } from './dedup.js';

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
// Markdown generation
// ---------------------------------------------------------------------------

/**
 * Generates the dense machine-readable markdown from the state machine's
 * collected nodes and edges.
 *
 * Format:
 *   ## file
 *   pkg/a.ts, pkg/b.ts
 *
 *   ## imports
 *   pkg/a.ts -> pkg/b.ts
 */
function generateMarkdown(machine: DedupStateMachine): string {
  const lines: string[] = [];

  // Nodes section
  if (machine.graphNodes.size > 0) {
    lines.push('## file');
    lines.push([...machine.graphNodes].join(', '));
  }

  // Edges section
  if (machine.graphEdges.size > 0) {
    if (lines.length > 0) lines.push('');
    lines.push('## imports');
    const edgeLines = [...machine.graphEdges].map((e) => e.replace('→', ' -> '));
    lines.push(edgeLines.join(', '));
  }

  return lines.join('\n') + '\n';
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
        // Ignore errors — temp file may not exist
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
  // Handle halt case (S33)
  if (options.pipelineHalted) {
    machine.haltCleanup();
    return;
  }

  const fsImpl = fs ?? createDefaultFS();
  const { outputPath, maxAgents } = options;
  const tmpPath = `${outputPath}.tmp`;

  const content = generateMarkdown(machine);

  // Step 1: Write to temp file
  try {
    await fsImpl.writeFile(tmpPath, content);
  } catch (_err) {
    // Temp write failed — call writeFail, tmp may not exist
    machine.writeFail(maxAgents);
    return;
  }

  // Step 2: Atomic rename tmp → final
  try {
    await fsImpl.rename(tmpPath, outputPath);
  } catch (_err) {
    // Rename failed — D26 distinct failure path
    // tmp EXISTS, CLAUDE.md is intact — do NOT unlink tmp
    machine.writeFail(maxAgents);
    return;
  }

  // Step 3: Success
  machine.writeMarkdown(maxAgents);
}
