# AGENTS.md

This document outlines the global rules, development principles, and tool-usage hierarchies for AI agents operating in
`ethang-monorepo`.

> [!IMPORTANT]
> The [swebok](file:///C:/Users/glove/projects/ethang-monorepo/.agents/skills/swebok/SKILL.md) skill must always be read using the `view_file` tool right away to provide foundational knowledge and guidance on all tasks.

> [!IMPORTANT]
> The [atdd-fsm-tdd](file:///C:/Users/glove/projects/ethang-monorepo/.agents/skills/atdd-fsm-tdd/SKILL.md) skill must be read using the `view_file` tool and followed for all feature development tasks.

> [!IMPORTANT]
> All tasks on this repository should follow the [ddd](file:///C:/Users/glove/projects/ethang-monorepo/.agents/skills/ddd/SKILL.md) principles.

> [!IMPORTANT]
> ESLint should **never** be directly run or fixed manually by an agent. All linting tasks must be routed exclusively through the [lint](file:///C:/Users/glove/projects/ethang-monorepo/.agents/skills/lint/SKILL.md) skill.

> [!IMPORTANT]
> Always read and respect the [tool-usage-hierarchy](file:///C:/Users/glove/projects/ethang-monorepo/.agents/rules/tool-hierarchy.md) rule. It defines a strict priority order for tool selection and must be followed at all times.

---

## CRITICAL: `.agents/` is a Generated Artifact

**Never edit files in `.agents/` directly.** The `.agents/` directory (which contains workspace rules, lifecycle hooks,
and skills) is compiled from TypeScript definitions and will be overwritten on the next build. Any direct edits will be
lost.

All changes to agent rules, commands, skills, and configuration must go through the compiler package:

* **Source Path:** [packages/agents-build/](packages/agents-build/)

After modifying TypeScript definitions in the builder, compile the changes with:

```bash
pnpm --filter @ethang/agents-build build
```

This compiles the configurations into the `.agents/` directory, validating rules against sizing limits, SWEBOK router
integrity, and drift checks.

---

## Parallel Agent Execution & Efficiency

To optimize resource usage, latency, and token consumption:

* **Fan out work** into parallel subagents as often as possible.
* **Choose the minimum model and effort level** required for each task to minimize token usage.

## Package Dependency Conventions

When installing and using packages in this repository, **do not assume the `workspace:*` convention**. Many packages are published and installed via the registry. Always look at how other apps/packages use them before adding a new dependency.

---

## Skills Table of Contents

Below is a categorized reference of all available skills in `.agents/skills/`. Each skill provides domain-specific guidance, scripts, and best practices. Load the relevant skill's `SKILL.md` before starting work in that domain.

### Cloudflare Platform (10)

| Skill | When to Use |
|-------|-------------|
| `agents-sdk` | Building stateful AI agents on Cloudflare Workers — WebSocket apps, MCP servers, chat/voice agents, durable workflows |
| `cloudflare` | Any Cloudflare development task — Workers, Pages, KV, D1, R2, AI, networking, security, Terraform |
| `cloudflare-email-service` | Sending transactional emails or routing incoming emails with Cloudflare Email Service |
| `cloudflare-one` | Designing, configuring, or troubleshooting Cloudflare One Zero Trust (Access, Gateway, WARP, Tunnel, DLP, CASB) |
| `cloudflare-one-migrations` | Migrating from Zscaler, Palo Alto, legacy VPN/SWG to Cloudflare One |
| `durable-objects` | Building stateful coordination (chat rooms, games, booking), RPC methods, SQLite storage, alarms |
| `sandbox-sdk` | Building secure isolated code execution environments for AI code interpreters, CI/CD, untrusted code |
| `turnstile-spin` | Setting up Cloudflare Turnstile CAPTCHA end-to-end (widget, Worker, frontend, validation) |
| `workers-best-practices` | Reviewing or writing Cloudflare Workers code against production best practices |
| `wrangler` | Deploying, developing, managing Workers and Cloudflare services (KV, R2, D1, Queues, etc.) |

### Development Process (6)

| Skill | When to Use |
|-------|-------------|
| `atdd-fsm-tdd` | Feature development using ATDD with FSM modeling and Red-Green-Refactor TDD (Vitest) |
| `commit` | Staging and committing changes — enforces Conventional Commits, RFC 2119, emoji bullets |
| `ddd` | Domain-Driven Design — bounded contexts, aggregates, CQRS, specifications, clean architecture |
| `hermes-forge` | Reading/writing Forge project state via `forge orient`/`forge recap` in a Forge-initialized repo |
| `sdlc` | Navigating the full software development lifecycle across 6 phases with 80+ workspace rules |
| `swebok` | Foundational software engineering guidelines from IEEE SWEBOK v4 — requirements, design, testing, maintenance |

### Code Quality & Analysis (3)

| Skill | When to Use |
|-------|-------------|
| `lint` | Any linting tasks — ALWAYS route through this skill, never run ESLint directly |
| `sonarcloud-analysis` | Pulling issues, metrics, quality gates, and security vulnerabilities from SonarCloud |
| `troubleshooting` | Fixing Chrome DevTools MCP connection/target issues when `list_pages`, `new_page`, or `navigate_page` fail |

### Browser & DevTools (4)

| Skill | When to Use |
|-------|-------------|
| `a11y-debugging` | Testing accessibility — semantic HTML, ARIA labels, focus states, keyboard navigation, color contrast |
| `chrome-devtools` | Debugging web pages, automating browser interactions, analyzing performance via Chrome DevTools MCP |
| `chrome-devtools-cli` | Writing shell scripts to automate browser tasks via Chrome DevTools CLI |
| `debug-optimize-lcp` | Debugging and optimizing Largest Contentful Paint (LCP) and Core Web Vitals |

### Performance & Debugging (4)

| Skill | When to Use |
|-------|-------------|
| `memory-leak-debugging` | Diagnosing memory leaks in JS/Node.js — high memory usage, OOM errors, heapsnapshot analysis |
| `web-perf` | Auditing web performance — Core Web Vitals (LCP, INP, CLS), render-blocking, network chains |
| `webstorm-mcp` | Using WebStorm MCP tools — file operations, search, refactoring, build, database queries |
| `codebase-memory-mcp` | Discovering code, tracing execution paths, querying workspace architecture via MCP graph tools |

### Search & CLI Tools (5)

| Skill | When to Use |
|-------|-------------|
| `everything-search` | Instant filesystem lookups via Everything Search engine (Windows MFT) |
| `github-cli` | Managing GitHub PRs, issues, CI/CD workflows via `gh` CLI |
| `jq` | Slicing, filtering, mapping, and formatting JSON files |
| `ripgrep` | Fast regex-based codebase search via `rg` |
| `sara-cli` | Managing requirements and validating design traceability via SARA CLI |

### TanStack (14)

| Skill | When to Use |
|-------|-------------|
| `tanstack-ai` | Building AI chat interfaces and streaming UI with TanStack AI utilities |
| `tanstack-cli` | Scaffolding and managing TanStack projects via the TanStack CLI |
| `tanstack-config` | Configuring TanStack tools and managing shared configuration |
| `tanstack-db` | Building type-safe database applications with TanStack DB |
| `tanstack-devtools` | Debugging TanStack applications with dedicated DevTools |
| `tanstack-form` | Building type-safe forms with validation using TanStack Form |
| `tanstack-pacer` | Rate-limiting, throttling, and queueing async operations |
| `tanstack-query` | Server-state management, data fetching, caching, pagination, optimistic updates |
| `tanstack-ranger` | Building accessible, customizable range sliders and multi-handle inputs |
| `tanstack-router` | Type-safe routing for React/Next.js/Solid/Svelte with TanStack Router |
| `tanstack-start` | Full-stack SSR framework with TanStack Router, Start, and server functions |
| `tanstack-store` | Lightweight reactive state management for React/Vue/Solid/Svelte |
| `tanstack-table` | Building powerful data tables with sorting, filtering, pagination, grouping |
| `tanstack-virtual` | Virtualizing large lists and grids for performance |

### AI & Research (2)

| Skill | When to Use |
|-------|-------------|
| `find-skills` | Discovering and installing new agent skills from the open skills ecosystem |
| `parallel-deep-research` | Producing comprehensive research reports via Parallel AI — market analysis, competitive landscapes |
