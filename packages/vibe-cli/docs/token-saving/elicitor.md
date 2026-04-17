# Elicitor Session — Token Saving

**Date:** 2026-04-16
**Status:** COMPLETE
**Feature:** token-saving

---

## Purpose
Reduce token cost and improve efficiency across the vibe-cli pipeline through four initiatives: model routing (right-sizing models per role), search tool hooks (Everything CLI and ripgrep), and a knowledge graph that produces a dense machine-readable codebase index for agent context.

## Artifact / Output Type
- PowerShell config file (`config/model-routing.psd1`) for model routing
- Claude Code hooks (`.claude/hooks/es-hook.ps1`, `.claude/hooks/rg-hook.ps1`) in monorepo `.claude/settings.json`
- TypeScript knowledge graph (`packages/vibe-cli/graph/`) with markdown output replacing root `CLAUDE.md`
- Updated `Invoke-Claude` with `$Role` and `$Model` parameters

## Trigger
- **Model routing**: Every `Invoke-Claude` call — role determines model via centralized mapping
- **Hooks**: `PreToolUse` on Bash and PowerShell tool calls within the monorepo
- **Knowledge graph**: Agent close hook after each individual agent finishes

## Inputs

### Model Routing
- `$Role` parameter (required, validated enum): `elicitor`, `doc-writer`, `expert`, `moderator`, `reviewer`, `code-writer`
- `$Model` parameter (optional): overrides centralized mapping when provided
- Centralized mapping in `config/model-routing.psd1`

### Everything CLI Hook
- Bash/PowerShell tool calls containing: `find`, `ls`, `dir`, `Get-ChildItem`, `gci`
- All occurrences rewritten to `es` — including plain `ls` and `Get-ChildItem` (not just recursive/glob patterns)

### ripgrep Hook
- Bash/PowerShell tool calls containing: `grep`, `egrep`, `fgrep`, `Select-String`, `sls`
- `Get-Content` only when combined with search patterns (not plain file reads)
- All occurrences rewritten to `rg`

### Knowledge Graph
- Agent discoveries during their work — files, functions, components, relationships
- Agents write `.addNode()` / `.addEdge()` calls into graph TypeScript files via system prompt instructions

## Outputs

### Model Routing
- Claude CLI invocations with the appropriate `--model` flag per role

### Hooks
- Rewritten shell commands using `es` or `rg` instead of native search tools
- Failures surface as-is with no fallback

### Knowledge Graph
- Dense, machine-readable markdown file written to repo root `CLAUDE.md`
- Format: node types as headers with comma-separated items, edge types as headers with comma-separated relationships
- Example:
  ```
  ## Files
  vibe.ps1, invoke-claude.ps1, state-repository.psd1

  ## calls
  vibe.ps1 -> invoke-claude.ps1, invoke-claude.ps1 -> state-repository.psd1

  ## depends_on
  invoke-claude.ps1 -> state-repository.psd1
  ```

## Ecosystem Placement
Integrated into the existing vibe-cli pipeline. Model routing modifies the core `Invoke-Claude` utility. Hooks are monorepo-level Claude Code settings. Knowledge graph is a new subsystem within vibe-cli consumed by all agents via `CLAUDE.md`.

## Handoff
- Model routing: consumed by all pipeline stages that call `Invoke-Claude`
- Hooks: transparent to agents — they issue search commands, hooks rewrite them
- Knowledge graph: each agent's close hook rebuilds markdown, next agent reads updated `CLAUDE.md`

## Error States

### Model Routing
- Unknown role → **halt pipeline** (fail fast, don't run on wrong model)
- Missing mapping entry → halt pipeline

### Hooks
- Rewritten command fails → error surfaces to agent as-is, no fallback to original command
- Hook script itself fails → error surfaces to agent

### Knowledge Graph
- Duplicate node/edge detected at build time → **error sent back to agent** to fix (3 retry attempts)
- After 3 retries exhausted → force-deduplicate (keep first entry, drop later duplicates), log which entries were dropped, continue pipeline
- Other graph compilation failures → log warning, continue pipeline
- Node identity is full path: `/dir1/file` and `/dir2/file` are distinct; `/dir/file` and `/dir/file` are duplicates

## Name
token-saving

## Scope

### In Scope
- `$Role` (required, validated enum) and `$Model` (optional override) parameters on `Invoke-Claude`
- Centralized `.psd1` model mapping: elicitor→opus, doc-writer→sonnet, expert→sonnet, moderator→opus, reviewer→haiku, code-writer→sonnet
- `PreToolUse` hooks for Bash and PowerShell in monorepo `.claude/settings.json`
- Separate hook script files at `.claude/hooks/es-hook.ps1` and `.claude/hooks/rg-hook.ps1`
- TypeScript knowledge graph at `packages/vibe-cli/graph/` mirroring repo directory structure
- `data-structure-typed` `DirectedGraph` with thin typed wrapper enforcing node/edge types
- Node types: `app`, `package`, `component`, `function`, `file` (expandable)
- Edge types: `calls`, `imports`, `exports`, `depends_on`, `contains`, `tested_by`, `test_for` (expandable)
- System prompt instructions for all agent roles to update graph
- Close hook per agent: runs `tsx graph/index.ts` → writes markdown → overwrites root `CLAUDE.md`
- Graph starts clean (no initial seeding/scanning)

### Out of Scope
- Dynamic model routing based on prompt complexity
- Graph visualization or UI
- RTK (Rust Token Killer) modifications
- Hooks for non-search tools (curl, docker, etc.)
- Graph seeding from existing codebase

## Edge Cases
- Agent passes a role not in the validated enum → pipeline halts with clear error
- `es` or `rg` not installed on machine → hook error surfaces to agent
- `Get-Content` used for plain file reading (no search pattern) → hook does NOT intercept
- Multiple agents discover the same node/edge → deduplicated at build time, duplicate fails build, agent retries up to 3 times, then force-dedup
- Graph files for areas of the codebase not yet discovered → those directories simply don't exist in `graph/` yet
- Agent creates graph entries with wrong paths → full-path identity means they become orphan nodes (no automatic cleanup)
- Close hook fails on non-duplicate error → warn and continue, stale `CLAUDE.md` persists until next successful build

## Notes
- All features MUST be complete and fully wired up to the rest of the program. No partial implementations or dead code paths.
- Every feature MUST include unit tests, integration tests, and end-to-end (e2e) tests.
- The final task for this feature is to review completeness: verify all e2e and integration tests pass, and confirm the feature is fully wired into the application.

---

## Open Questions
None
