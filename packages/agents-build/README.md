# agents-build

Generates Google Antigravity plugins (rules, skills, hooks) into `.agents/` from typed TypeScript definitions. All generated output is committed to the repository and regenerated via `pnpm --filter @ethang/agents-build build`.

## Overview

This package compiles TypeScript plugin definitions into Google Antigravity customizations, including workspace rules, skill references, and lifecycle hooks. The build process validates output against Antigravity constraints and checks for drift.

## Layout

Generated artifacts are committed under `.agents/`:

```
.agents/
├── plugins/
│   ├── git/           # Git workflow plugin
│   ├── tdd/           # TDD pipeline + DDD/RCA skills plugin
│   ├── review/        # PR review pipeline + checklists plugin
│   └── requirements/  # Requirements pipeline plugin
│       ├── plugin.json
│       ├── rules/*.md
│       └── skills/<skill-name>/
│           ├── SKILL.md
│           └── resources/
├── hooks.json         # Workspace lifecycle hooks (generated)
└── lessons.md         # Mutable lessons file, seeded once, owned by lesson hooks (never regenerated)
```

Each plugin bundles:
- **Always-on rules**: `philosophy.md` — activate unconditionally
- **Router skill**: Named `swebok-glossary`, `tdd-principles`, etc. — points to 18 SWEBOK chapter resources (read max 3 per task)

## The Four Plugins

1. **git** — Commit workflow: branch naming, commit message structure, pre-commit checks
2. **tdd** — Red-Green-Refactor pipeline, test design, roles, plus DDD (strategic/tactical), RCA (5-Whys), and SWEBOK router skill
3. **review** — PR review pipeline, code review checklist, security checklist, plus edge-case smart rules
4. **requirements** — Requirements analysis pipeline, SWEBOK 18-chapter router skill

## Build Tripwires

The build process validates generated output:

- **12,000-char rule limit** — Antigravity caps rule files; oversized rules fail the build
- **Forbidden vocabulary scan** — Detects source-workspace vocabulary (e.g., "shw-angular-workspace", "SmartHub") leaking into shared plugins; flags as error
- **SWEBOK router drift guard** — Ensures all 18 chapters are present and correctly indexed
- **Unresolved `{{sections}}` token scan** — Flags any inline section references not inlined at build time
- **Skill reference integrity** — Validates all skillRef pointers exist in the plugin definition

## Verification Checklist (Manual, in Antigravity UI)

After deploying:

1. Open the workspace in Google Antigravity
2. Navigate to **Customizations** and verify all 4 plugins are present (git, tdd, review, requirements)
3. For each plugin, check that its rules show the intended activation mode:
   - Philosophy rule: **Always On** (no frontmatter)
5. If modes don't render correctly, verify `.agents/plugins/<name>/rules/*.md` files contain frontmatter `trigger:` fields in YAML block at the top
   - Antigravity recognizes the Windsurf-lineage frontmatter convention; if it doesn't render, the fallback is emitting rules without frontmatter and setting modes once in the Antigravity UI manually (see `renderRuleFrontmatter()` in `src/render.ts`)

## Lessons Hooks

Two lifecycle hooks manage conversation lessons:

**PreInvocation hook:**
- Injects `.agents/lessons.md` at the first invocation of a conversation
- Ensures recent learnings are visible to the model from the start

**Stop hook (gated):**
- Triggers when the workspace is fully idle (`fullyIdle`)
- Deduped per conversation via `.lessons-state.json` to avoid duplicate dispatches
- Rate-limited to 1 dispatch per hour
- Spawns a detached worker that dispatches lesson extraction via `agentapi new-conversation`
- Falls back to `claude --print` if agentapi unavailable
- Logs all activity to `lessons.log`

### Smoke Test Steps

1. **Hold a short conversation** in the workspace
2. **Let it go fully idle** (no model activity for the idle timeout)
3. **Check `lessons.log`** for one dispatch entry; verify a second idle period produces no new dispatch (rate-limiting works)
4. **Confirm `.agents/lessons.md` updated** and stays under 12k chars
5. **Start a new conversation** and verify the first invocation includes the updated lessons in context
6. **Open assumptions to verify against a real session:**
   - Antigravity `transcript.jsonl` format compatibility
   - `agentapi` availability on PATH in hook execution context
   - Hook command execution with correct cwd (workspace root)

## Build Command

```bash
pnpm --filter @ethang/agents-build build
```

This runs `bun src/compile.ts`, which requires Bun as a workspace devDependency. Bun is installed automatically via `pnpm install --frozen-lockfile`.

## CI Integration

The workflow job `agents-build-drift` runs the build and checks that `.agents/` and `packages/agents-build/` remain unchanged. If the build generates different output than what's committed, the CI job fails.

```yaml
- run: git diff --exit-code -- .agents packages/agents-build
```

## Notes

- Root ESLint config globally ignores `**/README.md`, so no lint concerns
- All lesson state and logs live under `packages/agents-build/` and are git-ignored per `.gitignore`
- The build is deterministic; any source changes must regenerate the output before commit
