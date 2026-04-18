import type { DedupStateMachine } from "./dedup.js";
import type { EdgeType, NodeType } from "./types.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InjectableFS = {
  rename: (from: string, to: string) => Promise<void>;
  unlink: (path: string) => Promise<void>;
  writeFile: (path: string, content: string) => Promise<void>;
};

export type WriteOptions = {
  maxAgents: number;
  /** Absolute path to CLAUDE.md */
  outputPath: string;
  /** If true, calls haltCleanup instead of writeMarkdown/writeFail */
  pipelineHalted?: boolean;
};

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
  if (true === options.pipelineHalted) {
    machine.haltCleanup();
    return;
  }

  const fsImpl = fs ?? createDefaultFS();
  const { maxAgents, outputPath } = options;
  const temporaryPath = `${outputPath}.tmp`;

  const content = generateMarkdown(machine);

  try {
    await fsImpl.writeFile(temporaryPath, content);
  } catch {
    machine.writeFail(maxAgents);
    return;
  }

  try {
    await fsImpl.rename(temporaryPath, outputPath);
  } catch {
    // D26: tmp EXISTS, CLAUDE.md intact — do NOT unlink tmp
    machine.writeFail(maxAgents);
    return;
  }

  machine.writeMarkdown(maxAgents);
}

// ---------------------------------------------------------------------------
// Default filesystem (real Node.js fs)
// ---------------------------------------------------------------------------

function createDefaultFS(): InjectableFS {
  return {
    rename: async (from: string, to: string) => {
      const { rename } = await import("node:fs/promises");
      await rename(from, to);
    },
    unlink: async (filePath: string) => {
      const { unlink } = await import("node:fs/promises");
      try {
        await unlink(filePath);
      } catch {
        // tmp may not exist — ignore
      }
    },
    writeFile: async (filePath: string, content: string) => {
      const { writeFile } = await import("node:fs/promises");
      await writeFile(filePath, content, "utf8");
    },
  };
}

// ---------------------------------------------------------------------------
// writeGraph — main entry point
// ---------------------------------------------------------------------------

function generateMarkdown(machine: DedupStateMachine): string {
  const nodes = machine.graph.getNodes();
  const edges = machine.graph.getEdges();

  const nodesByType = new Map<NodeType, string[]>();
  for (const node of nodes) {
    const bucket = nodesByType.get(node.type) ?? [];
    bucket.push(node.path);
    nodesByType.set(node.type, bucket);
  }

  const edgesByType = new Map<EdgeType, string[]>();
  for (const edge of edges) {
    const bucket = edgesByType.get(edge.type) ?? [];
    bucket.push(`${edge.from} -> ${edge.to}`);
    edgesByType.set(edge.type, bucket);
  }

  const sections: string[] = [];
  for (const [type, paths] of nodesByType) {
    sections.push(`## ${type}\n${paths.join(", ")}`);
  }
  for (const [type, pairs] of edgesByType) {
    sections.push(`## ${type}\n${pairs.join(", ")}`);
  }

  return 0 === sections.length ? "\n" : `${sections.join("\n\n")}\n`;
}
