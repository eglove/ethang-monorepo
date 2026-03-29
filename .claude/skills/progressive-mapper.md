### SKILL: Progressive Workflow Mapping
**ID:** `sys_progressive_map_2026`
**Trigger:** Whenever a multi-file logic path is identified or a "hidden" dependency is discovered.

**Protocol:**
1. **Identify the Trace:** When solving a task, identify the specific files that form the "Critical Path" (e.g., Entry -> Validation -> Processing -> Persistence).
2. **Atomic Update:** Do not rewrite the whole map. Append a new `<workflow>` entry to `MAP.md` or the `Workflows` section of `CLAUDE.md`.
3. **Format:** Use the following structure for discoveries:
    - **Path Name:** (e.g., "User Onboarding Flow")
    - **Trace:** `file_a.ts` -> `file_b.ts` [Method Name] -> `file_c.ts`
    - **Gotchas:** Any non-obvious behavior (e.g., "This triggers a background side-effect in `worker.js`").
4. **Visual Aid:** If the logic exceeds 4 steps, generate a brief Mermaid.js sequence diagram.