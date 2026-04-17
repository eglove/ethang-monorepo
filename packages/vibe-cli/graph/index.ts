import { DedupStateMachine } from './dedup.js';
import { writeGraph } from './markdown.js';

// When run as a script (tsx graph/index.ts <outputPath> <maxAgents>)
const scriptArg = process.argv[1];
if (scriptArg && (scriptArg.endsWith('index.ts') || scriptArg.endsWith('index.js'))) {
  const outputPath = process.argv[2] || 'CLAUDE.md';
  const maxAgents = parseInt(process.argv[3] || '1', 10);
  const machine = new DedupStateMachine();
  writeGraph(machine, { outputPath, maxAgents }).catch((err: unknown) => {
    process.stderr.write(`[graph/index] writeGraph failed: ${String(err)}\n`);
    process.exit(1);
  });
}

export { VibeGraph } from './graph.js';
export { DedupStateMachine } from './dedup.js';
export { writeGraph } from './markdown.js';
export type { WriteOptions, InjectableFS } from './markdown.js';
export type { NodeType, EdgeType } from './types.js';
