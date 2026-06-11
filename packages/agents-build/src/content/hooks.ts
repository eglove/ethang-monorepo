/**
 * Workspace-level .agents/hooks.json. Emitted once at the workspace level —
 * NOT per plugin, because a plugin-root hooks.json in every plugin would
 * register the same hooks multiple times and fire duplicates.
 *
 * Antigravity hook I/O contract: JSON on stdin -> JSON on stdout, camelCase.
 * Stop's default timeout would reap slow work, so stop.ts detaches a worker
 * and returns immediately.
 */
export const HOOKS = {
  "lessons-extract": {
    Stop: [
      {
        command: "bun packages/agents-build/src/hooks/stop.ts",
        timeout: 15,
        type: "command"
      }
    ]
  },
  "lessons-inject": {
    PreInvocation: [
      {
        command: "bun packages/agents-build/src/hooks/pre-invocation.ts",
        type: "command"
      }
    ]
  }
};

export const LESSONS_SEED = `# Learned Lessons

## Corrections

*(none yet)*

## Proven Patterns

*(none yet)*
`;
