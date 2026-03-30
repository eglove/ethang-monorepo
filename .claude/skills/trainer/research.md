# Research Methodology

## When to Run

Phase 2 of the Trainer flow — after Orient, before Clarify. Both legs run in parallel via the Agent tool. Do not skip research even when you feel confident; the brief sharpens the questions in Phase 3.

## Leg A — Subject Matter Research

Use WebSearch and WebFetch to find:
- Official documentation for the domain
- Established best practices and patterns
- Anti-patterns to avoid
- Real-world examples of the concept being automated

Search queries should be specific to the artifact's purpose:
- For "SQL query reviewer": search `SQL query review best practices`, `common SQL anti-patterns`, `automated SQL review checklist`
- For "security auditor": search `OWASP code review checklist`, `security code review automation`
- For "debate moderator agent": search `multi-agent debate LLM`, `AI expert panel synthesis patterns`

## Leg B — Existing Skill Research

Two sources:

**GitHub search:** Use WebSearch with queries like:
- `site:github.com SKILL.md "[topic]"`
- `github claude code skill "[topic]"`
- `claude code agent "[topic]" site:github.com`

Read found SKILL.md files and extract:
- Naming and description conventions
- Trigger condition patterns
- Checklist and step structures
- Sub-document organization
- Handoff formats (for agents and orchestrators)

**Local plugin cache:** Scan `~/.claude/plugins/cache/` for structurally similar skills:

```bash
find ~/.claude/plugins/cache -name "SKILL.md" | head -40
```

Read the 2-3 most structurally similar ones. Extract the same signals as GitHub search.

## Lesson File Handling

If the user attached a lesson file (transcript, document, PDF):

1. Read and summarize the lesson first — identify what it covers well
2. Scope both research legs to fill only the gaps the lesson doesn't cover
3. Do not duplicate lesson content in the brief

## Synthesis

After both legs complete, produce an internal research brief:

- **Subject-matter findings:** Top 3-5 insights about the domain
- **Structural patterns:** Best conventions found in existing skills (naming, triggers, checklists)
- **Gaps:** What the new artifact needs to address that no existing skill covers well
- **Artifact type inference:** Based on research, confirm or update the artifact type inferred during Orient

The brief informs the questions in Phase 3. Show it to the user only if they ask.
